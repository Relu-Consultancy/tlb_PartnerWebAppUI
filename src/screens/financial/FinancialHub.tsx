import React, { useState } from 'react';
import {
    Menu, TrendingUp, ReceiptIndianRupee, ArrowUpRight, Building2, Filter,
    CheckCircle2, Download, ShieldAlert
} from 'lucide-react';
import { Screen } from '../../types';

interface FinancialHubProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const FinancialHub: React.FC<FinancialHubProps> = ({ onNavigate, onOpenSidebar }) => {
    const [isBankVerified] = useState(true);

    const transactions = [
        { id: '1', label: 'Payout from TLB', date: 'Oct 24, 2023', amount: '+$2,400.00', status: 'SETTLED', type: 'in' as const },
        { id: '2', label: 'Withdrawal to Chase', date: 'Oct 23, 2023', amount: '-$1,200.00', status: 'PENDING', type: 'out' as const },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
                <h1 className="font-black text-lg">Financial Hub</h1>
                <div className="w-10 h-10 rounded-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow"><CheckCircle2 size={24} /></div>
            </header>
            <main className="p-6">
                <div className="tlb-content space-y-8">

                    {/* Settlement Status */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Settlement Status</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="tlb-card p-5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-3"><TrendingUp size={12} /> Total Earned</div>
                                <p className="text-2xl font-black">$12,450</p>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1"><ArrowUpRight size={10} /> +12.5%</p>
                            </div>
                            <div className="tlb-card p-5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3"><ReceiptIndianRupee size={12} /> Commission Deducted</div>
                                <p className="text-2xl font-black text-red-500">-$1,249</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">10% TLB fee</p>
                            </div>
                            <div className="tlb-card p-5 border-tlb-yellow/30">
                                <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-3"><ReceiptIndianRupee size={12} /> Final Payout Pending</div>
                                <p className="text-2xl font-black">$3,200</p>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1"><ArrowUpRight size={10} /> +5.2%</p>
                            </div>
                        </div>
                    </section>

                    <button className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20"><ReceiptIndianRupee size={20} /> Withdraw Funds</button>

                    {/* Bank Details Card */}
                    <section className="space-y-4">
                        <h3 className="font-black text-xl">Bank Details</h3>
                        {isBankVerified ? (
                            <div className="bg-tlb-dark rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-tlb-yellow/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Building2 size={24} className="text-white" /></div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 size={14} className="text-emerald-400" />
                                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Verified Account</span>
                                            </div>
                                            <h4 className="font-bold text-lg">Chase Business</h4>
                                            <p className="text-2xl font-black mt-2 tracking-widest text-white/90">**** 8821</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => onNavigate('BANK_SETUP_HUB')} className="relative mt-6 text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-widest">Add another account</button>
                            </div>
                        ) : (
                            <div className="tlb-card p-8 border-2 border-dashed border-amber-200 bg-amber-50/30">
                                <div className="flex flex-col items-center justify-center text-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><ShieldAlert size={28} /></div>
                                    <div>
                                        <h4 className="font-black text-lg text-tlb-dark">Bank Account Not Verified</h4>
                                        <p className="text-sm text-gray-500 mt-1">Add your bank details and upload a cancelled cheque to receive payouts.</p>
                                    </div>
                                    <button
                                        onClick={() => onNavigate('BANK_SETUP_HUB')}
                                        className="tlb-button px-8 py-3 shadow-lg shadow-tlb-yellow/20"
                                    >
                                        Complete KYC to Receive Payouts
                                    </button>
                                    <p className="text-[10px] text-gray-400 font-bold">Upload a cancelled cheque or bank statement</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Transaction History */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-xl">Transaction History</h3>
                            <button className="p-2 text-gray-400 hover:text-gray-600"><Filter size={20} /></button>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Every payout made to your bank</p>
                        <div className="space-y-4">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="tlb-card p-4 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'in' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                                        {tx.type === 'in' ? <CheckCircle2 size={24} /> : <ArrowUpRight size={24} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm">{tx.label}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{tx.date}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`font-black ${tx.type === 'in' ? 'text-emerald-500' : 'text-tlb-dark'}`}>{tx.amount}</p>
                                        <p className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest mt-1 inline-block ${tx.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>{tx.status}</p>
                                    </div>
                                    <button
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors shrink-0"
                                        title="Download Invoice"
                                    >
                                        <Download size={14} />
                                        <span className="hidden sm:inline">Invoice</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};
