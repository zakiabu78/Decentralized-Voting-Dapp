"use client";

import { useState, useEffect, useRef, createContext } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { votingAddress, votingAddressABI } from './Constants';

// ============================================
// Helpers
// ============================================
export const getContract = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum!);
  const signer = await provider.getSigner();
  return new ethers.Contract(votingAddress, votingAddressABI, signer);
};

const getReadContract = () => {
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
  return new ethers.Contract(votingAddress, votingAddressABI, provider);
};

// ============================================
// Interface
// ============================================
interface VotingContextType {
  authLoading: boolean; 
  currentAccount: string;
  votingOrganizer: string;
  connectWallet: () => Promise<void>;
  error: string;
  isOrganizer: boolean;
  isVotingOpen: boolean;
  isRegisteredVoter: boolean;
  hasVoted: boolean;
  isCandidate: boolean;
  round2Triggered: boolean;
  isPaused: boolean;
  isVoterActive: boolean;
  networkError: string;
  uploadToIpfs: (file: File) => Promise<string | undefined>;
  createVoter: (address: string, name: string, age: number, imageUrl: string, ipfsUrl: string) => Promise<void>;
  createCandidate: (address: string, name: string, age: number, imageUrl: string, ipfsUrl: string) => Promise<void>;
  castVote: (candidateId: number) => Promise<void>;
  setVotingPeriod: (start: number, end: number) => Promise<void>;
  emergencyPause: () => Promise<void>;
  unpause: () => Promise<void>;
  getCandidates: () => Promise<any[]>;
  getVoters: () => Promise<any[]>;
  getVotedVoters: () => Promise<string[]>;
  getWinner: () => Promise<{ winnerName: string; winnerVoteCount: number; isTie: boolean } | undefined>;
  getVotingPeriod: () => Promise<{ start: number; end: number }>;
  getCurrentRound: () => Promise<number>;
  deactivateVoter: (address: string) => Promise<void>;
  reactivateVoter: (address: string) => Promise<void>;
  deactivateCandidate: (address: string) => Promise<void>;
  reactivateCandidate: (address: string) => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export const VotingContext = createContext<VotingContextType>({} as VotingContextType);

// ============================================
// Provider
// ============================================
export const VotingProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  
  // States
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentAccount, setCurrentAccount] = useState<string>('');
  const [votingOrganizer, setVotingOrganizer] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
  const [isVotingOpen, setIsVotingOpen] = useState<boolean>(false);
  const [isRegisteredVoter, setIsRegisteredVoter] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isCandidate, setIsCandidate] = useState<boolean>(false);
  const [round2Triggered, setRound2Triggered] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string>('');
  const [isVoterActive, setIsVoterActive] = useState<boolean>(true);

  // ============================================
  // Wallet & Status
  // ============================================
  const connectWallet = async (): Promise<void> => {
    if (!window.ethereum) { alert('Please install MetaMask.'); return; }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const checkIfWalletIsConnected = async (): Promise<void> => {
  if (!window.ethereum) { setAuthLoading(false); return; }
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (accounts.length) {
    setCurrentAccount(accounts[0]);
  } else {
    setAuthLoading(false); 
  }
};

  const loadUserStatus = async (): Promise<void> => {
    try {
      const contract = getReadContract();

      const organizer = await contract.votingOrganizer();
      setVotingOrganizer(organizer);

      const start = Number(await contract.votingStart());
      const end = Number(await contract.votingEnd());
      const now = Math.floor(Date.now() / 1000);
      setIsVotingOpen(now >= start && now <= end);

      const r2 = await contract.round2Triggered();
      setRound2Triggered(r2);
      
      const isPaused = await contract.paused();
      setIsPaused(isPaused);

      if (currentAccount) {
        const organizerRole = await contract.ORGANIZER_ROLE();
        setIsOrganizer(await contract.hasRole(organizerRole, currentAccount));

        const [id, , , , , , , isActive] = await contract.getVoterData(currentAccount);
        setIsRegisteredVoter(Number(id) > 0);
        setIsVoterActive(isActive);
        const votedList: string[] = await contract.getVotedVoterList();
        const votedThisRound = votedList
          .map((a) => a.toLowerCase())
          .includes(currentAccount.toLowerCase());
        setHasVoted(votedThisRound);

        const candidateCheck = await contract.isCandidate(currentAccount);
        setIsCandidate(candidateCheck);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setNetworkError('Weak or lost connection — retrying…');
      } else if (msg.includes('500')) {
        setNetworkError('Server error (500) — retrying…');
      }
      console.error("Status load error", err);
    }
  };

  // Logique Round 2
  const round2Attempted = useRef(false);
  const handleRound2Logic = async () => {
  if (!currentAccount || round2Attempted.current) return;   // ← stop repeating
  try {
    const contractRead = getReadContract();
    const end = Number(await contractRead.votingEnd());
    const alreadyDone = await contractRead.round2Triggered();
    const nowTs = Math.floor(Date.now() / 1000);
    if (nowTs <= end || alreadyDone) return;

    round2Attempted.current = true;   // ← mark it tried
    const contractSigner = await getContract();
    const tx = await contractSigner.triggerRound2IfNeeded();
    await tx.wait();
    setRound2Triggered(true);
    await loadUserStatus();
  } catch (err: any) {
    console.log("Round2 skipped:", err?.reason || err?.message);
  }
};

  // ============================================
  // IPFS & Transactions (Conservé tel quel)
  // ============================================
  const uploadToIpfs = async (file: File): Promise<string | undefined> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`;
    } catch (err) {
      setError('Error uploading file to IPFS.');
      return undefined;
    }
  };

  const createVoter = async (address: string, name: string, age: number, imageUrl: string, ipfsUrl: string) => {
    try {
      const contract = await getContract();
      const tx = await contract.setVoter(address, imageUrl, name, age, ipfsUrl);
      await tx.wait();
      router.push('/voter-list');
    } catch (err) { setError('Failed to register voter.'); throw err; }
  };

  const createCandidate = async (address: string, name: string, age: number, imageUrl: string, ipfsUrl: string) => {
    try {
      const contract = await getContract();
      const tx = await contract.setCandidate(address, name, age, imageUrl, ipfsUrl);
      await tx.wait();
      router.push('/candidate-list');
    } catch (err) { setError('Failed to register candidate.'); throw err; }
  };

  const castVote = async (candidateId: number) => {
    try {
      const contract = await getContract();
      const tx = await contract.vote(candidateId);
      await tx.wait();
      setHasVoted(true);
    } catch (err) { setError('Failed to cast vote.'); throw err; }
  };

  // ... (Toutes tes autres fonctions conservées)
  const setVotingPeriod = async (start: number, end: number) => {
    const contract = await getContract();
    const tx = await contract.setVotingPeriod(start, end);
    await tx.wait();
  };
  const emergencyPause = async () => {
    const contract = await getContract();
    const tx = await contract.emergencyPause();
    await tx.wait();
  };

  const unpause = async () => {
    const contract = await getContract();
    const tx = await contract.unpause();
    await tx.wait();
  };

  const deactivateVoter = async (address: string) => {
    const contract = await getContract();
    const tx = await contract.deactivateVoter(address);
    await tx.wait();
  };

  const reactivateVoter = async (address: string) => {
    const contract = await getContract();
    const tx = await contract.reactivateVoter(address);
    await tx.wait();
  };

  const deactivateCandidate = async (address: string) => {
    const contract = await getContract();
    const tx = await contract.deactivateCandidate(address);
    await tx.wait();
  };

  const reactivateCandidate = async (address: string) => {
    const contract = await getContract();
    const tx = await contract.reactivateCandidate(address);
    await tx.wait();
  };

  // ============================================
  // Getters (Logique conservée)
  // ============================================
  const getCandidates = async () => {
    const contract = getReadContract();
    const total = await contract.candidateId();
    const data = [];
    for (let i = 1; i <= Number(total); i++) {
      const c = await contract.getCandidateData(i);
      data.push({
        id: Number(c.candidate_id),
        name: c.candidate_name,
        age: Number(c.candidate_age),
        image: c.candidate_image,
        voteCount: Number(c.candidate_voteCount),
        address: c.candidate_address,
        ipfs: c.candidate_ipfs,
        isActive: c.isActive,
      });
    }
    return data;
  };

  const getVoters = async () => {
    const contract = getReadContract();
    const addresses: string[] = await contract.getVoterList();
    return await Promise.all(
      addresses.map(async (addr) => {
        const [id, name, address, image, age, hasVoted, ipfs, isActive] = await contract.getVoterData(addr);
        return { id: Number(id), name, address, image, age: Number(age), hasVoted, ipfs, isActive };
      })
    );
  };

  const getVotedVoters = async (): Promise<string[]> => {
    return await getReadContract().getVotedVoterList();
  };

  const getWinner = async () => {
  try {
    const contract = getReadContract();
    const end = Number(await contract.votingEnd());
    const now = Math.floor(Date.now() / 1000);
    if (now <= end) return undefined; // silencieux, pas de log
    const [winnerName, winnerVoteCount, isTie] = await contract.getWinner();
    return { winnerName, winnerVoteCount: Number(winnerVoteCount), isTie };
  } catch (err) {
    return undefined;
  }
};

 const getVotingPeriod = async () => {
    const contract = getReadContract();
    return {
      start: Number(await contract.votingStart()),
      end: Number(await contract.votingEnd()),
    };
  };

  const getCurrentRound = async (): Promise<number> => {
    return Number(await getReadContract().currentRound());
  };

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    checkIfWalletIsConnected();
    if (window.ethereum) {
      const handleAccounts = (accounts: string[]) => {
        setCurrentAccount(accounts[0] || '');
      };
      window.ethereum.on('accountsChanged', handleAccounts);
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccounts);
      };
    }
  }, []);

  useEffect(() => {
  if (!currentAccount) {
    setAuthLoading(false);
    return;
  }
  const syncData = async () => {
    await loadUserStatus();
    await handleRound2Logic();
  };
  syncData();
  const interval = setInterval(syncData, 30000);
  return () => clearInterval(interval);
}, [currentAccount]); 

  return (
    <VotingContext.Provider value={{
      authLoading,
      currentAccount,
      votingOrganizer,
      connectWallet,
      error,
      isOrganizer,
      isVotingOpen,
      isRegisteredVoter,
      hasVoted,
      isCandidate,
      round2Triggered,
      isPaused,
      isVoterActive,
      networkError,
      uploadToIpfs,
      createVoter,
      createCandidate,
      castVote,
      setVotingPeriod,
      emergencyPause,
      unpause,
      getCandidates,
      getVoters,
      getVotedVoters,
      getWinner,
      getVotingPeriod,
      getCurrentRound,
      deactivateVoter,
      reactivateVoter,
      deactivateCandidate,
      reactivateCandidate,
    }}>
      {children}
    </VotingContext.Provider>
  );
};
