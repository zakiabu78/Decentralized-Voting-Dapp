// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract VotingSystem is AccessControl, ReentrancyGuard, Pausable {

    // --- STATE VARIABLES ---
    address public votingOrganizer;
    uint256 public candidateId;
    uint256 public voterId;
    uint256 public votingStart;
    uint256 public votingEnd;
    uint256 public constant MAX_CANDIDATES = 20;
    uint256 public constant ROUND2_DURATION = 5 minutes;
    uint256 public currentRound = 1;
    bool    public round2Triggered = false;

    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");

    constructor() {
        votingOrganizer = msg.sender;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORGANIZER_ROLE, msg.sender);

        votingStart = block.timestamp;
        votingEnd = block.timestamp + 90 minutes;
    }

    // --- DATA STRUCTURES ---
    struct Candidate {
        uint256 candidate_id;
        string  candidate_name;
        uint256 candidate_age;
        string  candidate_image;
        uint256 candidate_voteCount;
        address candidate_address;
        string  candidate_ipfs;
        bool    isActive;
    }

    struct Voter {
        uint256 voter_id;
        string  voter_name;
        uint256 voter_age;
        address voter_address;
        string  voter_image;
        bool    isVoter;
        bool    hasVoted;
        uint256 voter_vote;
        string  voter_ipfs;
        uint256 lastRoundVoted;
        bool    isActive;
    }

    address[] public candidateAddress;
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool)      public isCandidate;
    mapping(address => uint256)   private candidateIdByAddress;

    address[] public voterAddress;
    address[] public votedVotersAddress;
    mapping(address => Voter) private voters;

    // --- EVENTS ---
    event CreateCandidate(uint256 indexed id, address _address);
    event CreateVoter(uint256 indexed voter_id, address voter_address);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event RoundStarted(uint256 round, uint256 newEnd);
    event VoterDeactivated(address indexed voter);
    event VoterReactivated(address indexed voter);
    event CandidateDeactivated(address indexed candidate);
    event CandidateReactivated(address indexed candidate);
    event VotingPeriodUpdated(uint256 start, uint256 end); // [FIX-3] traceability for admin changes

    // --- INTERNAL HELPER ---
    function _getCandidateIdByAddress(address _addr) private view returns (uint256) {
        return candidateIdByAddress[_addr];
    }

    // --- INTERNAL: check if round 2 is needed ---
    function _needsRound2() private view returns (bool) {
        uint256 maxVotes = 0;
        uint256 tieCount = 0;
        uint256 totalVotesCast = 0;

        for (uint256 i = 1; i <= candidateId; i++) {
            if (!candidates[i].isActive) continue;
            totalVotesCast += candidates[i].candidate_voteCount;
            if (candidates[i].candidate_voteCount > maxVotes) {
                maxVotes = candidates[i].candidate_voteCount;
                tieCount = 1;
            } else if (candidates[i].candidate_voteCount == maxVotes && maxVotes > 0) {
                tieCount++;
            }
        }

        // Round 2 needed if: 0 votes OR tie between 2+ candidates
        return (totalVotesCast == 0 || tieCount > 1);
    }

    // --- PUBLIC: anyone can call this after session ends ---
    function triggerRound2IfNeeded() external {
        require(block.timestamp > votingEnd, "Session not finished yet.");
        require(!round2Triggered, "Round 2 already triggered.");
        require(currentRound == 1, "Only one automatic round 2 is allowed.");
        require(_needsRound2(), "There is a clear winner, No Round 2 needed.");

        round2Triggered = true;
        currentRound++;
        votingStart = block.timestamp;
        votingEnd = block.timestamp + ROUND2_DURATION;

        for (uint256 i = 1; i <= candidateId; i++) {
            if (candidates[i].isActive) {
                candidates[i].candidate_voteCount = 0;
            }
        }

        delete votedVotersAddress;

        emit RoundStarted(currentRound, votingEnd);
    }

    // --- ADMIN : REGISTER ---
    function setCandidate(
        address _address,
        string memory _name,
        uint256 _age,
        string memory _image,
        string memory _ipfs
    ) public onlyRole(ORGANIZER_ROLE) {
        require(_address != address(0), "Zero address not allowed."); // [FIX-4]
        require(candidateId < MAX_CANDIDATES, "Candidate limit reached.");
        require(!isCandidate[_address], "Address already registered as candidate.");
        require(
            !voters[_address].isVoter || !voters[_address].isActive,
            "This address is an active voter and cannot be registered as a candidate."
        );

        isCandidate[_address] = true;
        candidateId++;
        candidates[candidateId] = Candidate(
            candidateId, _name, _age, _image, 0, _address, _ipfs, true
        );
        candidateAddress.push(_address);
        candidateIdByAddress[_address] = candidateId;

        emit CreateCandidate(candidateId, _address);
    }

    function setVoter(
        address _address,
        string memory _image,
        string memory _name,
        uint256 _age,
        string memory _ipfs
    ) public onlyRole(ORGANIZER_ROLE) {
        require(_address != address(0), "Zero address not allowed."); // [FIX-4]
        require(!voters[_address].isVoter, "Voter already registered.");

        uint256 cId = _getCandidateIdByAddress(_address);
        require(
            !isCandidate[_address] || (cId > 0 && !candidates[cId].isActive),
            "This address is an active candidate and cannot be registered as a voter."
        );

        voterId++;
        voters[_address] = Voter(
            voterId, _name, _age, _address, _image, true, false, 0, _ipfs, 0, true
        );
        voterAddress.push(_address);

        emit CreateVoter(voterId, _address);
    }

    // --- ADMIN : DEACTIVATE / REACTIVATE ---
    function deactivateVoter(address _address) public onlyRole(ORGANIZER_ROLE) {
        require(voters[_address].isVoter, "Not a registered voter.");
        require(voters[_address].isActive, "Voter is already inactive.");
        voters[_address].isActive = false;
        emit VoterDeactivated(_address);
    }

    function reactivateVoter(address _address) public onlyRole(ORGANIZER_ROLE) {
        require(voters[_address].isVoter, "Not a registered voter.");
        require(!voters[_address].isActive, "Voter is already active.");
        uint256 cId = _getCandidateIdByAddress(_address);
        require(
            !isCandidate[_address] || (cId > 0 && !candidates[cId].isActive),
            "This address is an active candidate."
        );
        voters[_address].isActive = true;
        emit VoterReactivated(_address);
    }

    function deactivateCandidate(address _address) public onlyRole(ORGANIZER_ROLE) {
        require(isCandidate[_address], "Not a registered candidate.");
        uint256 cId = _getCandidateIdByAddress(_address);
        require(cId > 0, "Candidate ID not found.");
        require(candidates[cId].isActive, "Candidate is already inactive.");
        candidates[cId].isActive = false;
        emit CandidateDeactivated(_address);
    }

    function reactivateCandidate(address _address) public onlyRole(ORGANIZER_ROLE) {
        require(isCandidate[_address], "Not a registered candidate.");
        uint256 cId = _getCandidateIdByAddress(_address);
        require(cId > 0, "Candidate ID not found.");
        require(!candidates[cId].isActive, "Candidate is already active.");
        require(
            !voters[_address].isVoter || !voters[_address].isActive,
            "This address is an active voter."
        );
        candidates[cId].isActive = true;
        emit CandidateReactivated(_address);
    }

    // --- VOTING PERIOD ---
    // [FIX-1 / HIGH] Previously callable at any time, including mid-election, letting
    // ORGANIZER_ROLE shorten, extend, or reopen an active/finished voting window at will
    // (election-integrity / centralization risk). Now locked once voting has started.
    function setVotingPeriod(uint256 _start, uint256 _end) public onlyRole(ORGANIZER_ROLE) {
        require(block.timestamp < votingStart, "Cannot modify an active or concluded voting period.");
        require(_start + 60 >= block.timestamp, "Start cannot be in the past."); // [FIX-2] no underflow
        require(_start < _end, "Start must be before end.");
        votingStart = _start;
        votingEnd = _end;
        emit VotingPeriodUpdated(_start, _end);
    }

    // --- VOTING FUNCTION ---
    function vote(uint256 _candidateId) external nonReentrant whenNotPaused {
        require(
            block.timestamp >= votingStart && block.timestamp <= votingEnd,
            "Election is closed."
        );
        require(_candidateId > 0 && _candidateId <= candidateId, "Invalid candidate ID.");
        require(candidates[_candidateId].isActive, "This candidate is inactive.");

        uint256 senderCId = _getCandidateIdByAddress(msg.sender);
        require(
            !isCandidate[msg.sender] || (senderCId > 0 && !candidates[senderCId].isActive),
            "Active candidates cannot vote."
        );

        Voter storage voter = voters[msg.sender];
        require(voter.isVoter, "Not a registered voter.");
        require(voter.isActive, "Voter account is inactive.");
        require(voter.lastRoundVoted < currentRound, "Already voted in this round.");

        voter.hasVoted = true;
        voter.lastRoundVoted = currentRound;
        voter.voter_vote = _candidateId;

        candidates[_candidateId].candidate_voteCount++;
        votedVotersAddress.push(msg.sender);

        emit VoteCast(msg.sender, _candidateId);
    }

    // --- GETTERS ---
    function getCandidateData(uint256 _id) public view returns (Candidate memory) {
        require(_id > 0 && _id <= candidateId, "Invalid candidate ID.");
        return candidates[_id];
    }

    function getVoterData(address _addr) public view returns (
        uint256 id,
        string memory name,
        address addr,
        string memory image,
        uint256 age,
        bool hasVoted,
        string memory ipfs,
        bool isActive
    ) {
        Voter memory v = voters[_addr];
        // [FIX-5 / MEDIUM] v.hasVoted is never cleared on Round 2 reset, so it went stale
        // and misreported "already voted" status in the new round. Derive it live instead.
        bool hasVotedThisRound = v.lastRoundVoted == currentRound;
        return (v.voter_id, v.voter_name, v.voter_address, v.voter_image, v.voter_age, hasVotedThisRound, v.voter_ipfs, v.isActive);
    }

    function getWinner() public view returns (
        string memory winnerName,
        uint256 winnerVoteCount,
        bool isTie
    ) {
        require(block.timestamp > votingEnd, "Election is still ongoing.");
        require(candidateId > 0, "No candidates registered.");

        uint256 winningVoteCount = 0;
        uint256 winningCandidateId = 0;
        bool tie = false;

        for (uint256 i = 1; i <= candidateId; i++) {
            if (!candidates[i].isActive) continue;
            if (candidates[i].candidate_voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].candidate_voteCount;
                winningCandidateId = i;
                tie = false;
            } else if (
                candidates[i].candidate_voteCount == winningVoteCount &&
                winningVoteCount > 0
            ) {
                tie = true;
            }
        }

        require(winningVoteCount > 0, "No votes were cast.");
        return (candidates[winningCandidateId].candidate_name, winningVoteCount, tie);
    }

    // --- EMERGENCY ---
    function emergencyPause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // --- LIST GETTERS ---
    function getVoterList() public view returns (address[] memory) {
        return voterAddress;
    }

    function getCandidateList() public view returns (address[] memory) {
        return candidateAddress;
    }

    function getVotedVoterList() public view returns (address[] memory) {
        return votedVotersAddress;
    }
}
