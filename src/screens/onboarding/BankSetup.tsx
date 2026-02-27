import React from 'react';
import {
    CheckCircle2,
    Upload,
    Building2,
    ArrowLeft,
    LayoutGrid,
    Image as ImageIcon
} from 'lucide-react';
import { Screen } from '../../types';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const X = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export const BankSetup: React.FC<OnboardingProps> = ({ onNavigate }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white p-6 flex items-center justify-between border-b border-gray-100">
            <button onClick={() => onNavigate('AGREEMENT_SUBMIT')}><ArrowLeft size={24} /></button>
            <h2 className="font-black text-lg">Payout Settings</h2>
            <div className="p-2 bg-gray-100 rounded-lg"><LayoutGrid size={20} className="text-gray-400" /></div>
        </header>

        <main className="p-6">
            <div className="tlb-content space-y-8">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-2">
                        <CheckCircle2 size={12} /> Secure Channel
                    </div>
                    <h1 className="text-4xl font-black">Add Bank Account</h1>
                    <p className="text-gray-400 mt-2 font-medium">Funds are settled within 24 hours of performance.</p>
                </div>

                <section className="tlb-card space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Account Holder Name</label>
                            <input className="tlb-input" defaultValue="Julian Alexander Reed" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Bank Account Number</label>
                            <input className="tlb-input" type="password" defaultValue="............" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">IFSC Code</label>
                            <div className="relative">
                                <input className="tlb-input border-tlb-yellow pr-12" defaultValue="TLBNK0001234" />
                                <CheckCircle2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                            </div>
                            <p className="text-[10px] text-emerald-500 font-bold mt-2">Verified: Broadway Central Bank, New York Branch</p>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                        <div className="bg-gray-200 p-3 rounded-xl text-gray-400"><Upload size={24} /></div>
                        <div className="text-center">
                            <p className="font-bold">Verification Document</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Upload a cancelled cheque or bank statement (PDF/JPG)</p>
                        </div>
                        <button className="px-8 py-2 border border-tlb-yellow text-tlb-yellow rounded-xl font-bold text-sm">Select File</button>

                        <div className="w-full bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-3">
                            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><ImageIcon size={18} /></div>
                            <div className="flex-1">
                                <p className="text-xs font-bold">bank_statement_2024.pdf</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">1.2 MB • Ready</p>
                            </div>
                            <button className="text-gray-300"><X size={16} /></button>
                        </div>
                    </div>

                    <button onClick={() => onNavigate('ONBOARDING_COMPLETE')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
                        Link Payout Account
                    </button>

                    <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <LayoutGrid size={12} /> AES-256 Bit Encrypted Storage
                    </p>
                </section>

                <section className="space-y-4">
                    <h3 className="font-black text-xl">Saved Accounts</h3>
                    <div className="tlb-card p-4 border-t-4 border-t-tlb-yellow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-tlb-yellow/10 rounded-xl flex items-center justify-center text-tlb-yellow">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold">Chase Manhattan</h4>
                                    <p className="text-xs text-gray-400 font-bold tracking-widest">•••• •••• 8821</p>
                                </div>
                            </div>
                            <span className="bg-tlb-yellow text-tlb-dark text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Default</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={12} /> Verified
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</span>
                                <div className="w-10 h-5 bg-tlb-yellow rounded-full relative">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>
);
