import React from 'react';
import { ArrowLeft, CheckCircle2, LayoutGrid, Upload } from 'lucide-react';
import { Screen } from '../../types';

interface FinancialHubProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const BankSetupHub: React.FC<FinancialHubProps> = ({ onNavigate }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white p-6 flex items-center justify-between border-b border-gray-100">
            <button onClick={() => onNavigate('FINANCIAL_HUB')}><ArrowLeft size={24} /></button>
            <h2 className="font-black text-lg">Financial Hub</h2>
            <div className="p-2 bg-gray-100 rounded-lg"><LayoutGrid size={20} className="text-gray-400" /></div>
        </header>
        <main className="p-6">
            <div className="tlb-content space-y-8">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-2"><CheckCircle2 size={12} /> Secure Channel</div>
                    <h1 className="text-4xl font-black">Add Bank Account</h1>
                    <p className="text-gray-400 mt-2 font-medium">Funds are settled within 24 hours of performance.</p>
                </div>
                <section className="tlb-card space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Account Holder Name</label>
                            <input className="tlb-input" placeholder="e.g. Julian Alexander Reed" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Bank Account Number</label>
                            <input className="tlb-input" type="password" placeholder="Account Number" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">IFSC Code</label>
                            <div className="relative"><input className="tlb-input pr-12" placeholder="e.g. TLBNK0001234" /></div>
                        </div>
                    </div>
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                        <div className="bg-gray-200 p-3 rounded-xl text-gray-400"><Upload size={24} /></div>
                        <div className="text-center">
                            <p className="font-bold">Verification Document</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Upload a cancelled cheque or bank statement (PDF/JPG)</p>
                        </div>
                        <button className="px-8 py-2 border border-tlb-yellow text-tlb-yellow rounded-xl font-bold text-sm bg-white">Select File</button>
                    </div>
                    <button onClick={() => onNavigate('FINANCIAL_HUB')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">Save Bank Account</button>
                    <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2"><LayoutGrid size={12} /> AES-256 Bit Encrypted Storage</p>
                </section>
            </div>
        </main>
    </div>
);
