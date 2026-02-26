import React from 'react';
import {
  Menu,
  TrendingUp,
  ReceiptIndianRupee,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Screen } from '../types';

interface FinancialHubProps {
  onNavigate: (screen: Screen) => void;
  onOpenSidebar: () => void;
}

export const FinancialHub: React.FC<FinancialHubProps> = ({ onNavigate, onOpenSidebar }) => (
  <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
      <h1 className="font-black text-lg">Financial Hub</h1>
      <div className="w-10 h-10 rounded-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow">
        <CheckCircle2 size={24} />
      </div>
    </header>

    <main className="p-6">
      <div className="tlb-content space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="tlb-card p-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-4">
              <TrendingUp size={12} /> Total Earned
            </div>
            <p className="text-3xl font-black">$12,450</p>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1">
              <ArrowUpRight size={10} /> +12.5%
            </p>
          </div>
          <div className="tlb-card p-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-4">
              <ReceiptIndianRupee size={12} /> Available
            </div>
            <p className="text-3xl font-black">$3,200</p>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1">
              <ArrowUpRight size={10} /> +5.2%
            </p>
          </div>
        </div>

        <button className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
          <ReceiptIndianRupee size={20} /> Withdraw Funds
        </button>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xl">Linked Accounts</h3>
            <button onClick={() => onNavigate('BANK_SETUP')} className="text-xs font-bold text-tlb-yellow uppercase tracking-widest">Add New</button>
          </div>
          <div className="bg-tlb-dark rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tlb-yellow/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start mb-12">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Building2 size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Primary Account</p>
                  <h4 className="font-bold text-lg">Chase Business</h4>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Card Number</p>
                <p className="text-3xl font-black mt-2 tracking-widest">**** 8821</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xl">Transactions</h3>
            <button className="p-2 text-gray-400"><Filter size={20} /></button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Payout from TLB', date: 'Oct 24, 2023', amount: '+$2,400.00', status: 'SETTLED', type: 'in' },
              { label: 'Withdrawal to Chase', date: 'Oct 23, 2023', amount: '-$1,200.00', status: 'PENDING', type: 'out' }
            ].map((tx, i) => (
              <div key={i} className="tlb-card p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'in' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                  {tx.type === 'in' ? <CheckCircle2 size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{tx.label}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black ${tx.type === 'in' ? 'text-emerald-500' : 'text-tlb-dark'}`}>{tx.amount}</p>
                  <p className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest mt-1 inline-block ${tx.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  </div>
);
