"use client";

import React, { useContext, useEffect, useState } from 'react';
import { VotingContext } from '../context/Voter';

const StatusBanner = () => {
  const {
    isPaused, currentAccount, isRegisteredVoter, isVoterActive,
    isVotingOpen, hasVoted, isOrganizer, isCandidate, networkError,
  } = useContext(VotingContext);

  const [online, setOnline] = useState(true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const canVote = isRegisteredVoter && !hasVoted && isVotingOpen
    && !isOrganizer && !isCandidate && !isPaused && isVoterActive !== false;

  // Priorité : réseau/500 > pause > compte désactivé > peut voter
  let banner = null;
  if (!online || networkError) {
    banner = { color: 'bg-slate-800 text-white', icon: '📶', msg: networkError || 'Weak or lost connection — data may be out of date.' };
  } else if (isPaused) {
    banner = { color: 'bg-amber-500 text-white', icon: '⏸️', msg: 'Voting is paused by the organizer.' };
  } else if (currentAccount && isRegisteredVoter && isVoterActive === false) {
    banner = { color: 'bg-red-600 text-white', icon: '⛔', msg: 'Your voter account has been deactivated. You cannot vote.' };
  } else if (canVote) {
    banner = { color: 'bg-green-600 text-white', icon: '🗳️', msg: 'You can vote now — open the candidate list and cast your vote.' };
  }

  if (!banner) return null;

  return (
    <div className={`w-full ${banner.color} text-center text-sm font-bold py-2 px-4 flex items-center justify-center gap-2`}>
      <span>{banner.icon}</span>
      <span>{banner.msg}</span>
    </div>
  );
};

export default StatusBanner;