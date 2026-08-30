"use client";

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { VotingContext } from '../../context/Voter';

const AllowedVoters = () => {
  const { uploadToIpfs, createVoter, isOrganizer, isVotingOpen, getCurrentRound, error: contextError, currentAccount, authLoading } = useContext(VotingContext);
  const [round, setRound] = useState(1);
  useEffect(() => {
    getCurrentRound().then((r) => setRound(r || 1)).catch(() => {});
  }, []);
  const [formInput, setFormInput] = useState({ name: '', address: '', age: '' });
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setFormError('');
    const url = await uploadToIpfs(file);
    if (url) setFileUrl(url);
  }, [uploadToIpfs]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 5_000_000,
  });

  // ---- Guards ----
  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!currentAccount) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <span className="text-6xl">🔌</span>
      <p className="text-xl font-bold text-slate-500">Connect your wallet to access this page</p>
    </div>
  );

  if (round > 1) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <span className="text-6xl">🔒</span>
      <p className="text-xl font-bold text-slate-500">Registration is closed — Round {round} is in progress.</p>
      <p className="text-sm text-slate-400">Voters and candidates can only be added before Round 2 starts.</p>
    </div>
  );
  if (!isOrganizer) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <span className="text-6xl">🔒</span>
      <p className="text-xl font-bold text-slate-500">Access restricted to the organizer</p>
    </div>
  );
  if (!isVotingOpen) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <span className="text-6xl">🔒</span>
      <p className="text-xl font-bold text-slate-500">Registration is closed — the voting session has ended.</p>
    </div>
  );

  const validate = () => {
    if (!preview) return 'Please upload a voter photo.';
    if (!formInput.name.trim()) return 'Please enter the voter name.';
    if (!/^[a-zA-Z\s]+$/.test(formInput.name.trim())) return 'Name must contain letters only.';
    if (!/^0x[a-fA-F0-9]{40}$/.test(formInput.address)) return 'Please enter a valid Ethereum address.';
    if (!formInput.age || Number(formInput.age) < 18) return 'Voter must be at least 18 years old.';
    return null;
  };

  const handleSubmit = async () => {
    setFormError(''); setSuccess('');
    const err = validate();
    if (err) { setFormError(err); return; }
    setLoading(true);
    try {
      const imageUrl = fileUrl || preview || '';
      await createVoter(formInput.address, formInput.name, Number(formInput.age), imageUrl, imageUrl);
      setFormError('');
      setSuccess(`${formInput.name} has been successfully registered!`);
      setFormInput({ name: '', address: '', age: '' });
      setFileUrl(null); setPreview(null);
    } catch (err: any) {
      console.log("VOTER REG ERROR:", err); 
      setSuccess('');
      const msg = err?.reason || err?.message || err?.data?.message || '';
      if (msg.includes('already registered') || msg.includes('isVoter')) {
        setFormError('This address is already registered as a voter.');
      } else if (msg.includes('isCandidate') || msg.includes('active candidate')) {
        setFormError('This address is already registered as a candidate.');
      } else if (msg.includes('rejected')) {
        setFormError('Transaction rejected by user.');
      } else {
        setFormError('Transaction failed. Please verify the address.');
      }
    } finally { setLoading(false); }
  };

  const inputClass = "w-full px-6 py-5 text-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="w-full px-8 py-8">
      <div className="max-w-[1400px] mx-auto mb-10 space-y-3">
        <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
          Voter <span className="text-blue-600">Registration</span>
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
          Register voters on-chain. Only the organizer can perform this action.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">

        <div className="buras-glass rounded-3xl p-10 space-y-8">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            New <span className="text-blue-600">Voter</span>
          </h3>

          <div {...getRootProps()} className={`w-full border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${preview ? 'border-blue-500' : 'border-slate-300 dark:border-slate-700 hover:border-blue-500'}`}>
            <input {...getInputProps()} />
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="Preview" className="w-40 h-40 mx-auto rounded-2xl object-cover shadow-2xl" />
                <p className="text-sm text-blue-600 font-bold">Change Image</p>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-5xl">📸</span>
                <p className="text-base text-slate-400 font-medium">Upload Voter Portrait</p>
                <p className="text-xs text-slate-300 uppercase tracking-widest font-bold">Max 5MB</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <input type="text" placeholder="Full Name" value={formInput.name}
              onChange={(e) => { setFormInput({ ...formInput, name: e.target.value }); setFormError(''); }} className={inputClass} />
            <input type="text" placeholder="Wallet Address (0x...)" value={formInput.address}
              onChange={(e) => { setFormInput({ ...formInput, address: e.target.value }); setFormError(''); }} className={inputClass} />
            <input type="number" placeholder="Age (min 18)" value={formInput.age}
              onChange={(e) => { setFormInput({ ...formInput, age: e.target.value }); setFormError(''); }} className={inputClass} />
          </div>

          <div className="min-h-[60px]">
            {formError || contextError ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold border border-red-100 dark:border-red-900/50">
                ⚠️ {formError || contextError}
              </div>
            ) : success ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl font-bold border border-green-100 dark:border-green-900/50">
                ✓ {success}
              </div>
            ) : null}
          </div>

          <button onClick={handleSubmit} disabled={loading || (!fileUrl && !!preview)}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer">
            {loading ? 'Processing...' : !fileUrl && preview ? 'Uploading Image...' : 'Confirm Registration'}
          </button>
        </div>

        <div className="buras-glass rounded-3xl p-10 space-y-8">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Identity <span className="text-blue-600">Card</span>
          </h3>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-xl overflow-hidden">
              <div className="relative h-80 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img src={preview || '/placeholder.png'} alt="Voter" className="w-full h-full object-cover" />
                <div className="absolute top-6 right-6">
                  <span className="px-4 py-2 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl text-slate-900 dark:text-white">
                    Official Voter
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">Full Name</label>
                  <p className="text-2xl font-black text-slate-900 dark:text-white truncate">{formInput.name || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Age</label>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{formInput.age || '--'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Status</label>
                    <p className="text-lg font-bold text-orange-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> Pending
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Ethereum Address</label>
                  <p className="text-xs font-mono text-slate-400 truncate">{formInput.address || '0x0000...0000'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AllowedVoters;