import voting from '../artifacts/contracts/voting_contracts.sol/VotingSystem.json';

// When you run `npx hardhat compile`, Hardhat auto-generates a JSON file in artifacts/.
// It contains:
//  - The bytecode (the compiled contract)
//  - The ABI (Application Binary Interface): the list of all your contract's functions
//    and their parameters — the "menu" that tells ethers.js how to talk to the contract.

// Sepolia — address printed by the deploy script
export const votingAddress = "0xDD3C7030e908a4e5281F0e512593309C5185C941";

export const votingAddressABI = voting.abi;

if (!votingAddress) {
  console.error("Contract address is not configured!");
}