import React from 'react';
import { 
  Menu, 
  Bell, 
  ChevronRight, 
  Mail, 
  Phone, 
  TrendingUp, 
  ReceiptIndianRupee, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Calendar,
  UserCircle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { Screen } from '../types';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  onOpenSidebar: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenSidebar }) => (
  <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
      <h1 className="font-black text-lg">TLB Broadway</h1>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow">
          <UserCircle size={24} />
        </div>
      </div>
    </header>

    <main className="p-6 space-y-8">
      <section className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl">
          <img src="https://picsum.photos/seed/organizer/200/200" alt="Organizer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black">The Little Broadway</h2>
            <CheckCircle2 size={18} className="text-tlb-yellow fill-tlb-yellow" />
          </div>
          <p className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest">Premium Partner</p>
          <p className="text-xs text-gray-400 font-bold mt-1">Organiser ID: #44921</p>
        </div>
      </section>

      <section className="tlb-card p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <div className="bg-tlb-yellow/10 p-1.5 rounded text-tlb-yellow"><BarChart3 size={12} /></div>
            Profile Completion
          </div>
          <span className="text-sm font-black text-tlb-yellow">75%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-tlb-yellow w-3/4"></div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><ReceiptIndianRupee size={20} /></div>
          <h3 className="font-black text-xl">Revenue Tracking</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="tlb-card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Tickets Sold</p>
            <p className="text-3xl font-black">842</p>
          </div>
          <div className="tlb-card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-3xl font-black">$14,250</p>
          </div>
          <div className="tlb-card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TLB Commission</p>
            <p className="text-xl font-black text-red-500">-$1,425</p>
          </div>
          <div className="tlb-card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Earnings</p>
            <p className="text-xl font-black text-emerald-500">$12,825</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><TrendingUp size={20} /></div>
            <h3 className="font-black text-xl">Analytics Overview</h3>
          </div>
          <button className="bg-white border border-gray-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            Last 30 Days <ChevronRight size={12} className="rotate-90" />
          </button>
        </div>
        <div className="tlb-card p-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Bookings Over Time</p>
          <div className="flex items-end justify-between h-32 gap-2">
            {[40, 60, 50, 30, 70, 80, 65].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-tlb-yellow/20 rounded-t-lg" style={{ height: `${h}%` }}></div>
                <span className="text-[8px] font-bold text-gray-300 uppercase">Wk {Math.floor(i/2)+1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-xl">Active Listings</h3>
          <span onClick={() => onNavigate('EVENT_LISTINGS')} className="text-xs font-bold text-tlb-yellow uppercase tracking-widest cursor-pointer">View All</span>
        </div>
        <div onClick={() => onNavigate('EVENT_DETAILS')} className="tlb-card p-4 flex gap-4 items-center cursor-pointer hover:border-tlb-yellow transition-colors">
          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md">
            <img src="https://picsum.photos/seed/hamilton/200/200" alt="Hamilton" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold">Hamilton Workshop</h4>
            <p className="text-xs text-gray-400 font-medium mt-1">Tomorrow, 10:00 AM</p>
          </div>
          <span className="bg-tlb-yellow/10 text-tlb-yellow text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Sold Out</span>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Bell size={20} /></div>
          <h3 className="font-black text-xl">Notifications</h3>
        </div>
        <div className="space-y-3">
          <div className="tlb-card p-4 flex gap-4 bg-tlb-yellow/5 border-tlb-yellow/10">
            <div className="bg-tlb-yellow p-2 rounded-lg text-tlb-dark h-fit"><ReceiptIndianRupee size={18} /></div>
            <div>
              <h4 className="font-bold text-sm">New Booking Alert</h4>
              <p className="text-xs text-gray-500 mt-1">John Doe booked 2 tickets for Hamilton Workshop</p>
              <p className="text-[10px] text-tlb-yellow font-bold uppercase tracking-widest mt-2">2 minutes ago</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
);
