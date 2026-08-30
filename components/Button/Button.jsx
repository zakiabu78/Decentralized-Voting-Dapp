"use client";

import React from 'react';

const Button = ({ label, onClick }) => (
  // label — le texte affiché sur le bouton
  // onClick — la fonction à exécuter au clic
  <button
    onClick={onClick}
    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
  >
    {label}
  </button>
);

export default Button;

// Comment on l'utilise
// Dans AllowedVoters <Button label="Register Voter" onClick={handleSubmit} />
// Dans n'importe quelle page <Button label="Cast Vote" onClick={() => vote(candidateId)} />