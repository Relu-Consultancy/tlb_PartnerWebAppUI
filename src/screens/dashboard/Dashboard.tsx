import React from 'react';
import {
  Menu, Bell, ChevronRight, UserCircle, CheckCircle2,
  Inbox, Eye, BarChart3, CreditCard, Plus
} from 'lucide-react';
import { Screen } from '../../types';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
  onOpenSidebar: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenSidebar }) => {
  const metrics = [
    { label: 'New Enquiries', value: '14', icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Profile Views', value: '1,240', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Active Batches', value: '8', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Credit Balance', value: '22', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
        <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
        <h1 className="font-black text-lg">TLB Partner</h1>
        <div className="flex items-center gap-3">
          <button className="relative p-2">
            <Bell size={22} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <button
            onClick={() => onNavigate('BRAND_PROFILE')}
            className="w-10 h-10 rounded-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow hover:bg-tlb-yellow/20 transition-colors"
          >
            <UserCircle size={24} />
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="tlb-content space-y-8">
          {/* Welcome Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tlb-dark to-gray-900 p-6 sm:p-8 text-white">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-tlb-yellow/10 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-tlb-yellow/5 rounded-full blur-xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black leading-tight">Welcome back! 👋</h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-lg">
                Your profile is <span className="text-tlb-yellow font-black">85% complete</span>.
                <button onClick={() => onNavigate('BRAND_PROFILE')} className="text-tlb-yellow underline ml-1 font-bold">Add a Studio Video</button> to reach 100%.
              </p>

              {/* Profile Completion Bar */}
              <div className="mt-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Profile Completion</span>
                  <span className="text-sm font-black text-tlb-yellow">85%</span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-tlb-yellow rounded-full w-[85%] transition-all duration-700" />
                </div>
              </div>
            </div>
          </section>

          {/* Metric Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="tlb-card p-5 flex flex-col gap-3">
                <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center ${m.color}`}>
                  <m.icon size={20} />
                </div>
                <div>
                  <p className="text-3xl font-black">{m.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.label}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Add New Class CTA */}
          <section>
            <button
              onClick={() => onNavigate('CREATE_LISTING_IDENTITY')}
              className="tlb-button w-full py-5 shadow-lg shadow-tlb-yellow/20 text-base gap-3"
            >
              <Plus size={22} /> Add New Class
            </button>
          </section>

          {/* Action Needed Alerts */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Bell size={18} /></div>
              <h3 className="font-black text-lg">Action Needed</h3>
            </div>
            <div className="space-y-3">
              <div className="tlb-card p-4 flex gap-4 items-start bg-blue-50/50 border-blue-100">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600 shrink-0"><Inbox size={16} /></div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">3 New Enquiries</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    You have new leads waiting. Respond quickly to convert them.
                  </p>
                </div>
                <button onClick={() => onNavigate('ENQUIRIES')} className="text-blue-600 shrink-0">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="tlb-card p-4 flex gap-4 items-start bg-amber-50/50 border-amber-100">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0"><CreditCard size={16} /></div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">Credits Running Low</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Only 4 credits remaining. Recharge now to keep unlocking leads.
                  </p>
                </div>
                <button onClick={() => onNavigate('PACKAGES')} className="text-amber-600 shrink-0">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Brand Profile', screen: 'BRAND_PROFILE' as Screen, icon: UserCircle },
              { label: 'My Services', screen: 'SERVICE_LISTINGS' as Screen, icon: BarChart3 },
              { label: 'Enquiries', screen: 'ENQUIRIES' as Screen, icon: Inbox },
              { label: 'Packages', screen: 'PACKAGES' as Screen, icon: CreditCard },
            ].map((link) => (
              <button
                key={link.label}
                onClick={() => onNavigate(link.screen)}
                className="tlb-card p-4 flex flex-col items-center gap-2 hover:border-tlb-yellow transition-colors cursor-pointer"
              >
                <div className="bg-tlb-yellow/10 p-3 rounded-xl text-tlb-yellow"><link.icon size={22} /></div>
                <span className="text-xs font-bold text-gray-600">{link.label}</span>
              </button>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};
