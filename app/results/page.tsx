"use client";

import React, { useState, useEffect, useRef, useContext } from 'react';
import { VotingContext } from '../../context/Voter';
import { ethers } from 'ethers';
import { votingAddress, votingAddressABI } from '../../context/Constants';

const DEPLOY_BLOCK = 	10983130;

// Etherscan V2 — no 10-block cap, returns blockNumber + timeStamp + txHash per log.
const CHAIN_ID = 11155111; // Sepolia
const ETHERSCAN_TX = (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`;
const ETHERSCAN_ADDR = (addr: string) => `https://sepolia.etherscan.io/address/${addr}`;

interface Activity {
  id: string;
  type: 'VOTE' | 'VOTER_ADDED' | 'CANDIDATE_ADDED' | 'ROUND_TRIGGERED' | 'ROLE_GRANTED' | 'ROLE_REVOKED' | 'PAUSED' | 'UNPAUSED' | 'OTHER';
  description: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
}

const typeConfig = {
  VOTE:            { label: 'Vote cast',        icon: '🗳️', tile: 'bg-blue-100 text-blue-700',     accent: 'bg-blue-500',   ring: 'hover:border-blue-200'   },
  CANDIDATE_ADDED: { label: 'Candidate added',  icon: '🎯', tile: 'bg-purple-100 text-purple-700', accent: 'bg-purple-500', ring: 'hover:border-purple-200' },
  VOTER_ADDED:     { label: 'Voter registered', icon: '👥', tile: 'bg-emerald-100 text-emerald-700', accent: 'bg-emerald-500', ring: 'hover:border-emerald-200' },
  ROUND_TRIGGERED: { label: 'Round triggered',  icon: '⚡', tile: 'bg-amber-100 text-amber-700',   accent: 'bg-amber-500',  ring: 'hover:border-amber-200'  },
  ROLE_GRANTED:    { label: 'Role granted',     icon: '🔑', tile: 'bg-indigo-100 text-indigo-700', accent: 'bg-indigo-500', ring: 'hover:border-indigo-200' },
  ROLE_REVOKED:    { label: 'Role revoked',     icon: '🚫', tile: 'bg-rose-100 text-rose-700',     accent: 'bg-rose-500',   ring: 'hover:border-rose-200'   },
  PAUSED:          { label: 'Contract paused',  icon: '⏸️', tile: 'bg-orange-100 text-orange-700', accent: 'bg-orange-500', ring: 'hover:border-orange-200' },
  UNPAUSED:        { label: 'Contract resumed', icon: '▶️', tile: 'bg-teal-100 text-teal-700',     accent: 'bg-teal-500',   ring: 'hover:border-teal-200'   },
  OTHER:           { label: 'Contract event',   icon: '📄', tile: 'bg-slate-200 text-slate-700',   accent: 'bg-slate-500',  ring: 'hover:border-slate-300'  },
};

// ── Small copy-to-clipboard button ──
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
        copied ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
    >
      {copied ? '✓ Copied' : '⧉ Copy'}
    </button>
  );
};

const ResultsPage = () => {
  const { getWinner, isVotingOpen, getCandidates } = useContext(VotingContext);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [winner, setWinner]         = useState<any>(null);
  const [winnerError, setWinnerError] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [netError, setNetError] = useState('');

  const activityMapRef = useRef<Map<string, Activity>>(new Map());

  const fetchPastEvents = async () => {
    try {
      const iface = new ethers.Interface(votingAddressABI);

      // One call to our server proxy returns ALL of the contract's logs (no 10-block cap).
      const url = `/api/logs?chainid=${CHAIN_ID}`
        + `&address=${votingAddress}&fromBlock=${DEPLOY_BLOCK}&toBlock=latest`;
      const res = await fetch(url);
      if (!res.ok) { setNetError(`⚠️ Server error (${res.status}). Retrying…`); setLoading(false); return; }
      const json = await res.json();

      if (!Array.isArray(json.result)) {
        console.warn('Etherscan logs unavailable:', json.message || json.result);
        setLoading(false);
        return;
      }

      for (const log of json.result) {
        let parsed: any = null;
        try { parsed = iface.parseLog({ topics: log.topics, data: log.data }); } catch { continue; }
        if (!parsed) continue;

        const blockNumber = parseInt(log.blockNumber, 16);
        const timestamp   = parseInt(log.timeStamp, 16);
        const txHash      = log.transactionHash;
        const key         = `${txHash}-${log.logIndex}`;
        if (activityMapRef.current.has(key)) continue;

        let type: Activity['type'];
        let description: string;
        let from = '';

        if (parsed.name === 'CreateCandidate') {
          type = 'CANDIDATE_ADDED';
          description = `Candidate #${parsed.args[0]} registered`;
          from = parsed.args[1];
        } else if (parsed.name === 'CreateVoter') {
          type = 'VOTER_ADDED';
          description = `Voter #${parsed.args[0]} registered`;
          from = parsed.args[1];
        } else if (parsed.name === 'VoteCast') {
          type = 'VOTE';
          description = `Voted for Candidate #${parsed.args[1]}`;
          from = parsed.args[0];
        } else if (parsed.name === 'RoundStarted' || parsed.name === 'Round2Triggered') {
          type = 'ROUND_TRIGGERED';
          description = 'Round 2 started';
        } else if (parsed.name === 'RoleGranted') {
          type = 'ROLE_GRANTED';
          description = 'Admin role granted to organizer';
          from = parsed.args?.account ?? parsed.args?.[1] ?? '';
        } else if (parsed.name === 'RoleRevoked') {
          type = 'ROLE_REVOKED';
          description = 'Admin role revoked';
          from = parsed.args?.account ?? parsed.args?.[1] ?? '';
        } else if (parsed.name === 'Paused') {
          type = 'PAUSED';
          description = 'Voting paused by organizer';
          from = parsed.args?.account ?? parsed.args?.[0] ?? '';
        } else if (parsed.name === 'Unpaused') {
          type = 'UNPAUSED';
          description = 'Voting resumed by organizer';
          from = parsed.args?.account ?? parsed.args?.[0] ?? '';
        } else {
          type = 'OTHER';
          description = parsed.name.replace(/([A-Z])/g, ' $1').trim(); // e.g. "Some Event"
          from = parsed.args?.account ?? '';
        }

        activityMapRef.current.set(key, { id: key, type, description, txHash, blockNumber, timestamp, from });
      }

      const allEvents = [...activityMapRef.current.values()].sort((a, b) => b.blockNumber - a.blockNumber);
      setNetError('');
      setActivities(allEvents);
     } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setNetError('⚠️ Weak or lost connection — retrying automatically.');
      } else {
        setNetError('⚠️ Could not reach the network. Retrying…');
      }
      console.error('Error fetching blockchain logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWinner = async () => {
    try {
      const w = await getWinner();
      if (w) setWinner(w);
    } catch (e: any) {
      const msg = e?.reason || e?.message || '';
      if (msg.includes('ongoing')) setWinnerError('Election is still ongoing.');
      else if (msg.includes('No votes')) setWinnerError('No votes were cast.');
    }
  };

  const fetchCandidates = async () => {
    try {
      const c = await getCandidates();
      setCandidates(c || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchPastEvents();
    fetchWinner();
    fetchCandidates();
    const interval = setInterval(() => { fetchPastEvents(); fetchWinner(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const votes  = activities.filter((a) => a.type === 'VOTE').length;
  const cAdded = activities.filter((a) => a.type === 'CANDIDATE_ADDED').length;
  const vAdded = activities.filter((a) => a.type === 'VOTER_ADDED').length;

  const filtered = activities
    .filter((a) => filter === 'all' || a.type === filter)
    .filter((a) =>
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.from?.toLowerCase().includes(search.toLowerCase()) ||
      a.txHash?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="w-full px-8 py-10 max-w-[1300px] mx-auto space-y-10">

      {/* ── Header ── */}
       {netError && (
        <div className="rounded-2xl px-5 py-3 bg-amber-50 border border-amber-300 text-amber-800 font-bold text-sm">
          {netError}
        </div>
      )}
      <div className="space-y-2">
        <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
          Audit <span className="text-blue-600">&amp; Results</span>
        </h1>
      </div>

      {/* ── Winner ── */}
      {!isVotingOpen && winner && (
        <div className={`rounded-[2rem] p-8 border-2 space-y-6 ${
          winner.isTie ? 'bg-amber-50 border-amber-300' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{winner.isTie ? '⚖️' : '🏆'}</span>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              {winner.isTie ? 'Tie — Round 2 may be triggered' : 'Election Winner'}
            </p>
          </div>
          {winner.isTie ? (
            <p className="text-2xl font-black text-amber-700">
              Tie at {winner.winnerVoteCount} votes — no majority reached.
            </p>
          ) : (
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <p className="text-6xl font-black text-slate-900">{winner.winnerName}</p>
                <p className="text-lg font-bold text-green-600 mt-2">{winner.winnerVoteCount} votes</p>
              </div>
              <div className="flex items-end gap-2">
                {[...candidates].sort((a, b) => b.voteCount - a.voteCount).slice(0, 3).map((c, i) => (
                  <div key={c.id} className="flex flex-col items-center gap-1">
                    <p className="text-xs font-black text-slate-500">{c.voteCount}v</p>
                    <div className={`w-12 rounded-t-xl ${
                      i === 0 ? 'bg-yellow-400 h-16' : i === 1 ? 'bg-slate-300 h-10' : 'bg-orange-300 h-7'
                    }`} />
                    <p className="text-[9px] font-black text-slate-500 truncate max-w-[48px]">{c.name.split(' ')[0].toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!isVotingOpen && winnerError && (
        <div className="rounded-[2rem] p-6 bg-slate-50 border border-slate-200 text-slate-400 text-sm font-medium">
          {winnerError}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-5">
        {[
          { label: 'Total events', value: filtered.length, icon: '📊', color: 'text-green-600'},
          { label: 'Votes cast', value: votes,  icon: '🗳️', color: 'text-blue-600'   },
          { label: 'Candidates', value: cAdded, icon: '🎯', color: 'text-purple-600' },
          { label: 'Voters', value: vAdded, icon: '👥', color: 'text-green-600'  },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm flex justify-between items-center">
            <div>
              <p className={`text-4xl font-black ${color}`}>{value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
            </div>
            <span className="text-3xl">{icon}</span>
          </div>
        ))}
      </div>

      {/* ── Activity feed ── */}
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Transaction log</h2>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search by address, tx hash, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-5 py-3.5 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="inline-flex bg-white border border-slate-200 rounded-2xl p-1 gap-1">
            {[
              { id: 'all',             label: 'All' },
              { id: 'VOTE',            label: '🗳️ Votes' },
              { id: 'VOTER_ADDED',     label: '👥 Voters' },
              { id: 'CANDIDATE_ADDED', label: '🎯 Candidates' },
            ].map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                  filter === f.id ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-700'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-sm">Reading the blockchain...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[1.5rem] p-12 text-center space-y-3 shadow-sm">
            <span className="text-5xl">📋</span>
            <p className="text-slate-400 font-medium">No activity found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((act) => {
              const config = typeConfig[act.type];
              return (
                <div
                  key={act.id}
                  className={`relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${config.ring} overflow-hidden`}
                >
                  {/* left accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`} />

                  <div className="flex flex-col gap-4 pl-3">

                    {/* Top row: type + meta */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${config.tile}`}>
                          {config.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">{config.label}</p>
                          <p className="text-lg font-black text-slate-900 truncate">{act.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {act.blockNumber > 0 && (
                          <p className="text-sm font-mono font-black text-slate-700">Block #{act.blockNumber.toLocaleString()}</p>
                        )}
                        {act.timestamp > 0 && (
                          <p className="text-sm text-slate-600 font-bold mt-1">🕐 {fmtDate(act.timestamp)}</p>
                        )}
                      </div>
                    </div>

                    {/* From address — full + copyable */}
                    {act.from && (
                      <div className="flex items-center gap-2 flex-wrap bg-slate-50 rounded-xl px-3 py-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">From</span>
                        <a
                          href={ETHERSCAN_ADDR(act.from)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-blue-600 hover:underline break-all"
                        >
                          {act.from}
                        </a>
                        <CopyButton text={act.from} />
                      </div>
                    )}

                    {/* Footer: link to the exact transaction */}
                    {act.txHash && (
                      <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-slate-50">
                       <p className="text-sm font-mono text-slate-900 truncate max-w-[55%]">
                          Transaction : {act.txHash.slice(0, 14)}…{act.txHash.slice(-8)}
                        </p>
                        <a
                          href={ETHERSCAN_TX(act.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-black hover:bg-blue-100 transition-all"
                        >
                          View on Etherscan ↗
                        </a>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default ResultsPage;
