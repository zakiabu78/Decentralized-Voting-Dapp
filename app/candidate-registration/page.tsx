"use client";

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { VotingContext } from '../../context/Voter';
import Card from '../../components/Card/Card';

const CandidateRegistration = () => {
  const { uploadToIpfs, createCandidate, isOrganizer, isVotingOpen, getCurrentRound, error: contextError, currentAccount, authLoading } = useContext(VotingContext);

  const [round, setRound] = useState(1);
  useEffect(() => {
    getCurrentRound().then((r) => setRound(r || 1)).catch(() => {});
  }, []);

  const [formInput, setFormInput] = useState({ name: '', address: '', age: '' });
  const [fileUrl, setFileUrl]     = useState(null);
  const [preview, setPreview]     = useState(null);
  const [formError, setFormError] = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
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

  if (!isOrganizer) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <span className="text-6xl">🔒</span>
      <p className="text-xl font-bold text-slate-500">Access restricted to the organizer</p>
    </div>
  );

   if (round > 1) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <span className="text-6xl">🔒</span>
      <p className="text-xl font-bold text-slate-500">Registration is closed — Round {round} is in progress.</p>
      <p className="text-sm text-slate-400">Voters and candidates can only be added before Round 2 starts.</p>
    </div>
  );

  if (!isVotingOpen) return (
    <div className="max-w-xl mx-auto py-24 text-center space-y-4">
      <span className="text-6xl block">🔒</span>
      <p className="text-xl font-bold text-slate-600">Registration is closed — the voting session has ended.</p>
    </div>
  );

  const validate = () => {
    if (!preview) return 'Please upload a candidate photo.';
    if (!formInput.name.trim()) return 'Please enter the candidate name.';
    if (!/^[a-zA-Z\s]+$/.test(formInput.name.trim())) return 'Name must contain letters only.';
    if (!/^0x[a-fA-F0-9]{40}$/.test(formInput.address)) return 'Please enter a valid Ethereum address.';
    if (!formInput.age || Number(formInput.age) < 18) return 'Candidate must be at least 18 years old.';
    return null;
  };

  const handleSubmit = async () => {
    setFormError(''); setSuccess('');
    const err = validate();
    if (err) { setFormError(err); return; }
    setLoading(true);
    try {
      const imageUrl = fileUrl || preview || '';
      await createCandidate(formInput.address, formInput.name, Number(formInput.age), imageUrl, imageUrl);
      setSuccess(`${formInput.name} has been registered as a candidate.`);
      setFormInput({ name: '', address: '', age: '' });
      setFileUrl(null); setPreview(null); setFormError('');
    } catch (err) {
      setSuccess('');
      const msg = err?.reason || err?.message || err?.data?.message || '';
      if (msg.includes('already registered') || msg.includes('isCandidate')) {
        setFormError('This address is already registered as a candidate.');
      } else if (msg.includes('active voter') || msg.includes('isVoter')) {
        setFormError('This address is already a registered voter.');
      } else if (msg.includes('rejected')) {
        setFormError('Transaction rejected by user.');
      } else {
        setFormError('Transaction failed. Make sure you are the organizer.');
      }
    } finally { setLoading(false); }
  };

  const inputClass = "w-full px-6 py-5 text-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  
  return (
    <div className="w-full px-8 py-8">
      <div className="max-w-[1400px] mx-auto mb-10 space-y-3">
        <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
          Candidate <span className="text-blue-600">Registration</span>
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
          Register candidates on-chain. Only the organizer can perform this action.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">

        <div className="buras-glass rounded-3xl p-10 space-y-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 shadow-2xl">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            New <span className="text-blue-600">Candidate</span>
          </h3>

          <div {...getRootProps()} className={`w-full border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${preview ? 'border-blue-500' : 'border-slate-300 dark:border-slate-700 hover:border-blue-500'}`}>
            <input {...getInputProps()} />
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="Preview" className="w-40 h-40 mx-auto rounded-2xl object-cover shadow-2xl" />
                <p className="text-sm text-blue-600 font-bold">Click to change photo</p>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-5xl">📷</span>
                <p className="text-base text-slate-400 font-medium">Drop candidate photo here, or click to select</p>
                <p className="text-xs text-slate-300 uppercase tracking-widest font-bold">Max 5MB</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <input type="text" placeholder="Full name" value={formInput.name}
              onChange={(e) => { setFormInput({ ...formInput, name: e.target.value }); setFormError(''); }} className={inputClass} />
            <input type="text" placeholder="Wallet address (0x...)" value={formInput.address}
              onChange={(e) => { setFormInput({ ...formInput, address: e.target.value }); setFormError(''); }} className={inputClass} />
            <input type="number" placeholder="Age (min 18)" value={formInput.age}
              onChange={(e) => { setFormInput({ ...formInput, age: e.target.value }); setFormError(''); }} className={inputClass} />
          </div>

          <div className="min-h-[60px]">
            {(formError || contextError) && (
              <div className="w-full px-5 py-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 font-bold">
                ⚠️ {formError || contextError}
              </div>
            )}
            {success && (
              <div className="w-full px-5 py-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-2xl text-green-600 dark:text-green-400 font-bold">
                ✓ {success}
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={loading || (!fileUrl && !!preview)}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer">
            {loading ? 'Processing...' : !fileUrl && preview ? 'Uploading image...' : 'Register Candidate On-Chain'}
          </button>
        </div>

        <div className="buras-glass rounded-3xl p-10 space-y-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Live <span className="text-blue-600">Preview</span>
          </h3>
          {formInput.name || preview ? (
            <Card
              candidateName={formInput.name || 'Candidate Name'}
              image={preview || '/placeholder.png'}
              message={formInput.age ? `Age: ${formInput.age} | ${formInput.address ? formInput.address.slice(0, 6) + '...' : 'No address'}` : 'Fill the form to see the preview'}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
              <span className="text-7xl">🎯</span>
              <p className="text-base font-medium text-center">Fill the form to see the candidate card preview here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CandidateRegistration;