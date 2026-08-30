"use client";

import React from 'react';

const Input = ({ placeholder, value, onChange, type = "text" }) => (
  <input
    type={type}   // typeType de champ : "text", "number", "password" — par défaut "text"
    placeholder={placeholder}
    value={value} // La valeur actuelle : formInput.name
    onChange={onChange} // onChangeCe qui se passe quand on tape(e) => setFormInput(...)
    className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
  />
);

// Quand l'utilisateur tape dans un input, le navigateur crée un événement et le passe à ta fonction (e)
// 

export default Input;

// Comment on l'utilise
// <Input placeholder="Voter name" value={formInput.name} 
// onChange={(e) => setFormInput({ ...formInput, name: e.target.value })} /> 
// ce qu'on veut modifier sans affecter les autres lignes
