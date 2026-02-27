import React, { useState } from 'react';
import {
    Menu,
    Plus,
    Search,
    Filter,
    Bell,
    Edit2,
    Copy,
    BarChart2
} from 'lucide-react';
import { Screen } from '../../types';

interface EventProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const EventListings: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [showCompleteSetupDialog, setShowCompleteSetupDialog] = useState(false);

    return (
        <div className="min-h-screen bg-[#FDFCF8] pb-12">
            <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Partner Portal</span>
                    <h1 className="font-black text-xl">My Listings</h1>
                </div>
                <button className="p-2 bg-white rounded-full shadow-sm relative">
                    <Bell size={24} />
                    <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                </button>
            </header>

            <main className="px-4 sm:px-6 py-6 border-t border-gray-100 bg-[#F8F9FA]">
                <div className="max-w-lg mx-auto space-y-6">
                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                            <Search size={18} className="text-gray-400" />
                            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search your listings..." />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 rounded-2xl shadow-sm transition-colors ${showFilters ? 'bg-tlb-dark text-tlb-yellow' : 'bg-tlb-yellow text-tlb-dark'}`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-in slide-in-from-top-4 fade-in duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Advanced Filters</h3>
                                <button className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Clear All</button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-tlb-dark mb-1.5 block">Date Range</label>
                                    <div className="flex items-center gap-2">
                                        <input type="text" placeholder="mm/dd/yyyy" className="tlb-input flex-1 bg-[#FDFCF8] border-gray-100 text-xs py-2" />
                                        <span className="text-gray-300">-</span>
                                        <input type="text" placeholder="mm/dd/yyyy" className="tlb-input flex-1 bg-[#FDFCF8] border-gray-100 text-xs py-2" />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs text-tlb-dark mb-1.5 block">Category</label>
                                        <select className="tlb-input w-full bg-[#FDFCF8] border-gray-100 text-xs py-2 text-gray-500 appearance-none">
                                            <option>All Categories</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-tlb-dark mb-1.5 block">Status</label>
                                        <select className="tlb-input w-full bg-[#FDFCF8] border-gray-100 text-xs py-2 text-gray-500 appearance-none">
                                            <option>All Statuses</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                        {['All', 'Active', 'Draft', 'Past'].map((tab, i) => (
                            <button key={tab} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap ${i === 0 ? 'bg-tlb-yellow text-tlb-dark' : 'bg-white border border-gray-200 text-gray-500'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Create Listing Button */}
                    <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="tlb-button w-full py-4 text-sm shadow-sm flex items-center justify-center gap-2">
                        <Plus size={18} /> Create New Listing
                    </button>

                    {/* Listings */}
                    <div className="space-y-6">
                        {/* Item 1 - Live */}
                        <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
                            <div className="h-40 relative">
                                <img src="https://picsum.photos/seed/stage1/800/400" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded">LIVE</span>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Theater Workshop</span>
                                    <span className="text-[10px] text-gray-400">Dec 15, 2023</span>
                                </div>
                                <h4 className="font-black text-lg mb-4 text-tlb-dark">Holiday Broadway Intensive</h4>

                                <div className="flex gap-4 mb-5 border-t border-b border-gray-50 py-3 bg-[#FDFCF8] rounded-xl px-4">
                                    <div className="flex-1 border-r border-gray-100">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Bookings</p>
                                        <p className="font-black text-tlb-dark text-sm">45 / 50 <span className="text-[10px] text-gray-400 font-normal">(90%)</span></p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Revenue</p>
                                        <p className="font-black text-tlb-dark text-sm">$2,250</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex gap-2">
                                        <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Edit2 size={16} /></button>
                                        <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Copy size={16} /></button>
                                        <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><BarChart2 size={16} /></button>
                                    </div>
                                    <button onClick={() => onNavigate('EVENT_DETAILS')} className="text-xs font-black text-tlb-yellow uppercase tracking-widest pr-2">View Details</button>
                                </div>
                            </div>
                        </div>

                        {/* Item 2 - Draft */}
                        <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm opacity-80">
                            <div className="h-40 relative">
                                <img src="https://picsum.photos/seed/guitar/800/400" alt="Cover" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-white/40 mix-blend-overlay"></div>
                                <span className="absolute top-4 right-4 bg-slate-400 text-white text-[10px] font-black px-2 py-1 rounded">DRAFT</span>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Music Class</span>
                                    <span className="text-[10px] text-gray-400">Jan 10, 2024</span>
                                </div>
                                <h4 className="font-black text-lg mb-4 text-tlb-dark">Beginner Piano for Toddlers</h4>

                                <div className="flex gap-4 mb-5 border-t border-b border-gray-50 py-3 bg-[#FDFCF8] rounded-xl px-4">
                                    <div className="flex-1 border-r border-gray-100">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Bookings</p>
                                        <p className="font-black text-tlb-dark text-sm">0 / 12</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Status</p>
                                        <p className="text-gray-500 italic text-sm">Not Started</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex gap-2">
                                        <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Edit2 size={16} /></button>
                                        <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Copy size={16} /></button>
                                        <button className="p-2.5 bg-gray-50 rounded-xl text-gray-300 border border-gray-100" disabled><BarChart2 size={16} /></button>
                                    </div>
                                    <button
                                        onClick={() => setShowCompleteSetupDialog(true)}
                                        className="text-xs font-black text-tlb-yellow uppercase tracking-widest pr-2"
                                    >
                                        Complete Setup
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Item 3 - Sold Out */}
                        <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
                            <div className="h-40 relative">
                                <img src="https://picsum.photos/seed/dance/800/400" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded">SOLD OUT</span>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Dance Program</span>
                                    <span className="text-[10px] text-gray-400">Every Tue/Thu</span>
                                </div>
                                <h4 className="font-black text-lg mb-4 text-tlb-dark">Advanced Tap Dance Techniques</h4>

                                <div className="flex gap-4 mb-5 border-t border-b border-gray-50 py-3 bg-[#FDFCF8] rounded-xl px-4">
                                    <div className="flex-1 border-r border-gray-100">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Bookings</p>
                                        <p className="font-black text-tlb-dark text-sm">20 / 20</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Waitlist</p>
                                        <p className="font-black text-tlb-dark text-sm">4</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex gap-2">
                                        <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Edit2 size={16} /></button>
                                        <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Copy size={16} /></button>
                                        <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><BarChart2 size={16} /></button>
                                    </div>
                                    <button onClick={() => onNavigate('EVENT_DETAILS')} className="text-xs font-black text-tlb-yellow uppercase tracking-widest pr-2">View Details</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Complete Setup Dialog Overlay */}
            {showCompleteSetupDialog && (
                <div className="fixed inset-0 bg-tlb-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="w-16 h-16 bg-tlb-yellow/10 rounded-full flex items-center justify-center mx-auto text-tlb-yellow">
                                <Edit2 size={24} />
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="font-black text-2xl text-tlb-dark">Complete Setup</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    You have unsaved changes for <strong className="text-tlb-dark">Beginner Piano for Toddlers</strong>. Would you like to pick up where you left off?
                                </p>
                            </div>

                            <div className="space-y-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowCompleteSetupDialog(false);
                                        onNavigate('CREATE_EVENT_DETAILS');
                                    }}
                                    className="tlb-button w-full py-4 text-sm shadow-md"
                                >
                                    Continue Setup
                                </button>
                                <button
                                    onClick={() => setShowCompleteSetupDialog(false)}
                                    className="w-full py-4 text-gray-400 font-bold text-sm bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 uppercase tracking-widest transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
