import React, { useState } from 'react';
import { CreditCard, Check, AlertTriangle, Zap, Crown, Shield } from 'lucide-react';
import { Screen, PackagePlan, BillingRecord } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

const plans: PackagePlan[] = [
    { id: '1', name: 'Starter', credits: 15, price: 499, features: ['15 Lead Unlocks', 'Basic Analytics', 'Email Support'], isCurrent: false },
    { id: '2', name: 'Growth', credits: 50, price: 1299, features: ['50 Lead Unlocks', 'Priority Listing', 'WhatsApp Support', 'Profile Badge'], isCurrent: true },
    { id: '3', name: 'Pro', credits: 150, price: 2999, features: ['150 Lead Unlocks', 'Featured Listing', 'Dedicated Manager', 'Profile Badge', 'Analytics Dashboard'], isCurrent: false },
];

const billing: BillingRecord[] = [
    { id: '1', date: '01 Mar 2026', plan: 'Growth — 50 Credits', amount: 1299, status: 'Paid' },
    { id: '2', date: '01 Feb 2026', plan: 'Starter — 15 Credits', amount: 499, status: 'Paid' },
    { id: '3', date: '01 Jan 2026', plan: 'Starter — 15 Credits', amount: 499, status: 'Paid' },
];

export const Packages: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [tab, setTab] = useState<'plans' | 'billing'>('plans');

    const getIcon = (name: string) => {
        if (name === 'Starter') return Zap;
        if (name === 'Growth') return Crown;
        return Shield;
    };

    return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            
            <h1 className="tlb-page-title">Packages</h1>
            <div className="w-10" />
        </header>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                {/* Current Credits */}
                <div className="bg-gradient-to-br from-tlb-dark to-gray-900 rounded-3xl p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-tlb-yellow/10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Balance</p>
                        <p className="text-5xl font-black text-tlb-yellow mt-1">22</p>
                        <p className="text-sm text-gray-300 mt-1">Credits Remaining</p>
                        <div className="flex items-center gap-2 mt-3">
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Growth Plan</span>
                            <span className="text-[10px] text-gray-500">Renews 01 Apr 2026</span>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-white rounded-2xl p-1.5 border border-gray-100">
                    <button onClick={() => setTab('plans')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'plans' ? 'bg-tlb-yellow text-tlb-dark shadow-sm' : 'text-gray-400'}`}>
                        Credit Plans
                    </button>
                    <button onClick={() => setTab('billing')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'billing' ? 'bg-tlb-yellow text-tlb-dark shadow-sm' : 'text-gray-400'}`}>
                        Billing History
                    </button>
                </div>

                {tab === 'plans' && (
                    <div className="space-y-4">
                        {plans.map((plan) => {
                            const Icon = getIcon(plan.name);
                            return (
                                <div key={plan.id} className={`bg-white rounded-2xl border-2 p-5 transition-all ${plan.isCurrent ? 'border-tlb-yellow shadow-lg shadow-tlb-yellow/10' : 'border-gray-100'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${plan.isCurrent ? 'bg-tlb-yellow text-tlb-dark' : 'bg-gray-100 text-gray-400'}`}>
                                                <Icon size={22} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg">{plan.name}</h3>
                                                <p className="text-xs text-gray-400">{plan.credits} Credits</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black">₹{plan.price}</span>
                                            <p className="text-[10px] text-gray-400">/month</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {plan.features.map((f, i) => (
                                            <p key={i} className="text-xs text-gray-500 flex items-center gap-2">
                                                <Check size={14} className={plan.isCurrent ? 'text-tlb-yellow' : 'text-gray-300'} />
                                                {f}
                                            </p>
                                        ))}
                                    </div>

                                    <button className={`w-full mt-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                                        plan.isCurrent
                                            ? 'bg-gray-100 text-gray-400 cursor-default'
                                            : 'bg-tlb-yellow text-tlb-dark hover:bg-yellow-400 shadow-sm'
                                    }`}>
                                        {plan.isCurrent ? 'Current Plan' : 'Upgrade Now'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === 'billing' && (
                    <div className="space-y-3">
                        {billing.map((record) => (
                            <div key={record.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-500">
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{record.plan}</p>
                                        <p className="text-[11px] text-gray-400">{record.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black">₹{record.amount}</p>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                        record.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                                        record.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                        'bg-red-50 text-red-600'
                                    }`}>{record.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Subscription expired banner */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-700">Subscription Expired?</p>
                        <p className="text-[11px] text-red-500 leading-relaxed mt-0.5">
                            If your subscription expires, all services are automatically <strong>hidden</strong>. Renew your plan to make classes live again.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    </div>
    );
};
