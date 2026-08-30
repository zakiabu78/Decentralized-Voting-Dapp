"use client";

import React, { useState, useContext, useEffect, useRef } from 'react';
import { VotingContext } from '../context/Voter';
import { ethers } from 'ethers';
import { votingAddress } from '../context/Constants';

const PageBg = () => (
  <style>{`
    .page-root {
      background-color: #EEF2F7;
      background-image: radial-gradient(#CBD5E1 1px, transparent 1px);
      background-size: 28px 28px;
      min-height: 100vh;
    }
    .card {
      background: white;
      border: 1px solid #E2E8F0;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border-radius: 1.5rem;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .slide-in { animation: slideIn 0.3s ease forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s ease; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .blink { animation: blink 1s infinite; }
    @keyframes scanline {
      0% { transform: translateX(-100%); }
       100% { transform: translateX(100%); }
    }
    .scanline { animation: scanline 2s ease-in-out infinite; }
    @keyframes pulse-bar {
      0%,100% { opacity: 0.4; } 50% { opacity: 1; }
    }
    .pulse-bar { animation: pulse-bar 1.5s ease-in-out infinite; }
  `}</style>
);

// ============================================
// HeroCard — navigue vers une page séparée
// ============================================
const HeroCard = ({ title, desc, buttonLabel, bgColor, icon, href }: {
  title: string; desc: string; buttonLabel: string;
  bgColor: string; icon: string; href: string;
}) => (<a
  
    href={href}
    target="_blank"
    className="group relative overflow-hidden text-left w-full min-h-[210px] flex flex-col justify-end cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-lg"
    style={{ borderRadius: '1.75rem', display: 'flex' }}
  >
    <div className="absolute inset-0" style={{ backgroundColor: bgColor }} />
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 210" preserveAspectRatio="xMidYMid slice">
      <circle cx="260" cy="20" r="90" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" fill="none"/>
      <circle cx="260" cy="20" r="135" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" fill="none"/>
      <circle cx="30" cy="200" r="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none"/>
      <line x1="0" y1="105" x2="300" y2="105" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
    </svg>
    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${bgColor}FA 50%, ${bgColor}44 100%)` }} />
    <div className="relative z-10 p-7 space-y-2">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
        {icon}
      </div>
      <h4 className="text-xl font-black text-white tracking-tight">{title}</h4>
      <p className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>{desc}</p>
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-base font-bold mt-1 group-hover:bg-white/25 transition-all" style={{ background: 'rgba(255,255,255,0.18)', border: '0.5px solid rgba(255,255,255,0.28)' }}>
        {buttonLabel} →
      </div>
    </div>
  </a>
);

// ============================================
// StatsPanel — agrandi
// ============================================
const StatsPanel = () => {
  const { getCandidates, getVoters, getVotedVoters } = useContext(VotingContext);
  const [stats, setStats] = useState({ candidates: 0, voters: 0, voted: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, v, vd] = await Promise.all([getCandidates(), getVoters(), getVotedVoters()]);
        setStats({ candidates: c?.length || 0, voters: v?.length || 0, voted: vd?.length || 0 });
      } catch (e) { console.error(e); }
      finally { setLoaded(true); }
    };
    load();
  }, []);

  const participation = stats.voters > 0 ? Math.round((stats.voted / stats.voters) * 100) : 0;
  const pending = stats.voters - stats.voted;

  return (
    <div className="flex flex-col gap-8 w-full">
<h4 className="text-xl font-bold text-blue-600 text-center uppercase tracking-[0.7em]">Analytics</h4>

      {/* Candidates */}
      <div className="card p-7 flex justify-between items-center">
        <div>
          <p className="text-5xl font-black text-slate-900 leading-none">{loaded ? stats.candidates : '—'}</p>
          <p className="text-base font-bold text-slate-900 uppercase tracking-widest mt-2">Candidates</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl">⚡</div>
      </div>

      {/* Voters */}
      <div className="card p-7 flex justify-between items-center">
        <div>
          <p className="text-5xl font-black text-slate-900 leading-none">{loaded ? stats.voters : '—'}</p>
          <p className="text-base font-bold text-slate-900 uppercase tracking-widest mt-2">Registered voters</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-3xl">👥</div>
      </div>
       {/* Participation */}
      <div className="card p-7 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-base font-bold text-slate-900 uppercase tracking-widest">Participation</p>
          <p className="text-3xl font-black text-slate-900">{loaded ? `${participation}%` : '—'}</p>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000" style={{ width: loaded ? `${participation}%` : '0%' }} />
        </div>
        <div className="flex justify-between">
          <div className="text-center">
            <p className="text-lg font-black text-green-600">{stats.voted}</p>
            <p className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">Voted</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-orange-500">{pending}</p>
            <p className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TimelinePanel — agrandi
// ============================================
const TimelinePanel = () => {
  const { getVotingPeriod, getCurrentRound, isVotingOpen } = useContext(VotingContext);
  const [period, setPeriod] = useState<any>(null);
  const [round, setRound] = useState(0);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    Promise.all([getVotingPeriod(), getCurrentRound()]).then(([p, r]) => { setPeriod(p); setRound(r); });
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const tl = period ? Math.max(0, period.end - now) : 0;
  const d = Math.floor(tl / 86400);
  const h = Math.floor((tl % 86400) / 3600);
  const m = Math.floor((tl % 3600) / 60);
  const s = tl % 60;
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (ts: number) => new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

return (
  <div className="flex flex-col gap-5 w-full">
<h4 className="text-xl font-bold text-blue-600 text-center uppercase tracking-[0.7em]">Timeline</h4>

    {/* Section Round & Dates combinées pour éviter la redondance */}
    <div className="card p-7 space-y-6">
      <div className="flex justify-between items-start border-b border-slate-50 pb-6">
        <div>
          <p className="text-base font-bold text-slate-900 uppercase tracking-widest mb-2">Current round</p>
          <p className="text-4xl font-black text-slate-900">Round {round || 1}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isVotingOpen ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-900'}`}>
          {isVotingOpen ? '● Active' : '○ Inactive'}
        </div>
      </div>

      {period && (
        <div className="space-y-4">
          {[
            { label: 'Session Opens', ts: period.start, done: now >= period.start },
            { label: 'Session Closes', ts: period.end, done: now > period.end },
          ].map(({ label, ts, done }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${done ? 'bg-green-500' : 'bg-slate-200'}`} />
                <p className="text-base font-bold text-slate-600">{label}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-slate-900">{fmt(ts)}</p>
               <p className="text-[13px] font-bold text-blue-900">{fmtTime(ts)}</p>
              </div>
            </div>
          ))}

            {round === 1 && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
              <p className="text-blue-600 text-base font-medium leading-relaxed">
                <span className="font-black">Next Round on tie:</span>
                {' '}If the session ends in a tie at {fmtTime(period.end)}, <b>Round 2</b> is
                started when the app is open after the deadline (votes reset).
              </p>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Alerte spécifique au Round 2 triggered */}
        {round >= 2 && isVotingOpen && (
      <div className="rounded-[1.5rem] p-6 space-y-2 border-2 border-amber-300 bg-amber-50 animate-pulse">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-2xl">⚡</span>
          <p className="text-base font-black text-amber-700 uppercase tracking-widest">Round {round} in progress</p>
        </div>
        <p className="text-base text-amber-800 font-medium leading-relaxed">
          The previous round ended in a tie. <b>All votes have been reset</b>. Voters must cast their choice again before the new deadline.
        </p>
      </div>
    )}

    {/* Countdown */}
    <div className="card p-7 space-y-4 bg-slate-900 text-white border-none">
      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
        {isVotingOpen ? 'Time remaining' : 'Session Status'}
      </p>
      {isVotingOpen ? (
        <div className="grid grid-cols-4 gap-3 font-black text-slate-900">
          {[{ val: d, label: 'Days' }, { val: h, label: 'Hrs' }, { val: m, label: 'Min' }, { val: s, label: 'Sec' }].map(({ val, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-black">{String(val).padStart(2, '0')}</p>
              <p className="text-[9px] font-bold uppercase text-slate-500">{label}</p>
            </div>
          ))}
        </div>
     ) : (
        period && now > period.end ? (
          <p className="text-base text-red-500 font-bold text-center py-2">⛔ Voting session has ended</p>
        ) : (
          <p className="text-base text-slate-900 italic text-center py-2">No active voting session</p>
        )
      )}
    </div>
  </div>
 );
};

// ============================================
// HomeView
// ============================================
const HomeView = () => {
  const { isVotingOpen, getCurrentRound } = useContext(VotingContext);
  const [round, setRound] = useState(0);
  useEffect(() => { getCurrentRound().then(setRound); }, []);

  return (
    <div className="space-y-0">

      <section className="max-w-[1600px] mx-auto px-10 py-16 grid grid-cols-1 lg:grid-cols-[360px_1fr_360px] gap-14 items-start">
        <StatsPanel />

        <div className="text-center space-y-8">
          <div className={`inline-flex items-center gap-3 px-7 py-3 rounded-full border text-base font-bold uppercase tracking-widest ${
            isVotingOpen ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <span className={`w-3 h-3 rounded-full ${isVotingOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isVotingOpen ? 'Voting session open' : 'Voting session closed'}
          </div>

          <h1 className="text-[5.5rem] font-black leading-[0.85] tracking-tighter text-slate-900">
            Trustless <br />
            <span className="text-blue-600 italic">Voting.</span>
          </h1>

          <p className="text-xl text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
            Every vote is immutable, anonymous, and verifiable on the Ethereum blockchain.
          </p>
        </div>

        <TimelinePanel />
      </section>
    </div>
  );
};

const WarRoomView = () => {
  const { getCandidates, getVoters, getVotedVoters, getCurrentRound } = useContext(VotingContext);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [votedVoters, setVotedVoters] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockNumber, setBlockNumber] = useState(0);   // real chain height (0 = not yet loaded)
  const [scanning, setScanning] = useState(false);
  const [wsLive, setWsLive] = useState(true);          // false while reconnecting
  const prevVoted = useRef<string[]>([]);
  const idRef = useRef(0);

  // refs used by the WebSocket auto-reconnect logic
  const providerRef = useRef<ethers.WebSocketProvider | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);

  // 1. Chargement initial des données
  useEffect(() => {
    const load = async () => {
      try {
        const [c, v, vd, r] = await Promise.all([getCandidates(), getVoters(), getVotedVoters(), getCurrentRound()]);
        setCandidates(c || []);
        setTotalVoters(v?.length || 0);
        setVotedVoters(vd || []);
        setRound(r || 1);
        prevVoted.current = vd || [];
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // 2. WebSocket Listener — real block height + auto-reconnect
  useEffect(() => {
    if (loading) return;

    const RPC_WSS = process.env.NEXT_PUBLIC_RPC_WSS_URL;
    if (!RPC_WSS) {
      console.error("NEXT_PUBLIC_RPC_WSS_URL is not set in .env.local");
      return;
    }

    closedRef.current = false;
    let attempts = 0;

    const voteFilter = {
      address: votingAddress,
      topics: [ethers.id("VoteCast(address,uint256)")],
    };

    const addToFeed = (voter: string, candidate: string) => {
      const newEvent = {
        id: ++idRef.current,
        voter,
        candidate,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        type: 'vote',
      };
      setFeed((prev) => [newEvent, ...prev].slice(0, 30));
    };

    const handleVote = async (log: any) => {
      try {
        const voterAddr = ethers.getAddress("0x" + log.topics[1].slice(26));
        const candidateId = Number(BigInt(log.topics[2]));
        addToFeed(voterAddr, `Candidate #${candidateId}`);
        const [c, vd] = await Promise.all([getCandidates(), getVotedVoters()]);
        setCandidates(c);
        setVotedVoters(vd);
      } catch (e) { console.error(e); }
    };

    const scheduleReconnect = () => {
      if (closedRef.current || reconnectRef.current) return; // already unmounted or already scheduled
      const old = providerRef.current;
      providerRef.current = null;
      if (old) { try { old.removeAllListeners(); old.destroy(); } catch {} }
      setWsLive(false);
      const delay = Math.min(1000 * 2 ** attempts, 15000); // exponential backoff, capped at 15s
      attempts += 1;
      reconnectRef.current = setTimeout(() => {
        reconnectRef.current = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (closedRef.current) return;
      const provider = new ethers.WebSocketProvider(RPC_WSS);
      providerRef.current = provider;

      // First real block number → also confirms the socket works, so reset backoff.
      provider.getBlockNumber()
        .then((bn) => { setBlockNumber(bn); setWsLive(true); attempts = 0; })
        .catch(() => {});

      // Live chain height: fires on every new block (~12s on Sepolia).
      provider.on('block', (bn: number) => {
        setBlockNumber(bn);
        setScanning(true);
        setTimeout(() => setScanning(false), 600);
      });

      // Live votes.
      provider.on(voteFilter, handleVote);

      // React to the socket dropping → reconnect.
      const ws: any = (provider as any).websocket;
      if (ws) {
        const prevClose = ws.onclose;
        ws.onclose = (...a: any[]) => {
          if (typeof prevClose === 'function') { try { prevClose.apply(ws, a); } catch {} }
          scheduleReconnect();
        };
        const prevErr = ws.onerror;
        ws.onerror = (...a: any[]) => {
          if (typeof prevErr === 'function') { try { prevErr.apply(ws, a); } catch {} }
        };
      }
    };

    connect();

    // Safety net: if the socket dies silently (no close event), this catches it.
    const heartbeat = setInterval(async () => {
      const p = providerRef.current;
      if (!p) return;
      try {
        const bn = await Promise.race([
          p.getBlockNumber(),
          new Promise<number>((_, rej) => setTimeout(() => rej(new Error('heartbeat timeout')), 8000)),
        ]);
        setBlockNumber(bn);
        setWsLive(true);
      } catch {
        scheduleReconnect();
      }
    }, 20000);

    return () => {
      closedRef.current = true;
      clearInterval(heartbeat);
      if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
      const p = providerRef.current;
      providerRef.current = null;
      if (p) { try { p.removeAllListeners(); p.destroy(); } catch {} }
    };
  }, [loading]);

  const totalVotes = candidates.reduce((s, c) => s + c.voteCount, 0);
  const maxVotes = Math.max(...candidates.map((c) => c.voteCount), 1);
  const participation = totalVoters > 0 ? Math.round((votedVoters.length / totalVoters) * 100) : 0;
  const leader = candidates.length > 0 && totalVotes > 0
    ? candidates.reduce((mx, c) => c.voteCount > mx.voteCount ? c : mx, candidates[0])
    : null;

  return (

  <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-8 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <p className="text-base font-black text-red-500 uppercase tracking-[0.3em]">Live — Round {round}</p>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-slate-900">Election War Room</h2>
        </div>

      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-900 font-bold">Connecting to blockchain...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          {/* Gauche — standings */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-6">
                <p className="text-4xl font-black text-blue-600">{candidates.length}</p>
                <p className="text-base font-bold text-slate-900 uppercase tracking-widest mt-1">Candidates</p>
              </div>
              <div className="card p-6">
                <p className="text-4xl font-black text-green-600">{participation}%</p>
                <p className="text-base font-bold text-slate-900 uppercase tracking-widest mt-1">Participation</p>
              </div>

            </div>

            <p className="text-base font-black text-slate-900 uppercase tracking-[0.3em]">Live standings</p>

            {candidates.length === 0 ? (
              <div className="card p-12 text-center space-y-3">
                <p className="text-4xl">📋</p>
                <p className="text-slate-900 font-medium">No candidates registered yet</p>
              </div>
            ) : (
              [...candidates].sort((a, b) => b.voteCount - a.voteCount).map((c, i) => {
                const pct = Math.round((c.voteCount / maxVotes) * 100);
                const isLeader = i === 0 && c.voteCount > 0;
                return (
                  <div key={c.id} className={`card p-6 space-y-4 transition-all ${isLeader ? 'border-yellow-300 border-2' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-black ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-slate-100 text-slate-600' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-50 text-slate-900'
                        }`}>#{i + 1}</div>
                        <div>
                          <p className="font-black text-slate-900 text-base">{c.name.toUpperCase()}</p>
                          <p className="text-base text-slate-900 font-mono">{c.address.slice(0, 8)}...{c.address.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-slate-900">{c.voteCount}</p>
                        <p className="text-base text-slate-900">{totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * 100) : 0}% of votes</p>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isLeader ? 'bg-yellow-400' : 'bg-blue-500'}`}
                        style={{ width: c.voteCount > 0 ? `${pct}%` : '0%' }}
                      />
                    </div>
                    {c.voteCount === 0 && (
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-200 rounded-full pulse-bar w-full" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

    <div className="space-y-4 -mt-15"> {/* Adjust -mt-2, -mt-4, or -mt-8 as needed */}
    <p className="text-base font-black text-slate-900 uppercase tracking-[0.3em]">
      Transaction feed
    </p>
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${wsLive ? 'bg-red-500' : 'bg-amber-400'}`} />
              <p className="text-base font-bold text-slate-500 uppercase tracking-widest">{wsLive ? 'Live' : 'Reconnecting…'}</p>
            </div>
            <p className="text-base font-mono text-slate-900">Latest Block #{blockNumber ? blockNumber.toLocaleString() : '—'}</p>
          </div>

        {feed.length === 0 ? (
        <div className="p-8 space-y-5">
          {/* Header scanning */}
          <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-base font-black text-slate-500 uppercase tracking-widest font-mono">Listening for votes</p>
            <span className="blink text-slate-900 font-mono font-black">_</span>
          </div>

          {/* Message central */}
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mx-auto">
              🔍
            </div>
            <p className="text-base font-black text-slate-600">No votes cast yet</p>
            <p className="text-base text-slate-900 font-medium max-w-[200px] mx-auto leading-relaxed">
              Transactions will appear here in real time as voters cast their votes.
            </p>
          </div>

          {/* Footer block info */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting first transaction</p>
            <span className="blink text-slate-300 font-mono text-base">●</span>
          </div>
        </div>
      ) : (
              <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto">
                {feed.map((ev) => (
                  <div key={ev.id} className="p-4 space-y-1 slide-in">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-mono text-blue-600">{ev.voter.slice(0, 10)}...{ev.voter.slice(-6)}</p>
                      <p className="text-base text-slate-300 font-mono">{ev.time}</p>
                    </div>
                    <p className="text-base font-bold text-slate-700">
                      voted for <span className="text-slate-900">{ev.candidate}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
            </div>

            {/* Turnout */}
            <div className="card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-base font-bold text-slate-900 uppercase tracking-widest">Voter turnout</p>
                <p className="text-2xl font-black text-slate-900">{participation}%</p>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{ width: `${participation}%` }} />
              </div>
              <div className="flex justify-between text-base font-bold">
                <span className="text-green-600">{votedVoters.length} voted</span>
                <span className="text-orange-500">{totalVoters - votedVoters.length} remaining</span>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};


// ============================================
// DashboardView — cards vers pages séparées
// ============================================
const DashboardView = () => {
  
  const { isOrganizer, isRegisteredVoter, hasVoted, isVotingOpen, isCandidate } = useContext(VotingContext);
  const role = isOrganizer ? 'organizer' : isCandidate ? 'candidate' : isRegisteredVoter ? 'voter' : 'guest';
  
  const roleInfo: Record<string, { label: string; badge: string; dot: string; message: string }> = {
    organizer: { label: 'Election Organizer', badge: 'bg-violet-50 text-violet-700 border border-violet-200', dot: 'bg-violet-500', message: 'Organizers cannot vote.' },
    candidate: { label: 'Registered Candidate', badge: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500', message: 'Candidates cannot vote.' },
    voter:     { label: hasVoted ? 'Vote Submitted' : 'Registered Voter', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', message: hasVoted ? 'Your vote is permanently recorded.' : 'Cast your vote before the session ends.' },
    guest:     { label: 'Not Registered', badge: 'bg-slate-100 text-slate-500 border border-slate-200', dot: 'bg-slate-400', message: 'Contact the organizer to be whitelisted.' },
  };

  const allCards: Record<string, any[]> = {
    organizer: [
      { title: 'Register voters', desc: 'Whitelist eligible wallets on-chain', buttonLabel: 'Open form', bgColor: '#2563EB', icon: '👥', href: '/allowed-voters' },
      { title: 'Register candidates', desc: 'Add candidate identities to the ledger', buttonLabel: 'Open form', bgColor: '#7C3AED', icon: '🎯', href: '/candidate-registration' },
      { title: 'Voter registry', desc: 'Verify all registered identities', buttonLabel: 'View list', bgColor: '#059669', icon: '📋', href: '/voter-list' },
      { title: 'Candidate directory', desc: 'Browse profiles and live vote counts', buttonLabel: 'Browse', bgColor: '#4F46E5', icon: '📊', href: '/candidate-list' },
      { title: 'Audit and results', desc: 'Verify the cryptographic tally', buttonLabel: 'View results', bgColor: '#EA580C', icon: '🔐', href: '/results' },
      { title: 'Admin panel', desc: 'Manage rounds, periods, and account status', buttonLabel: 'Open panel', bgColor: '#0F172A', icon: '⚙️', href: '/admin' },
    ],
    candidate: [
      { title: 'Voter registry', desc: 'Verify all registered identities', buttonLabel: 'View list', bgColor: '#059669', icon: '📋', href: '/voter-list' },
      { title: 'Candidate directory', desc: 'See your profile and compare', buttonLabel: 'View directory', bgColor: '#D97706', icon: '🎯', href: '/candidate-list' },
      { title: 'Audit and results', desc: 'Track your vote count live', buttonLabel: 'View results', bgColor: '#2563EB', icon: '📊', href: '/results' },
    ],
    voter: [
      { title: 'Voter registry', desc: 'Verify all registered identities', buttonLabel: 'View list', bgColor: '#059669', icon: '📋', href: '/voter-list' },
      { title: 'Candidate directory', desc: 'Browse official candidate profiles', buttonLabel: 'Browse', bgColor: '#7C3AED', icon: '📊', href: '/candidate-list' },
      { title: 'Audit and results', desc: 'Follow results in real time', buttonLabel: 'View results', bgColor: '#2563EB', icon: '🔐', href: '/results' },
    ],
    guest: [
      { title: 'Voter registry', desc: 'Verify all registered identities', buttonLabel: 'View list', bgColor: '#059669', icon: '📋', href: '/voter-list' },
      { title: 'Candidate directory', desc: 'Browse all registered candidates', buttonLabel: 'Browse', bgColor: '#7C3AED', icon: '📊', href: '/candidate-list' },
      { title: 'Audit and results', desc: 'View public election results', buttonLabel: 'View results', bgColor: '#2563EB', icon: '🔐', href: '/results' },
    ],
  };

const info = roleInfo[role];
  const sessionEnded = !isVotingOpen;
  const displayMessage = sessionEnded ? '🏁 The voting session has ended.' : info.message;

  let cards = allCards[role] || allCards.guest;
  if (sessionEnded) {
    cards = cards.filter((c) => c.href !== '/allowed-voters' && c.href !== '/candidate-registration');
  }
  return (
    <section className="max-w-7xl mx-auto px-8 py-14 space-y-12">

{/* ── Header ── */}
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
            {role.charAt(0).toUpperCase() + role.slice(1)}'s <span className="text-blue-600">workspace</span>
          </h2>
         {/* role badge — same line as the title */}
          <span className={`inline-flex items-start gap-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest shrink-0 max-w-xs ${
            sessionEnded ? 'bg-red-50 text-red-700 border border-red-200' : info.badge
          }`}>
            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${sessionEnded ? 'bg-red-500' : info.dot}`} />
            <span>{displayMessage}</span>
          </span>
        </div>

      </div>

      {/* ── Cards ── */}
      <div className="fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          
           <a key={i}
            href={card.href}
            className="group relative flex flex-col justify-between bg-white border border-slate-200/70 rounded-3xl p-6 min-h-[190px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            {/* soft accent glow */}
            <div
              className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
              style={{ backgroundColor: card.bgColor }}
            />

            <div className="relative space-y-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${card.bgColor}1A`, color: card.bgColor }}
              >
                {card.icon}
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">{card.title}</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{card.desc}</p>
              </div>
            </div>

            <div
              className="relative inline-flex items-center gap-1.5 text-sm font-black mt-6 transition-all group-hover:gap-2.5"
              style={{ color: card.bgColor }}
            >
              {card.buttonLabel}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

// ============================================
// DocsView
// ============================================
const DocSection = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <div className="card p-8 space-y-4">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">{icon}</div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
    </div>
    <div className="text-slate-500 text-base leading-relaxed font-medium space-y-3">{children}</div>
  </div>
);

const DocsView = () => (
  <section className="max-w-4xl mx-auto px-8 py-14 space-y-8">
    <div className="space-y-3">
      <h2 className="text-6xl font-black tracking-tighter text-slate-900">How it <span className="text-blue-600">works.</span></h2>
      <p className="text-xl text-slate-900 font-medium">Everything you need to understand the election process.</p>
    </div>
    <DocSection icon="🏛️" title="What is this system?">
      <p>Buras.Vote is a decentralized voting system built on Ethereum. Every vote, registration, and result is stored permanently on-chain — no authority can alter or delete any data.</p>
      <p>Smart contracts replace the traditional central authority. Instead of trusting an organization, you trust the code — public, auditable, and immutable.</p>
    </DocSection>
    <DocSection icon="📜" title="The live contract">
      <p>This app talks to a single smart contract deployed on the Sepolia testnet. Every vote, registration, and result on this site is read straight from it — and you can inspect the verified source yourself:</p>
      <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
        <p className="text-xs font-mono text-slate-600 break-all">{votingAddress}</p>
        
        <a href={`https://sepolia.etherscan.io/address/${votingAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-all"
        >
          🔍 View on Etherscan
        </a>
      </div>
    </DocSection>
    <DocSection icon="👥" title="Who can participate?">
      <div className="space-y-3">
        {[
          { icon: '👑', role: 'Organizer', desc: 'Deployed the contract. Registers voters and candidates, sets voting periods. Cannot vote.' },
          { icon: '🎯', role: 'Candidate', desc: 'Registered by the organizer. Vote count is publicly visible. Cannot vote.' },
          { icon: '✅', role: 'Voter', desc: 'Whitelisted by the organizer. One vote per round. Anonymous and permanent.' },
        ].map(({ icon, role, desc }) => (
          <div key={role} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
            <span className="text-xl">{icon}</span>
            <div><p className="font-black text-slate-900 text-base">{role}</p><p>{desc}</p></div>
          </div>
        ))}
      </div>
    </DocSection>
    <DocSection icon="🗳️" title="The voting process">
      <div className="space-y-3">
        {[
          { step: '01', title: 'Registration', desc: 'The organizer registers voters and candidates on-chain.' },
          { step: '02', title: 'Session opens', desc: 'A voting window is set. Registered voters cast exactly one vote.' },
          { step: '03', title: 'Cast your vote', desc: 'Connect MetaMask, pick your candidate, sign the transaction. Instant and permanent.' },
          { step: '04', title: 'Results', desc: 'Once the session ends, results are publicly visible and verifiable.' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-base font-black shrink-0">{step}</div>
            <div><p className="font-black text-slate-900 text-base">{title}</p><p>{desc}</p></div>
          </div>
        ))}
      </div>
    </DocSection>
    <DocSection icon="⚡" title="What is Round 2?">
      <p>If Round 1 ends in a tie, the organizer triggers a second round. All votes reset — voters must cast their vote again.</p>
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 mt-2">
        <span className="text-xl">⚠️</span>
        <p className="text-amber-800">Round 2 is triggered manually. The system supports multiple rounds — each one resets all previous votes.</p>
      </div>
    </DocSection>
    <DocSection icon="🔐" title="Security and transparency">
      <div className="space-y-2">
        {['Smart contracts replace the central authority', 'Votes are permanent once submitted', 'All data is publicly auditable on-chain', 'Access control enforces who can register and vote', 'No single point of failure'].map((t) => (
          <div key={t} className="flex items-center gap-3"><span className="text-green-600 font-black">✓</span><p>{t}</p></div>
        ))}
      </div>
    </DocSection>
    <DocSection icon="🦊" title="How to connect with MetaMask">
      <div className="space-y-2">
        {['Install MetaMask from metamask.io', 'Create or import your wallet', 'Switch to the Sepolia test network (chain ID 11155111)', 'Click Connect Wallet — MetaMask will ask for approval', 'Your role is automatically detected from the smart contract'].map((t, i) => (
          <div key={i} className="flex items-start gap-3"><span className="font-black text-blue-600 shrink-0">{i + 1}.</span><p>{t}</p></div>
        ))}
      </div>
    </DocSection>
  </section>
);

// ============================================
// Main Page
// ============================================
type Tab = 'home' | 'warroom' | 'dashboard' | 'docs';

export default function Page() {
  const [tab, setTab] = useState<Tab>('home');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'warroom', label: '🔴 Live' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'docs', label: 'Documentation' },
  ];

  return (
    <div className="page-root pb-20">
      <PageBg />
      <div className="flex justify-center pt-10">
        <div style={{ background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} className="p-1.5 rounded-2xl inline-flex gap-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-8 py-3 rounded-xl text-base font-black uppercase tracking-widest transition-all cursor-pointer ${
                tab === t.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-900 hover:text-slate-600'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'home'      && <HomeView />}
      {tab === 'warroom'   && <WarRoomView />}
      {tab === 'dashboard' && <DashboardView />}
      {tab === 'docs'      && <DocsView />}
    </div>
  );
}