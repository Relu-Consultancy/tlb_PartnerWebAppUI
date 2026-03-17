import React from 'react';
import {
    CheckCircle2,
    ArrowLeft,
    Shield
} from 'lucide-react';
import { Screen } from '../../types';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

export const IdentityVerification: React.FC<OnboardingProps> = ({ onNavigate }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white p-6 flex items-center justify-between border-b border-gray-100">
            <button onClick={() => onNavigate('HOME')} className="p-2 -ml-2 text-gray-400 hover:text-tlb-dark transition-colors"><ArrowLeft size={24} /></button>
            <h2 className="font-black text-lg">Identity Verification</h2>
            <div className="p-2 bg-tlb-yellow/10 rounded-xl"><Shield size={20} className="text-tlb-yellow" /></div>
        </header>

        <main className="p-6">
            <div className="tlb-content space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-2">
                        <CheckCircle2 size={12} /> Section A
                    </div>
                    <h1 className="text-4xl font-black leading-tight">Identity<br />Verification</h1>
                    <p className="text-gray-400 mt-3 font-medium text-sm leading-relaxed max-w-sm">
                        Please provide your business identity details. This helps us verify your account securely.
                    </p>
                </div>

                <section className="tlb-card space-y-6">
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">PAN Number (Mandatory)</label>
                            <input
                                className="tlb-input uppercase placeholder:normal-case font-medium tracking-wide"
                                placeholder="e.g. ABCDE1234F"
                                maxLength={10}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">GST Number (Optional)</label>
                            <input
                                className="tlb-input uppercase placeholder:normal-case font-medium tracking-wide"
                                placeholder="e.g. 22AAAAA0000A1Z5"
                                maxLength={15}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => onNavigate('BANK_SETUP')}
                            className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20 flex items-center justify-center gap-2"
                        >
                            Continue to Bank Setup <ArrowLeft size={18} className="rotate-180" />
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <Shield size={14} className="text-emerald-500" /> Details verified securely via KYC API
                    </p>
                </section>
            </div>
        </main>
    </div>
);
