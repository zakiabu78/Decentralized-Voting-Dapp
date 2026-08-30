"use client";

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { VotingContext } from '../../context/Voter';

// ============================================
// VoterCard inline — données complètes
// ============================================
 const VoterCard = ({ voter, currentAccount }) => {
  const { id, name, address, image, age, hasVoted, isActive } = voter;
  const isMe = !!currentAccount && !!address &&
    currentAccount.toLowerCase() === address.toLowerCase();

  return (
      <div className={`bg-white dark:bg-neutral-900 rounded-3xl border shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group ${
      isMe ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-100 dark:border-neutral-800'
    } ${isActive === false ? 'opacity-50 grayscale' : ''}`}>

      {/* "This is you" banner */}
      {isMe && (
        <div className="bg-blue-600 text-white text-center text-xs font-black uppercase tracking-widest py-2">
          👤 This is you
        </div>
      )}
      {/* Image */}
      <div className="relative h-56 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <img
          src={image || '/placeholder.png'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
        />
        {/* Badge statut — uniquement si actif ET a voté */}
        {isActive !== false && hasVoted && (
          <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">
            ✓ Voted
          </div>
        )}s
        {/* ID Badge */}
        <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-full">
          #{id}
        </div>
        {/* Badge Deactivated */}
        {isActive === false && (
          <div className="absolute bottom-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            ⛔ Deactivated
          </div>
        )}
      </div>

      {/* Détails */}
      <div className="p-6 space-y-4">
        <div>
          <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            {name.toUpperCase()}
          </h4>
          {age > 0 && (
            <p className="text-sm text-slate-400 font-medium mt-0.5">Age: {age}</p>
          )}
        </div>

        {/* Adresse */}
       <div className="flex items-start gap-2 text-sm font-bold dark:bg-slate-80">
        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">
          {address}
        </p>
      </div>

        {/* Statut vote */}
        <div className={`flex items-center gap-2 text-sm font-bold ${hasVoted ? 'text-green-600' : 'text-orange-500'}`}>
          <span className={`w-2 h-2 rounded-full ${hasVoted ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`} />
          {hasVoted ? 'Vote recorded on-chain' : 'Has not voted yet'}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Page : Voter List
// ============================================
const VoterList = () => {
  const { currentAccount, getVoters, isOrganizer } = useContext(VotingContext);

  const [voters, setVoters]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all'); // 'all' | 'voted' | 'pending'
  const [error, setError]     = useState('');

  // ============================================
  // Charger les votants depuis le contrat
  // ============================================
  useEffect(() => {
    const fetchVoters = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getVoters();
        setVoters(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching voters:', err);
        setError('Failed to load voters from the blockchain.');
      } finally {
        setLoading(false);
      }
    };

    fetchVoters();
  }, [currentAccount]);

  // ============================================
  // Filtrage + recherche
  // ============================================
  const filtered = voters
    .filter((v) => {
      if (filter === 'voted')    return v.hasVoted;
      if (filter === 'pending')  return !v.hasVoted;
      if (filter === 'inactive') return v.isActive === false;
      return true;
    })
    .filter((v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.address?.toLowerCase().includes(search.toLowerCase())
    );

  // ============================================
  // Stats
  // ============================================
  const totalVoters  = voters.length;
  const votedCount   = voters.filter((v) => v.hasVoted).length;
  const pendingCount = totalVoters - votedCount;
  const participation = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

  return (
    <div className="w-full px-8 py-8">

      {/* ── Header ── */}
      <div className="max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
            Voter <span className="text-blue-600">Registry</span>
          </h2>
        </div>

        {isOrganizer && (
          <Link
            href="/allowed-voters"
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <span className="text-2xl">+</span> Register Voter
          </Link>
        )}
      </div>

      {/* ── Recherche + Filtres ── */}
      <div className="max-w-[1400px] mx-auto mb-8 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name or 0x address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-6 py-4 text-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
        />

        {/* Filtre statut */}
       <div className="flex items-center gap-4">
      <div className="inline-flex buras-glass rounded-2xl p-1.5 gap-1.5">
        {[
          { id: 'all',      label: `All (${totalVoters})` },
          { id: 'voted',    label: `Voted (${votedCount})` },
          { id: 'pending',  label: `Pending (${pendingCount})` },
          { id: 'inactive', label: `Inactive (${voters.filter(v => v.isActive === false).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Participation — badge stat, pas un filtre */}
      <div className="px-5 py-2.5 buras-glass rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300">
        📊 {participation}% participation
      </div>
    </div>
</div>
      {/* ── Erreur ── */}
      {error && (
        <div className="max-w-[1400px] mx-auto mb-8 px-6 py-4 bg-red-50 dark:bg-red-950 border border-red-200 rounded-2xl text-red-600 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* ── Contenu ── */}
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
            <span className="text-7xl block">🔍</span>
            <p className="text-xl text-slate-400 font-medium">
              {voters.length === 0 ? 'No voters registered yet.' : 'No voters match your search.'}
            </p>
          </div>

        ) : (
          <>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
              Showing {filtered.length} of {totalVoters} voters
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map((voter, i) => (
              <VoterCard key={voter.id || i} voter={voter} currentAccount={currentAccount} />
            ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default VoterList;