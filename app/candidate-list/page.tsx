"use client";

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { VotingContext } from '../../context/Voter';

// ============================================
// CandidateCard — bouton vote sur l'image
// ============================================
  const CandidateCard = ({ candidate, canVote, hasVoted, onVote, voting, votedFor, currentAccount, votingEnded }) => {
  const { id, name, address, image, age, voteCount } = candidate;
  const isMyVote = votedFor === id;
  const isMe = !!currentAccount && !!address &&
    currentAccount.toLowerCase() === address.toLowerCase();

 return (
 <div className={`bg-white dark:bg-neutral-900 rounded-3xl border shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group ${
    isMe ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-100 dark:border-neutral-800'
  } ${votingEnded ? 'opacity-50 grayscale' : ''}`}>

    {/* "This is you" banner */}
    {isMe && (
      <div className="bg-blue-600 text-white text-center text-xs font-black uppercase tracking-widest py-2">
        👤 This is you
      </div>
    )}
    {/* Image Container */}
    <div className="relative h-64 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
      <img
      
        src={image || '/placeholder.png'}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
      />

      {/* Overlay gris inactif — APRÈS l'image, bloque le hover */}
      {!candidate.isActive && (
        <div className="absolute inset-0 bg-slate-900/60 z-10" />
      )}

      {/* Bouton vote — seulement si actif */}
      {!hasVoted && canVote && candidate.isActive && (
        <div className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
          <button
            onClick={() => onVote(id)}
            disabled={voting}
            className="px-8 py-4 bg-white text-blue-700 rounded-2xl font-black text-base shadow-2xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {voting ? 'Signing...' : `Vote for ${name}`}
          </button>
        </div>
      )}

      {/* État après vote */}
      {hasVoted && (
        <div className={`absolute inset-0 flex items-center justify-center z-20 ${isMyVote ? 'bg-green-900/60' : 'bg-slate-900/40'}`}>
          <div className={`px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 ${isMyVote ? 'bg-green-500 text-white' : 'bg-white/20 text-white backdrop-blur-md'}`}>
            {isMyVote ? '✓ YOUR VOTE' : 'VOTED'}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg z-30">
        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
      </div>
      <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm text-slate-900 dark:text-white text-xs font-black w-9 h-9 rounded-full flex items-center justify-center shadow-lg z-30">
        #{id}
      </div>

      {/* Badge Deactivated — au-dessus de l'overlay gris */}
      {!candidate.isActive && (
        <div className="absolute bottom-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg z-30">
          ⛔ Deactivated
        </div>
      )}
    </div>

    {/* Détails */}
    <div className="p-6 space-y-4">
      <div>
        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {name.toUpperCase()}
        </h4>
        {age > 0 && <p className="text-sm text-slate-400 font-medium mt-0.5">Age: {age}</p>}
      </div>
      <div className="flex items-start gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">{address}</p>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>Power Level</span>
          <span className="text-blue-600">{voteCount}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: voteCount > 0 ? `${Math.min(voteCount * 10, 100)}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  </div>
);
};

// ============================================
// Page : Candidate List
// ============================================
const CandidateList = () => {
  const {
    currentAccount, getCandidates, isOrganizer, isRegisteredVoter,
    hasVoted, isVotingOpen, isCandidate, castVote, isPaused, isVoterActive,
  } = useContext(VotingContext);

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [error, setError]           = useState('');
  const [voting, setVoting]         = useState(false);
  const [voteError, setVoteError]   = useState('');
  const [voteSuccess, setVoteSuccess] = useState('');
  const [votedFor, setVotedFor]     = useState<number | null>(null);

  const canVote = isRegisteredVoter && !hasVoted && isVotingOpen && !isOrganizer && !isCandidate && !isPaused && isVoterActive !== false;
  
  const fetchCandidates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCandidates();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidates from the blockchain.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [currentAccount]);

  const handleVote = async (candidateId: number) => {
    setVoteError('');
    setVoteSuccess('');
    setVoting(true);
    try {
      await castVote(candidateId);
      setVotedFor(candidateId);
      setVoteSuccess('Your vote has been recorded on-chain.');
      await fetchCandidates();
    } catch (err: any) {
      console.error('Error details:', err);
      
      // Extraction du message d'erreur (MetaMask ou Ethers)
      const msg = err?.data?.message || err?.message || "";
      
      if (msg.includes("insufficient funds") || err?.code === -32603) {
        setVoteError("INSUFFICIENT FUNDS: You need more ETH in your wallet to cover the gas fees.");
      } else if (msg.includes('Already voted')) {
        setVoteError('You have already voted in this round.');
      } else if (msg.includes('closed')) {
        setVoteError('The voting session is closed.');
      } else if (msg.includes('user rejected')) {
        setVoteError('Transaction cancelled by user.');
      } else {
        setVoteError('Transaction failed. Check your wallet and try again.');
      }
    } finally {
      setVoting(false);
    }
  };

 const filtered = [...candidates]
  .sort((a, b) => b.voteCount - a.voteCount)
  .filter((c) => {
    if (filter === 'voted')       return c.voteCount > 0;
    if (filter === 'none')        return c.voteCount === 0;
    if (filter === 'deactivated') return !c.isActive;
    return true;
  })
  .filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  );
  const totalVotes   = candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const withVotes    = candidates.filter((c) => c.voteCount > 0).length;
  const withoutVotes = candidates.length - withVotes;

  const frontRunner = candidates.length > 0 && totalVotes > 0
    ? candidates.reduce((max, c) => c.voteCount > max.voteCount ? c : max, candidates[0])
    : null;

  return (
    <div className="w-full px-8 py-8">

      {/* Header */}
      <div className="max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
            Candidate <span className="text-blue-600">Registry</span>
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
            {canVote
              ? 'Hover a candidate to cast your vote.'
              : 'Real-time registry of all registered candidates on-chain.'}
          </p>
        </div>

        {isOrganizer && (
          <Link
            href="/candidate-registration"
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <span className="text-2xl">+</span> Add Candidate
          </Link>
        )}
      </div>


      {/* Bannière canVote */}
      {canVote && (
        <div className="max-w-[1400px] mx-auto mb-8 px-6 py-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center gap-4">
          <span className="text-2xl">🗳️</span>
          <div>
            <p className="font-black text-blue-700 text-base">You can vote now</p>
            <p className="text-sm text-blue-500 font-medium">Hover a candidate card and click the vote button — your choice is permanent.</p>
          </div>
        </div>
      )}

      {/* Messages vote */}
      {voteSuccess && (
        <div className="max-w-[1400px] mx-auto mb-8 px-6 py-4 bg-green-50 border border-green-200 rounded-2xl text-green-600 font-bold flex items-center gap-3">
          <span>✓</span> {voteSuccess}
        </div>
      )}
      {voteError && (
        <div className="max-w-[1400px] mx-auto mb-8 px-6 py-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 font-bold flex items-center gap-3">
          <span>⚠️</span> {voteError}
        </div>
      )}


    {/* Recherche + Filtres */}
<div className="max-w-[1400px] mx-auto mb-8 flex flex-col md:flex-row gap-4">
  <div className="relative flex-1">
    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
    <input
      type="text"
      placeholder="Search by name or 0x address..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full pl-14 pr-6 py-4 text-lg rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm"
    />
  </div>
  <div className="inline-flex buras-glass rounded-2xl p-1.5 gap-1.5">
    {[
      { id: 'all',         label: `All (${candidates.length})` },
      { id: 'voted',       label: `With Votes (${withVotes})` },
      { id: 'none',        label: `No Votes (${withoutVotes})` },
      { id: 'deactivated', label: `Inactive (${candidates.filter(c => !c.isActive).length})` },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => setFilter(tab.id)}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
          filter === tab.id
            ? tab.id === 'deactivated' ? 'bg-red-500 text-white shadow-md' : 'bg-blue-600 text-white shadow-md'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
</div>

      {/* Erreur chargement */}
      {error && (
        <div className="max-w-[1400px] mx-auto mb-8 px-6 py-4 bg-red-50 dark:bg-red-950 border border-red-200 rounded-2xl text-red-600 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Contenu */}
      <div className="max-w-[1400px] mx-auto">
        {!currentAccount ? (
          <div className="text-center py-24 buras-glass rounded-3xl border-2 border-dashed border-slate-300 space-y-4">
            <span className="text-6xl block">🔌</span>
            <p className="text-xl font-bold text-slate-500">Connect your wallet to view the registry</p>
          </div>

        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-bold">Synchronizing with Blockchain...</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <span className="text-7xl block">🎯</span>
            <p className="text-xl text-slate-400 font-medium">
              {candidates.length === 0 ? 'No candidates registered yet.' : 'No candidates match your search.'}
            </p>
            {isOrganizer && candidates.length === 0 && (
              <Link href="/candidate-registration" className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all">
                Register First Candidate →
              </Link>
            )}
          </div>

        ) : (
          <>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
              Showing {filtered.length} of {candidates.length} candidates
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filtered.map((candidate, i) => (
              <CandidateCard
                  key={candidate.id || i}
                  candidate={candidate}
                  canVote={canVote}
                  hasVoted={hasVoted}
                  onVote={handleVote}
                  voting={voting}
                  votedFor={votedFor}
                  currentAccount={currentAccount}
                  votingEnded={!isVotingOpen}
                />
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default CandidateList;