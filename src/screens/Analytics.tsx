import React, { useState } from 'react';
import {
  Menu,
  Bell,
  ArrowUpRight,
  ArrowLeft,
  Calendar,
  Ticket,
  ChevronDown
} from 'lucide-react';
import { Screen } from '../types';

interface AnalyticsProps {
  onNavigate: (screen: Screen) => void;
  onOpenSidebar: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate, onOpenSidebar }) => (
  <div className="min-h-screen bg-[#FDFCF8] pb-12">
    <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate('DASHBOARD')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
        <h1 className="font-black text-lg">Performance & Payouts</h1>
      </div>
      <button className="p-2 relative">
        <Bell size={24} />
        <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
      </button>
    </header>

    <main className="px-4 sm:px-6 py-6">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Revenue Summary */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black">Revenue Summary</h2>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Revenue</span>
              <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1">
                <ArrowUpRight size={14} /> 12%
              </div>
            </div>
            <p className="text-4xl font-black text-tlb-dark">$12,450.00</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FAF8ED] rounded-2xl p-5 border border-amber-100/50">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Commissions</span>
              <p className="text-xl font-black text-tlb-dark mb-2">$1,867.50</p>
              <p className="text-[10px] font-bold text-emerald-500">+5% vs last month</p>
            </div>
            <div className="bg-[#FAF8ED] rounded-2xl p-5 border border-amber-100/50">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Net Earnings</span>
              <p className="text-xl font-black text-tlb-dark mb-2">$10,582.50</p>
              <p className="text-[10px] font-bold text-emerald-500">+15% vs last month</p>
            </div>
          </div>
        </section>

        {/* High-Level Analytics */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black">High-Level Analytics</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-100">
              <div className="text-tlb-yellow mb-2"><Calendar size={20} /></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Events Created</span>
              <p className="text-2xl font-black text-tlb-dark">42</p>
            </div>
            <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-100">
              <div className="text-tlb-yellow mb-2"><Ticket size={20} /></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Tickets</span>
              <p className="text-2xl font-black text-tlb-dark">1,284</p>
            </div>
          </div>
        </section>

        {/* Performance By Category */}
        <section className="space-y-6">
          <h3 className="text-sm font-bold text-tlb-dark uppercase tracking-widest">Performance By Category</h3>
          <div className="h-48 flex items-end justify-between gap-2 px-2 border-b border-gray-100 pb-2 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between -z-10 opacity-30">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="border-t border-gray-200 w-full h-0"></div>)}
            </div>

            {[
              { label: 'Musical', val: 90 },
              { label: 'Drama', val: 65 },
              { label: 'Comedy', val: 45 },
              { label: 'Opera', val: 25 },
              { label: 'Ballet', val: 15 }
            ].map((cat) => (
              <div key={cat.label} className="w-8 flex flex-col items-center gap-3">
                <div className="w-6 bg-gray-200 rounded-t-sm relative transition-all duration-500" style={{ height: `${cat.val}%` }}></div>
                <span className="text-[10px] font-bold text-tlb-dark uppercase tracking-widest rotate-[45deg] origin-top-left -ml-2 whitespace-nowrap mt-2">{cat.label}</span>
              </div>
            ))}
          </div>
          <div className="h-8"></div> {/* Spacer for rotated text */}
        </section>

        {/* Recent Settlements */}
        <section className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-black">Recent Settlements</h2>
            <button className="text-xs font-bold text-tlb-yellow uppercase tracking-widest">View All</button>
          </div>

          <div className="bg-[#FDFCF8] rounded-2xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-3 p-4 bg-[#F8F9FA] border-b border-gray-100 text-xs font-bold text-gray-500">
              <div>Date</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Status</div>
            </div>

            <div className="divide-y divide-gray-50">
              {[
                { date: 'Oct 24, 2023', amt: '$1,240.00', status: 'PAID', color: 'bg-emerald-100 text-emerald-600' },
                { date: 'Oct 18, 2023', amt: '$850.20', status: 'PENDING', color: 'bg-amber-100 text-amber-600' },
                { date: 'Oct 12, 2023', amt: '$2,100.50', status: 'PAID', color: 'bg-emerald-100 text-emerald-600' }
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 p-4 items-center bg-white text-sm">
                  <div className="text-gray-500">{row.date}</div>
                  <div className="text-right font-black text-tlb-dark">{row.amt}</div>
                  <div className="flex justify-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${row.color}`}>{row.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
);
