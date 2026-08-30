"use client";

import React from 'react';

const VoterCard = ({ voterName, image, address, hasVoted }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">

      {/* Image */}
      <div className="relative h-72 w-full bg-slate-200 overflow-hidden">
        <Image
          src={image || '/placeholder.png'}
          alt={voterName}
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className={`absolute top-4 right-4 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-lg ${hasVoted ? 'bg-green-600' : 'bg-slate-500'}`}>
          {hasVoted ? 'Voted' : 'Pending'}
        </div>
      </div>

      {/* Détails */}
      <div className="p-8 space-y-4">
        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {voterName}
        </h4>
        <p className="text-sm font-mono text-slate-400 truncate">
          {address}
        </p>
        <div className={`text-sm font-bold uppercase tracking-widest ${hasVoted ? 'text-green-600' : 'text-orange-500'}`}>
          {hasVoted ? '✓ Vote recorded on-chain' : '○ Has not voted yet'}
        </div>
      </div>

    </div>
  );
};

export default VoterCard;