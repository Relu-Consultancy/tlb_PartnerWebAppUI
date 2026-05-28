import React, { useState } from 'react';
import { CheckCircle2, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { Screen } from '../../types';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const IdentityVerification: React.FC<OnboardingProps> = ({ onNavigate }) => {
    const [pan, setPan] = useState(sessionStorage.getItem('pan_number') || '');
    const [gst, setGst] = useState(sessionStorage.getItem('gst_number') || '');
    const [error, setError] = useState('');

    const panValid = PAN_REGEX.test(pan);
    const panInvalid = pan.length === 10 && !panValid;

    const handleContinue = () => {
        if (!pan) { setError('PAN Number is required.'); return; }
        if (!panValid) { setError('Invalid PAN format. Expected: ABCDE1234F (5 letters, 4 digits, 1 letter)'); return; }
        setError('');
        sessionStorage.setItem('pan_number', pan);
        sessionStorage.setItem('gst_number', gst);
        onNavigate('BANK_SETUP');
    };

    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white p-4 sm:p-6 flex items-center justify-between border-b border-gray-100">
            <button onClick={() => onNavigate('HOME')} className="p-2 -ml-2 text-gray-400 hover:text-tlb-dark transition-colors">
                <ArrowLeft size={24} />
            </button>
            <h2 className="font-black text-lg">Identity Verification</h2>
            <div className="p-2 bg-tlb-yellow/10 rounded-xl"><Shield size={20} className="text-tlb-yellow" /></div>
        </header>

        <main className="p-4 sm:p-6">
            <div className="tlb-content space-y-8">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-2">
                        <CheckCircle2 size={12} /> Section A of 2
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black leading-tight">Identity<br />Verification</h1>
                    <p className="text-gray-400 mt-3 font-medium text-sm leading-relaxed max-w-sm">
                        Please provide your business identity details. This helps us verify your account securely.
                    </p>
                </div>

                {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                <section className="tlb-card space-y-6">
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                PAN Number <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    className={`tlb-input w-full uppercase pr-10 ${panInvalid ? 'border-red-400 focus:ring-red-200' : panValid ? 'border-emerald-400 focus:ring-emerald-200' : ''}`}
                                    placeholder="e.g. ABCDE1234F"
                                    maxLength={10}
                                    value={pan}
                                    onChange={(e) => { setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); }}
                                />
                                {panValid && <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                                {panInvalid && <AlertTriangle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                            </div>
                            {panValid && (
                                <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> PAN format verified
                                </p>
                            )}
                            {panInvalid && (
                                <p className="text-[10px] text-red-500 font-bold mt-1">
                                    Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">GST Number</label>
                                <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">Optional</span>
                            </div>
                            <input
                                className="tlb-input w-full uppercase"
                                placeholder="e.g. 22AAAAA0000A1Z5"
                                maxLength={15}
                                value={gst}
                                onChange={(e) => setGst(e.target.value.toUpperCase())}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Required only if your annual turnover exceeds ₹20 lakhs</p>
                        </div>
                    </div>

                    <button
                        onClick={handleContinue}
                        disabled={!pan}
                        className={`tlb-button w-full py-4 ${!pan ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-tlb-yellow/20'}`}
                    >
                        Continue to Bank Setup →
                    </button>

                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <Shield size={14} className="text-emerald-500" /> Details verified securely via KYC
                    </p>
                </section>
            </div>
        </main>
    </div>
    );
};
