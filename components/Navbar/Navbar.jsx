"use client";

import React, { useState, useContext, useRef, useEffect } from 'react';
import Link from 'next/link';
import { VotingContext } from '../../context/Voter';

const Navbar = () => {
  const { connectWallet, currentAccount, balance, isOrganizer, isRegisteredVoter, isCandidate } = useContext(VotingContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabel = isOrganizer
    ? { text: 'Organizer', icon: '👑', color: 'bg-slate-900 text-white' }
    : isCandidate
    ? { text: 'Candidate', icon: '🎯', color: 'bg-amber-100 text-amber-700' }
    : isRegisteredVoter
    ? { text: 'Voter', icon: '✅', color: 'bg-green-100 text-green-700' }
    : { text: 'Guest', icon: '👤', color: 'bg-slate-100 text-slate-500' };

  const shortAddr = currentAccount
    ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`
    : '';

  const handleDisconnect = () => {
    // MetaMask ne supporte pas le disconnect programmatique
    // On recharge la page pour reset le state
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <header className="w-full flex justify-between items-center px-8 py-4 bg-white dark:bg-neutral-950 border-b border-slate-100 dark:border-neutral-800 shadow-sm sticky top-0 z-50">

      {/* LOGO */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
          <span className="text-white font-black text-xl">B</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
          Buras<span className="text-blue-600">.Vote</span>
        </h1>
      </Link>

      {/* DROITE */}
      <div className="relative" ref={dropdownRef}>
        {!currentAccount ? (
          <button
            onClick={connectWallet}
            className="px-7 py-3 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all cursor-pointer shadow-md"
          >
            Connect Wallet
          </button>
        ) : (
          <>
            {/* Trigger button — pill */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all cursor-pointer"
            >
              {/* Live dot */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>

              {/* Adresse courte */}
              <span className="text-xs font-black font-mono text-slate-700">{shortAddr}</span>

              {/* Role pill */}
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${roleLabel.color}`}>
                {roleLabel.icon} {roleLabel.text}
              </span>

              {/* Flèche */}
              <svg
                className={`transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {/* Dropdown — pill style compact */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-3 w-72 bg-white border border-slate-100 rounded-3xl shadow-xl p-4 space-y-2 z-50">

                {/* Adresse complète */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Wallet</p>
                    <p className="text-xs font-mono font-bold text-slate-700 break-all">{currentAccount}</p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(currentAccount); }}
                    className="ml-3 text-slate-300 hover:text-blue-500 transition-colors cursor-pointer shrink-0"
                    title="Copy address"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>

                {/* Role + Balance — deux pills côte à côte */}
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl">
                    <span className="text-base">{roleLabel.icon}</span>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Role</p>
                      <p className="text-xs font-black text-slate-800">{roleLabel.text}</p>
                    </div>
                  </div>
              
                </div>

                {/* Disconnect */}
                <button
                  onClick={handleDisconnect}
                  className="w-full py-3 flex items-center justify-center gap-2 text-xs font-black text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer uppercase tracking-widest"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Disconnect
                </button>

              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;