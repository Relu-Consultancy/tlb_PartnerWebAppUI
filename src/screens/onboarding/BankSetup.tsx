import React, { useState } from 'react';
import {
    CheckCircle2,
    Upload,
    ArrowLeft,
    LayoutGrid,
    Image as ImageIcon
} from 'lucide-react';
import { Screen } from '../../types';
import { submitVerification } from '../../api/onboarding';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const X = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export const BankSetup: React.FC<OnboardingProps> = ({ onNavigate }) => {
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!accountName || !accountNumber || !ifsc) {
            alert('Please fill all bank details.');
            return;
        }

        const payload = {
            pan_number: sessionStorage.getItem('pan_number') || '',
            gst_number: sessionStorage.getItem('gst_number') || '',
            account_holder_name: accountName,
            account_number: accountNumber,
            ifsc_code: ifsc,
            agreement_accepted: true
        };

        setLoading(true);
        try {
            await submitVerification(payload);
            onNavigate('HOME');
        } catch (error) {
            console.error('Verification failed', error);
            alert('Failed to submit verification details.');
        } finally {
            setLoading(false);
        }
    };

    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white p-6 flex items-center justify-between border-b border-gray-100">
            <button onClick={() => onNavigate('IDENTITY_VERIFICATION')}><ArrowLeft size={24} /></button>
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
                            <input 
                                className="tlb-input" 
                                placeholder="Julian Alexander Reed" 
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Bank Account Number</label>
                            <input 
                                className="tlb-input" 
                                type="password" 
                                placeholder="............" 
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">IFSC Code</label>
                            <div className="relative">
                                <input 
                                    className="tlb-input border-tlb-yellow pr-12 uppercase" 
                                    placeholder="TLBNK0001234" 
                                    value={ifsc}
                                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                                />
                                {ifsc.length > 4 && <CheckCircle2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}
                            </div>
                            {ifsc.length > 4 && <p className="text-[10px] text-emerald-500 font-bold mt-2">Format Verified</p>}
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

                    <button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        className={`tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Submitting...' : 'Link Payout Account'}
                    </button>

                    <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <LayoutGrid size={12} /> AES-256 Bit Encrypted Storage
                    </p>
                </section>

            </div>
        </main>
    </div>
    );
};
