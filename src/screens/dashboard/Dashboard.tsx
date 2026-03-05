import React, { useState } from 'react';
import {
    Menu, Bell, ChevronRight, TrendingUp, ReceiptIndianRupee,
    UserCircle, CheckCircle2, BarChart3, Settings, LogOut,
    Clock, FileText, Landmark, ShieldCheck, Sparkles, CalendarPlus, Ticket, MapPin
} from 'lucide-react';
import { Screen } from '../../types';

interface DashboardProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

type OnboardingStep = {
    id: string;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    status: 'done' | 'active' | 'pending';
    action?: () => void;
};

// ---------------------------------------------------------------------------
// Pending State — shown during the 24–48h review window
// ---------------------------------------------------------------------------
const PendingDashboard: React.FC<{ onNavigate: (screen: Screen) => void }> = ({ onNavigate }) => {
    const steps: OnboardingStep[] = [
        {
            id: 'profile',
            label: 'Profile Submitted',
            subtitle: 'Completed today',
            icon: <CheckCircle2 size={18} />,
            status: 'done',
        },
        {
            id: 'review',
            label: 'Admin Review',
            subtitle: 'Estimated 24–48 hours',
            icon: <Clock size={18} />,
            status: 'active',
        },
        {
            id: 'docs',
            label: 'KYC & Agreement',
            subtitle: 'Upload documents & sign',
            icon: <FileText size={18} />,
            status: 'pending',
            action: () => onNavigate('AGREEMENT_SUBMIT'),
        },
        {
            id: 'bank',
            label: 'Bank Verification',
            subtitle: 'Add payout details',
            icon: <Landmark size={18} />,
            status: 'pending',
            action: () => onNavigate('BANK_SETUP'),
        },
    ];

    const completedCount = steps.filter(s => s.status === 'done').length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="space-y-8">
            {/* Welcome banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tlb-dark to-gray-900 p-6 text-white">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-tlb-yellow/10 rounded-full blur-2xl" />
                <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-tlb-yellow/5 rounded-full blur-xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={16} className="text-tlb-yellow" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-tlb-yellow">Application Under Review</span>
                    </div>
                    <h2 className="text-2xl font-black mt-3 leading-tight">Welcome aboard!</h2>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">
                        Your profile is being reviewed by our team. While you wait, get a head start on your first event.
                    </p>
                </div>
            </section>

            {/* Progress Tracker */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-lg">Onboarding Progress</h3>
                    <span className="text-xs font-black text-tlb-yellow">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-tlb-yellow rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="tlb-card p-0 overflow-hidden divide-y divide-gray-50">
                    {steps.map((step, i) => (
                        <button
                            key={step.id}
                            onClick={step.action}
                            disabled={!step.action}
                            className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${step.action ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                                }`}
                        >
                            {/* Step indicator */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step.status === 'done'
                                ? 'bg-tlb-yellow text-tlb-dark'
                                : step.status === 'active'
                                    ? 'bg-tlb-yellow/10 border-2 border-tlb-yellow text-tlb-yellow'
                                    : 'bg-gray-50 border-2 border-gray-200 text-gray-300'
                                }`}>
                                {step.icon}
                            </div>

                            {/* Label */}
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-sm ${step.status === 'pending' ? 'text-gray-400' : 'text-tlb-dark'}`}>
                                    {step.label}
                                </h4>
                                <p className={`text-[11px] mt-0.5 ${step.status === 'active'
                                    ? 'text-tlb-yellow font-bold'
                                    : 'text-gray-400 font-medium'
                                    }`}>
                                    {step.subtitle}
                                </p>
                            </div>

                            {/* Status badge / chevron */}
                            {step.status === 'done' && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">Done</span>
                            )}
                            {step.status === 'active' && (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tlb-yellow opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-tlb-yellow" />
                                </span>
                            )}
                            {step.action && step.status === 'pending' && (
                                <ChevronRight size={16} className="text-gray-300" />
                            )}
                        </button>
                    ))}
                </div>
            </section>

            {/* Build Your First Event — Draft CTA */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-tlb-yellow" />
                    <h3 className="font-black text-lg">Get a Head Start</h3>
                </div>

                <div
                    onClick={() => onNavigate('CREATE_EVENT_DETAILS')}
                    className="tlb-card p-0 overflow-hidden cursor-pointer group hover:border-tlb-yellow transition-all duration-300"
                >
                    <div className="relative h-40 overflow-hidden">
                        <img
                            src="https://picsum.photos/seed/stage-prep/800/400"
                            alt="Stage"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center gap-1.5 mb-1">
                                <CalendarPlus size={12} className="text-tlb-yellow" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-tlb-yellow">Draft Mode</span>
                            </div>
                            <h4 className="text-white font-black text-lg leading-tight">Build Your First Event</h4>
                        </div>
                    </div>

                    <div className="p-4 space-y-3">
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Set up your event details, ticket tiers, and venue info now — so you can launch instantly once approved.
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                <Ticket size={12} /> Ticket Controls
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                <MapPin size={12} /> Venue & Details
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-tlb-yellow">Start Building →</span>
                            <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow group-hover:bg-tlb-yellow group-hover:text-tlb-dark transition-colors">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Helpful tips while waiting */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Bell size={18} /></div>
                    <h3 className="font-black text-lg">While You Wait</h3>
                </div>
                <div className="space-y-3">
                    <div className="tlb-card p-4 flex gap-4 items-start">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-500 shrink-0"><FileText size={16} /></div>
                        <div>
                            <h4 className="font-bold text-sm">Prepare Your Documents</h4>
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                Keep your KYC documents and bank details ready for a smooth verification after approval.
                            </p>
                        </div>
                    </div>
                    <div className="tlb-card p-4 flex gap-4 items-start">
                        <div className="bg-purple-50 p-2 rounded-xl text-purple-500 shrink-0"><Sparkles size={16} /></div>
                        <div>
                            <h4 className="font-bold text-sm">Plan Your First Show</h4>
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                Think about your event theme, pricing tiers, and promotional strategy ahead of time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Operational State — fully approved partner dashboard
// ---------------------------------------------------------------------------
const OperationalDashboard: React.FC<{ onNavigate: (screen: Screen) => void }> = ({ onNavigate }) => (
    <div className="space-y-8">
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
                    <div className="bg-tlb-yellow/10 p-1.5 rounded text-tlb-yellow"><BarChart3 size={12} /></div>Profile Completion
                </div>
                <span className="text-sm font-black text-tlb-yellow">75%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-tlb-yellow w-3/4" /></div>
        </section>

        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><ReceiptIndianRupee size={20} /></div>
                <h3 className="font-black text-xl">Revenue Tracking</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="tlb-card p-4"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Tickets Sold</p><p className="text-3xl font-black">842</p></div>
                <div className="tlb-card p-4"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p><p className="text-3xl font-black">$14,250</p></div>
                <div className="tlb-card p-4"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TLB Commission</p><p className="text-xl font-black text-red-500">-$1,425</p></div>
                <div className="tlb-card p-4"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Earnings</p><p className="text-xl font-black text-emerald-500">$12,825</p></div>
            </div>
        </section>

        <section className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><TrendingUp size={20} /></div>
                    <h3 className="font-black text-xl">Analytics Overview</h3>
                </div>
                <button className="bg-white border border-gray-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">Last 30 Days <ChevronRight size={12} className="rotate-90" /></button>
            </div>
            <div className="tlb-card p-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Bookings Over Time</p>
                <div className="flex items-end justify-between h-32 gap-2">
                    {[40, 60, 50, 30, 70, 80, 65].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-tlb-yellow/20 rounded-t-lg" style={{ height: `${h}%` }} />
                            <span className="text-[8px] font-bold text-gray-300 uppercase">Wk {Math.floor(i / 2) + 1}</span>
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
    </div>
);

// ---------------------------------------------------------------------------
// Dashboard Shell — header + state toggle
// ---------------------------------------------------------------------------
export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenSidebar }) => {
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [isPending, setIsPending] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
                <h1 className="font-black text-lg">TLB Broadway</h1>
                <div className="flex items-center gap-4 relative">
                    <button
                        onClick={() => setShowProfilePopup(!showProfilePopup)}
                        className="w-10 h-10 rounded-full bg-tlb-yellow/10 flex items-center justify-center text-tlb-yellow hover:bg-tlb-yellow/20 transition-colors"
                    >
                        <UserCircle size={24} />
                    </button>

                    {showProfilePopup && (
                        <div className="absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-tlb-yellow/20">
                                    <img src="https://picsum.photos/seed/organizer/200/200" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-tlb-dark leading-tight">The Little Broadway</h4>
                                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">ID: #44921</p>
                                    {!isPending && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-tlb-yellow/10 text-tlb-yellow text-[8px] font-black uppercase tracking-widest rounded">Premium Partner</span>
                                    )}
                                    {isPending && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded">Under Review</span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2">
                                <button onClick={() => { setShowProfilePopup(false); onNavigate('EDIT_PROFILE'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                                    <Settings size={16} /> Edit Profile
                                </button>
                                <button onClick={() => { setShowProfilePopup(false); onNavigate('LANDING'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* DEV-only: state toggle — remove when wiring real onboarding status */}
            <div className="px-6 pt-4 flex justify-center">
                <div className="inline-flex bg-gray-100 rounded-xl p-1 text-xs font-bold">
                    <button
                        onClick={() => setIsPending(true)}
                        className={`px-4 py-2 rounded-lg transition-all ${isPending ? 'bg-white shadow-sm text-tlb-dark' : 'text-gray-400'}`}
                    >
                        Pending Review
                    </button>
                    <button
                        onClick={() => setIsPending(false)}
                        className={`px-4 py-2 rounded-lg transition-all ${!isPending ? 'bg-white shadow-sm text-tlb-dark' : 'text-gray-400'}`}
                    >
                        Operational
                    </button>
                </div>
            </div>

            <main className="p-6">
                <div className="tlb-content">
                    {isPending
                        ? <PendingDashboard onNavigate={onNavigate} />
                        : <OperationalDashboard onNavigate={onNavigate} />
                    }
                </div>
            </main>
        </div>
    );
};
