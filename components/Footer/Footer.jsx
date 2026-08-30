"use client";

import React from 'react';

// ============================================
// FooterLink sub-component
// ============================================
const FooterLink = ({ label, href = '#' }) => (
  <a
    href={href}
    className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 relative group"
  >
    {label}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full" />
  </a>
);

// ============================================
// Footer
// ============================================
const Footer = () => {
  return (
    <footer className="w-full buras-glass border-t border-slate-200/50 dark:border-slate-800/50 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">

        {/* Branding */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
            <span className="text-base font-black tracking-[0.25em] uppercase text-slate-900 dark:text-white">
              Buras Vote
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Decentralized Voting on Ethereum
          </p>
        </div>

  
        {/* Tech info + copyright */}
        <div className="flex items-center gap-6">
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
              Solidity 0.8.28 — Ethereum
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            &copy; 2026
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;