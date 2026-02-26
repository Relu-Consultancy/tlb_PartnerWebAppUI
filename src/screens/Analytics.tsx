import React from 'react';
import { 
  ArrowLeft,
  Bell,
  ArrowUpRight,
  Calendar,
  ReceiptIndianRupee
} from 'lucide-react';
import { Screen } from '../types';

interface AnalyticsProps {
  onNavigate: (screen: Screen) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={() => onNavigate('DASHBOARD')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
      <h1 className="font-black text-lg">Analytics</h1>
      <button className="p-2 relative">
        <Bell size={24} />
      </button>
    </header>

    <main className="p-6 space-y-8">
      <section className="space-y-6">
        <h2 className="text-3xl font-black">Revenue</h2>
        <div className="tlb-card p-8 bg-white relative overflow-hidden">
          <div className="absolute top-8 right-8 bg-emerald-50 text-emerald-500 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1">
            <ArrowUpRight size={14} /> 12%
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Revenue</p>
          <p className="text-5xl font-black">$12,450</p>
          
          <div className="grid grid-cols-2 gap-4 mt-10 pt-10 border-t border-gray-50">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Commissions</p>
              <p className="text-xl font-black">$1,867</p>
            </div>
            <div className="bg-tlb-yellow/5 p-4 rounded-2xl border border-tlb-yellow/10">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Earnings</p>
              <p className="text-xl font-black">$10,582</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-black">Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="tlb-card p-6">
            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow w-fit mb-4"><Calendar size={20} /></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Events</p>
            <p className="text-3xl font-black">42</p>
          </div>
          <div className="tlb-card p-6">
            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow w-fit mb-4"><ReceiptIndianRupee size={20} /></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tickets</p>
            <p className="text-3xl font-black">1,284</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Performance by Category</h3>
        <div className="h-64 flex items-end justify-between gap-4 px-4">
          {[
            { label: 'Musical', val: 80 },
            { label: 'Drama', val: 60 },
            { label: 'Comedy', val: 40 },
            { label: 'Opera', val: 30 },
            { label: 'Ballet', val: 20 }
          ].map((cat) => (
            <div key={cat.label} className="flex-1 flex flex-col items-center gap-4">
              <div className="w-full bg-tlb-yellow/20 rounded-t-xl relative group" style={{ height: `${cat.val}%` }}></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest rotate-45 origin-left whitespace-nowrap">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  </div>
);
