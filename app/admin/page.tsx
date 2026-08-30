"use client";

import React, { useState, useContext, useEffect } from 'react';
import { VotingContext } from '../../context/Voter';

const AdminCard = ({ icon, title, children }) => (
  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6 h-full">
    <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl">{icon}</div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
    </div>
    {children}
  </div>
);

const LinkCard = ({ icon, title, desc, href, buttonLabel, bgColor }) => (
  <div className="relative overflow-hidden rounded-[2rem] min-h-[200px] flex flex-col justify-end shadow-lg">
    <div className="absolute inset-0" style={{ backgroundColor: bgColor }} />
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
      <circle cx="260" cy="20" r="90" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" fill="none"/>
      <circle cx="260" cy="20" r="135" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" fill="none"/>
      <circle cx="30" cy="190" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none"/>
    </svg>
    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${bgColor}FA 50%, ${bgColor}44 100%)` }} />
    <div className="relative z-10 p-7 space-y-3">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(255,255,255,0.15)' }}>{icon}</div>
      <h4 className="text-xl font-black text-white tracking-tight">{title}</h4>
      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>{desc}</p>
      <a href={href} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold hover:scale-105 transition-all"
        style={{ background: 'rgba(255,255,255,0.18)', border: '0.5px solid rgba(255,255,255,0.28)' }}>
        {buttonLabel} →
      </a>
    </div>
  </div>
);

const inp = "w-full px-5 py-4 text-sm rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium";

export default function AdminPage() {
  const {
    currentAccount, isOrganizer, isVotingOpen, authLoading,
    getVotingPeriod, getCurrentRound,
    emergencyPause, unpause,
    deactivateVoter, reactivateVoter, deactivateCandidate, reactivateCandidate,
  } = useContext(VotingContext);

  const [round, setRound]         = useState(1);
  const [period, setPeriod]       = useState(null);
  const [now, setNow]             = useState(Math.floor(Date.now() / 1000));
  const [loading, setLoading]     = useState(false);
  const [pauseMsg, setPauseMsg]   = useState('');
  const [pauseError, setPauseError] = useState('');
  const [deactAddr, setDeactAddr]   = useState('');
  const [deactType, setDeactType]   = useState('voter');
  const [deactAction, setDeactAction] = useState('deactivate');
  const [deactMsg, setDeactMsg]     = useState('');
  const [deactError, setDeactError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, r] = await Promise.all([getVotingPeriod(), getCurrentRound()]);
        setPeriod(p);
        setRound(r || 1);
      } catch (e) {}
    };
    load();
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // ---- Guards ----
  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!currentAccount) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <span className="text-6xl">🔌</span>
      <p className="text-xl font-bold text-slate-500">Connect your wallet to access the admin panel</p>
    </div>
  );

  if (!isOrganizer) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <span className="text-6xl">🔒</span>
      <p className="text-xl font-bold text-slate-500">Access restricted to the organizer</p>
    </div>
  );

  const fmt = (ts) => new Date(ts * 1000).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const handlePause = async () => {
    setPauseMsg(''); setPauseError(''); setLoading(true);
    try { await emergencyPause(); setPauseMsg('Contract paused. No votes can be cast until unpaused.'); }
    catch (e) {
      console.log("PAUSE ERROR:", e);   
      const msg = e?.reason || e?.message || '';
      if (msg.includes('rejected')) setPauseError('Transaction rejected.');
      else setPauseError('Failed to pause contract.');
    } finally { setLoading(false); }
  };

  const handleUnpause = async () => {
    setPauseMsg(''); setPauseError(''); setLoading(true);
    try { await unpause(); setPauseMsg('Contract unpaused. Voting is now active again.'); }
    catch (e) {
      const msg = e?.reason || e?.message || '';
      if (msg.includes('rejected')) setPauseError('Transaction rejected.');
      else setPauseError('Failed to unpause contract.');
    } finally { setLoading(false); }
  };

  const handleDeactivate = async () => {
    setDeactMsg(''); setDeactError('');
    if (!/^0x[a-fA-F0-9]{40}$/.test(deactAddr)) { setDeactError('Please enter a valid Ethereum address.'); return; }
    setLoading(true);
    try {
      if (deactType === 'voter' && deactAction === 'deactivate')          await deactivateVoter(deactAddr);
      else if (deactType === 'voter' && deactAction === 'reactivate')     await reactivateVoter(deactAddr);
      else if (deactType === 'candidate' && deactAction === 'deactivate') await deactivateCandidate(deactAddr);
      else                                                                  await reactivateCandidate(deactAddr);
      setDeactMsg(`${deactType.charAt(0).toUpperCase() + deactType.slice(1)} ${deactAction}d successfully.`);
      setDeactAddr('');
    } catch (e) {
      const msg = e?.reason || e?.message || '';
      if (msg.includes('Not a registered')) setDeactError(`This address is not a registered ${deactType}.`);
      else if (msg.includes('already'))     setDeactError(`Already ${deactAction === 'deactivate' ? 'inactive' : 'active'}.`);
      else if (msg.includes('rejected'))    setDeactError('Transaction rejected.');
      else setDeactError(`Failed to ${deactAction} ${deactType}.`);
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full px-8 py-10 space-y-10 max-w-[1300px] mx-auto">

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">⚙️</span>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900">Admin Panel</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
            isVotingOpen ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isVotingOpen ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
            {isVotingOpen ? 'Session active' : 'Session closed'}
          </span>
          <span className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black uppercase tracking-widest">
            Round {round}
          </span>
          {period && (
            <span className="text-sm text-slate-400 font-medium">
              {now < period.start ? `Starts ${fmt(period.start)}` : now <= period.end ? `Ends ${fmt(period.end)}` : `Ended ${fmt(period.end)}`}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <AdminCard icon="🚨" title="Emergency Controls">
          <p className="text-sm text-slate-400 font-medium">Pause the contract immediately in case of an emergency. No votes can be cast while paused.</p>
          {pauseMsg   && <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-600 text-sm font-medium">✓ {pauseMsg}</div>}
          {pauseError && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium">⚠️ {pauseError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handlePause} disabled={loading} className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all disabled:opacity-50 cursor-pointer">🔴 Pause</button>
            <button onClick={handleUnpause} disabled={loading} className="py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm transition-all disabled:opacity-50 cursor-pointer">🟢 Unpause</button>
          </div>
        </AdminCard>

        <AdminCard icon="🔧" title="Manage Status">
          <p className="text-sm text-slate-400 font-medium">Deactivate or reactivate a voter or candidate. A deactivated voter cannot vote. A deactivated candidate is excluded from results.</p>
          <div className="space-y-3">
            <input type="text" placeholder="0x wallet address..." value={deactAddr} onChange={(e) => setDeactAddr(e.target.value)} className={inp} />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex rounded-2xl border border-slate-200 overflow-hidden h-[48px]">
                {['voter', 'candidate'].map((t) => (
                  <button key={t} onClick={() => setDeactType(t)}
                    className={`flex-1 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${deactType === t ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex rounded-2xl border border-slate-200 overflow-hidden h-[48px]">
                {['deactivate', 'reactivate'].map((a) => (
                  <button key={a} onClick={() => setDeactAction(a)}
                    className={`flex-1 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                      deactAction === a ? a === 'deactivate' ? 'bg-red-600 text-white' : 'bg-green-600 text-white' : 'text-slate-400 hover:text-slate-700'
                    }`}>
                    {a === 'deactivate' ? '⛔ Off' : '✅ On'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {deactMsg   && <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-600 text-sm font-medium">✓ {deactMsg}</div>}
          {deactError && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium">⚠️ {deactError}</div>}
          <button onClick={handleDeactivate} disabled={loading || !deactAddr}
            className={`w-full py-4 text-white rounded-2xl font-black text-sm transition-all disabled:opacity-50 cursor-pointer ${deactAction === 'deactivate' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {loading ? 'Processing...' : `${deactAction === 'deactivate' ? 'Deactivate' : 'Reactivate'} ${deactType}`}
          </button>
        </AdminCard>

      </div>

      <div>
     
      </div>

    </div>
  );
}