import React, { useState } from 'react';
import { ArrowLeft, Search, Calendar, MapPin, MoreHorizontal, Pencil, PauseCircle, Users, QrCode, Download } from 'lucide-react';
import { Screen } from '../../types';

interface EventProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const EventDetails: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => {
    const [salesPaused, setSalesPaused] = useState(false);

    return (
    <div className="min-h-screen bg-[#FDFCF8] pb-12">
        <header className="p-4 sm:p-6 sticky top-0 z-30 bg-[#FDFCF8]">
            <div className="max-w-3xl mx-auto flex items-start justify-between">
                <div className="flex gap-4 items-start">
                    <button onClick={() => onNavigate('EVENT_LISTINGS')} className="p-2.5 rounded-full bg-white shadow-sm border border-gray-100 mt-1"><ArrowLeft size={20} className="text-gray-600" /></button>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-tlb-yellow uppercase tracking-widest">Partner Portal</span>
                        <h1 className="font-black text-3xl text-tlb-dark leading-tight">Holiday Broadway<br />Intensive</h1>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mt-2">
                            <div className="flex items-center gap-1.5"><Calendar size={14} /> Dec 15, 2023</div>
                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                            <div className="flex items-center gap-1.5"><MapPin size={14} /> Main Studio</div>
                        </div>
                    </div>
                </div>
                <button className="bg-tlb-yellow text-tlb-dark px-5 py-2.5 rounded-full font-black text-sm flex items-center gap-2 shadow-sm">
                    <Download size={16} /> Export
                </button>
            </div>

            {/* Event Actions */}
            <div className="max-w-3xl mx-auto mt-4 flex flex-wrap gap-2">
                <button
                    onClick={() => onNavigate('CREATE_EVENT_DETAILS')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-bold text-tlb-dark hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Pencil size={16} /> Edit
                </button>
                <button
                    onClick={() => setSalesPaused(!salesPaused)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-bold transition-colors shadow-sm ${salesPaused
                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        : 'bg-white border-gray-200 text-tlb-dark hover:bg-gray-50'
                        }`}
                >
                    <PauseCircle size={16} /> {salesPaused ? 'Resume Sales' : 'Pause Sales'}
                </button>
                <button
                    onClick={() => document.getElementById('participants-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-bold text-tlb-dark hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Users size={16} /> View Guest List
                </button>
                <button
                    onClick={() => { /* TODO: open scan modal or navigate to scan screen */ }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-tlb-yellow text-tlb-dark text-sm font-bold hover:bg-tlb-yellow/90 transition-colors shadow-sm"
                >
                    <QrCode size={16} /> Scan Tickets
                </button>
            </div>
        </header>

        <main className="px-4 sm:px-6 py-6 pb-24">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Revenue Statistics */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Revenue Statistics</h3>
                        <span className="text-[9px] font-black text-gray-400 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">Live</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                        <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm min-w-[140px] flex-1">
                            <p className="text-[10px] font-bold text-gray-400 mb-2">Gross Revenue</p>
                            <p className="text-xl font-black text-tlb-dark mb-1">$3,825</p>
                            <p className="text-[10px] font-black text-emerald-500">+12%</p>
                        </div>
                        <div className="bg-white rounded-[2rem] p-5 border border-tlb-yellow/30 shadow-sm min-w-[140px] flex-1">
                            <p className="text-[10px] font-bold text-gray-400 mb-2">Net Earnings</p>
                            <p className="text-xl font-black text-tlb-dark mb-1">$3,251</p>
                            <p className="text-[10px] text-gray-300 font-bold">After Com.</p>
                        </div>
                        <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm min-w-[140px] flex-1">
                            <p className="text-[10px] font-bold text-gray-400 mb-2">Sold Tickets</p>
                            <p className="text-xl font-black text-tlb-dark mb-3">45/50</p>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-tlb-yellow rounded-full w-[90%]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Participants / Guest List */}
                <div id="participants-section" className="space-y-4 scroll-mt-24">
                <div className="flex gap-3 pt-2">
                    <div className="flex-1 bg-white border border-gray-100 rounded-[1.5rem] px-4 py-3.5 flex items-center gap-3 shadow-sm">
                        <Search size={18} className="text-gray-400" />
                        <input className="bg-transparent flex-1 text-sm outline-none text-gray-600" placeholder="Search participants..." />
                    </div>
                    <button className="bg-white p-3.5 rounded-[1.5rem] text-tlb-dark shadow-sm border border-gray-100 flex items-center justify-center min-w-[60px]">
                        <span className="text-xl rotate-90 leading-none pb-1">≡</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {[
                        { initials: 'SM', name: 'Sarah Mitchell', date: 'Dec 01, 2023 • 10:45 AM', status: 'Paid', statusColor: 'text-emerald-500 bg-emerald-50', tickets: '2 × VIP Pass', amount: '$240.00', bgColor: 'bg-[#FFF9E6] text-tlb-yellow' },
                        { initials: 'JC', name: 'James Chen', date: 'Nov 28, 2023 • 02:15 PM', status: 'Pending', statusColor: 'text-tlb-yellow bg-[#FFF9E6]', tickets: '1 × Standard', amount: '$85.00', bgColor: 'bg-[#F0F4F8] text-[#869AB8]' },
                        { initials: 'ET', name: 'Emma Thompson', date: 'Nov 25, 2023 • 09:20 AM', status: 'Failed', statusColor: 'text-red-500 bg-red-50', tickets: '4 × Early Bird', amount: '$260.00', bgColor: 'bg-[#FFF9E6] text-tlb-yellow' },
                        { initials: 'MD', name: 'Michael Davis', date: 'Nov 24, 2023 • 11:10 AM', status: 'Paid', statusColor: 'text-emerald-500 bg-emerald-50', tickets: '1 × Standard', amount: '$85.00', bgColor: 'bg-[#FFF9E6] text-tlb-yellow' },
                    ].map((p, i) => (
                        <div key={i} className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex gap-3 items-center">
                                    <div className={`w-12 h-12 rounded-full ${p.bgColor} font-black text-lg flex items-center justify-center`}>{p.initials}</div>
                                    <div>
                                        <h4 className="font-bold text-tlb-dark">{p.name}</h4>
                                        <p className="text-[10px] text-gray-400">{p.date}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black ${p.statusColor} px-3 py-1 rounded-full uppercase tracking-widest`}>{p.status}</span>
                            </div>
                            <div className="flex justify-between mb-6">
                                <div>
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">TICKETS</p>
                                    <p className="text-sm font-bold text-tlb-dark">{p.tickets}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">AMOUNT</p>
                                    <p className="text-sm font-bold text-tlb-dark">{p.amount}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-4">
                                    <button className="text-[10px] font-black text-tlb-yellow flex items-center gap-1.5"><span className="text-sm">📞</span> Call</button>
                                    <button className="text-[10px] font-black text-tlb-yellow flex items-center gap-1.5"><span className="text-sm">✉️</span> Email</button>
                                </div>
                                <button className="text-gray-300"><MoreHorizontal size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
                </div>
            </div>
        </main>
    </div>
    );
};
