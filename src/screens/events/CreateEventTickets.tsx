import React from 'react';
import {
    ArrowLeft,
    Plus,
    CheckCircle2,
    Ticket,
    MoreHorizontal
} from 'lucide-react';
import { Screen } from '../../types';

interface EventProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const CreateEventTickets: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
    <div className="min-h-screen bg-[#FDFCF8] pb-24">
        {/* Header & Stepper */}
        <header className="bg-white p-4 sm:p-6 sticky top-0 z-30 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="p-2 -ml-2 rounded-full hover:bg-gray-50"><ArrowLeft size={24} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="font-black text-lg">CREATE EVENT</h1>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">DRAFT AUTOSAVED 12:45</span>
                    </div>
                </div>
                <button className="p-2 -mr-2 text-tlb-dark"><MoreHorizontal size={24} /></button>
            </div>

            {/* Stepper */}
            <div className="flex justify-between items-center relative max-w-xs mx-auto px-4">
                <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-gray-100 -z-10"></div>
                <div className="absolute left-[10%] right-[50%] top-4 h-0.5 bg-tlb-yellow -z-10"></div>

                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm"><CheckCircle2 size={16} /></div>
                    <span className="text-[10px] font-bold text-tlb-dark">Basics</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm">2</div>
                    <span className="text-[10px] font-bold text-tlb-yellow">Tickets</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-sm font-black text-gray-300">3</div>
                    <span className="text-[10px] font-bold text-gray-300">Publish</span>
                </div>
            </div>
        </header>

        <main className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

            {/* Ticket Basics */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><Ticket size={20} /></div>
                    <h2 className="font-black text-lg">Ticket Basics</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">TICKET NAME</label>
                        <input className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm" defaultValue="Premium Broadway Experience" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">DESCRIPTION</label>
                        <textarea className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm min-h-[80px] resize-y" defaultValue="Includes backstage tour and welcome drink."></textarea>
                    </div>
                </div>
            </div>

            {/* Ticket Quantity */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><span className="text-xl font-black">📦</span></div>
                    <h2 className="font-black text-lg">Ticket Quantity</h2>
                </div>

                <div className="space-y-6">
                    <div className="flex bg-[#F8F9FA] rounded-xl p-1 border border-gray-100">
                        <button className="flex-1 py-3 text-xs font-bold text-gray-500 rounded-lg">Unlimited</button>
                        <button className="flex-1 py-3 text-xs font-black bg-white shadow-sm rounded-lg text-tlb-dark">Limited</button>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">TOTAL CAPACITY</label>
                        <div className="relative">
                            <input className="tlb-input bg-[#F8F9FA] border-gray-100 font-bold" defaultValue="150" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Tickets</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Type */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><span className="text-xl font-black">💵</span></div>
                    <h2 className="font-black text-lg">Pricing Type</h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <button className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-2xl bg-[#F8F9FA] gap-2">
                        <span className="text-xl">🎁</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-tlb-dark">FREE</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-2xl bg-[#F8F9FA] gap-2">
                        <span className="text-xl text-gray-400 font-serif">$</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-tlb-dark">FIXED</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 border-2 border-tlb-yellow rounded-2xl bg-white shadow-sm gap-2">
                        <span className="text-xl text-tlb-yellow pt-1">📚</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-tlb-yellow">MULTIPLE</span>
                    </button>
                </div>

                <div className="bg-[#F8F9FA] rounded-2xl border border-gray-100 p-4">
                    <div className="grid grid-cols-2 mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TIER</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-6">PRICE</span>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                            <span className="text-sm font-bold text-tlb-dark">Early Bird</span>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-black text-emerald-500">$45.00</span>
                                <span className="text-gray-300 font-bold">=</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-tlb-yellow/30 shadow-sm">
                            <span className="text-sm font-bold text-tlb-dark">Regular</span>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-black text-tlb-dark">$65.00</span>
                                <span className="text-gray-300 font-bold">=</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                            <span className="text-sm font-bold text-tlb-dark">VIP / Gala</span>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-black text-tlb-yellow">$120.00</span>
                                <span className="text-gray-300 font-bold">=</span>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-3 border-2 border-dashed border-tlb-yellow/30 rounded-xl text-tlb-yellow font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-colors">
                        <Plus size={16} /> Add Pricing Tier
                    </button>
                </div>
            </div>

            {/* Discount Setup */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><span className="text-xl font-black">🏷️</span></div>
                    <h2 className="font-black text-lg">Discount Setup</h2>
                </div>

                <div className="space-y-4">
                    <div className="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">COUPON CODE</span>
                            <div className="w-10 h-5 bg-tlb-yellow rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm flex items-center justify-center">
                                    <CheckCircle2 size={10} className="text-tlb-yellow" />
                                </div>
                            </div>
                        </div>
                        <input className="tlb-input bg-white font-black text-tlb-yellow tracking-widest text-sm" defaultValue="BROADWAY20" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">DISCOUNT</label>
                                <div className="relative">
                                    <input className="tlb-input bg-white text-sm" defaultValue="20" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">MAX USES</label>
                                <input className="tlb-input bg-white text-sm" defaultValue="50" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">DIRECT DISCOUNT</span>
                            <span className="text-[8px] text-gray-400 italic">Apply discount automatically to all tickets.</span>
                        </div>
                        <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                        </div>
                    </div>
                </div>
            </div>

        </main>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
            <div className="max-w-3xl mx-auto flex gap-4">
                <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="bg-white border border-gray-200 px-6 py-4 rounded-xl font-black text-tlb-dark text-sm hover:bg-gray-50">
                    Back
                </button>
                <button onClick={() => onNavigate('CREATE_EVENT_REVIEW')} className="flex-1 bg-tlb-yellow text-tlb-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-tlb-yellow/20">
                    Next: Review <ArrowLeft size={20} className="rotate-180" />
                </button>
            </div>
        </div>
    </div>
);
