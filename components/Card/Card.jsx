"use client";

// http://localhost:3001/vote
import React from 'react';

const Card = ({ candidateName, image, message, onVote }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-64 w-full bg-slate-200 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={candidateName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800">
              <span className="text-6xl">👤</span>
            </div>
          )}
          <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
            Candidate
          </div>
        </div>

      {/* Détails */}
      <div className="p-6 space-y-4">
        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {candidateName}
        </h4>

        <p className="text-gray-500 text-sm font-medium leading-relaxed">
          {message}
        </p>

        <button
        onClick={onVote}
        disabled={!onVote}
        className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
        {!onVote ? 'Already Voted' : 'Cast Secure Vote'}
        </button>
      </div>
    </div>
  );
};

export default Card;