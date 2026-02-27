import React from 'react';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    CheckCircle2,
    Ticket,
    Save,
    Send,
    Edit2
} from 'lucide-react';
import { Screen } from '../../types';

interface EventProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const CreateEventReview: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
    <div className="min-h-screen bg-[#FDFCF8] pb-24">
        <header className="bg-white p-4 sm:p-6 sticky top-0 z-30 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => onNavigate('CREATE_EVENT_TICKETS')} className="p-2 -ml-2 rounded-full hover:bg-gray-50"><ArrowLeft size={24} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="font-black text-lg">Review & Publish</h1>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded mt-1">DRAFT</span>
                </div>
                <div className="w-8"></div>
            </div>
            <div className="flex justify-between items-center relative max-w-xs mx-auto px-4">
                <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-gray-100 -z-10"></div>
                <div className="absolute left-[10%] right-[90%] top-4 h-0.5 bg-tlb-yellow -z-10"></div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm"><CheckCircle2 size={16} /></div>
                    <span className="text-[10px] font-bold text-tlb-dark">Details</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm"><CheckCircle2 size={16} /></div>
                    <span className="text-[10px] font-bold text-tlb-dark">Tickets</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm">3</div>
                    <span className="text-[10px] font-bold text-tlb-dark">Review</span>
                </div>
            </div>
        </header>

        <main className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
                <div className="h-48 relative bg-gray-200">
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded flex items-center gap-1 z-10">LIVE PREVIEW</div>
                    <img src="https://picsum.photos/seed/jazz/1200/600" alt="Preview cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                </div>
                <div className="p-6 relative">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="font-black text-2xl text-tlb-dark max-w-[80%]">The Midnight Jazz Spectacle</h2>
                        <button className="text-tlb-yellow mt-1"><Edit2 size={20} /></button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-4"><Calendar size={20} className="text-tlb-yellow shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-tlb-dark">Dec 24 - Dec 26, 2023</p><p className="text-[10px] text-gray-500">Multiple Slots Available</p></div></div>
                        <div className="flex gap-4"><MapPin size={20} className="text-tlb-yellow shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-tlb-dark">The Royal Majestic Theatre</p><p className="text-[10px] text-gray-500">42nd Street, Manhattan, NY</p></div></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-tlb-yellow/20 p-2 rounded-xl text-tlb-dark"><span className="text-lg font-serif italic text-center w-5 h-5 block leading-5">i</span></div>
                        <h3 className="font-black text-tlb-dark text-lg">Event Description</h3>
                    </div>
                    <button className="text-gray-400"><Edit2 size={16} /></button>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">Step into a world of rhythm and soul as we bring you the most anticipated jazz event of the season. Featuring award-winning performers and an immersive stage setup that captures the essence of classic Broadway.</p>
            </div>

            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-dark"><Ticket size={20} /></div>
                        <h3 className="font-black text-tlb-dark text-lg">Pricing & Capacity</h3>
                    </div>
                    <button className="text-gray-400"><Edit2 size={16} /></button>
                </div>
                <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
                    <div className="grid grid-cols-3 p-4 bg-[#F8F9FA] border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest"><div>TIER</div><div>PRICE</div><div>SEATS</div></div>
                    <div className="divide-y divide-gray-50 text-sm">
                        <div className="grid grid-cols-3 p-4 items-center"><div className="font-black text-tlb-dark">VIP Premiere</div><div className="text-gray-500">$120.00</div><div className="text-gray-500">50</div></div>
                        <div className="grid grid-cols-3 p-4 items-center"><div className="font-black text-tlb-dark">Standard</div><div className="text-gray-500">$75.00</div><div className="text-gray-500">150</div></div>
                        <div className="grid grid-cols-3 p-4 items-center bg-[#F8F9FA]"><div className="font-black text-tlb-dark">Early Bird</div><div className="text-tlb-yellow font-bold">-$15.00</div><div className="text-gray-400 italic text-[10px]">Promo</div></div>
                    </div>
                </div>
            </div>
            <div className="h-6"></div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
            <div className="max-w-3xl mx-auto space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <button className="py-4 rounded-xl border border-gray-200 bg-white font-black text-sm text-tlb-dark flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 uppercase tracking-widest"><span className="text-lg">👁️</span> Preview</button>
                    <button className="py-4 rounded-xl border border-gray-200 bg-white font-black text-sm text-tlb-dark flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 uppercase tracking-widest"><Save size={18} /> Save Draft</button>
                </div>
                <button onClick={() => onNavigate('EVENT_REVIEW_STATUS')} className="w-full bg-tlb-yellow text-tlb-dark flex items-center justify-center gap-2 py-5 rounded-xl font-black text-lg shadow-lg shadow-tlb-yellow/20 hover:scale-[1.02] transition-transform">
                    Submit for Review <Send size={20} className="ml-1" />
                </button>
            </div>
        </div>
    </div>
);
