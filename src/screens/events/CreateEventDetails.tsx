import React from 'react';
import {
    ArrowLeft,
    Plus,
    Search,
    Calendar,
    MapPin,
    Users,
    Clock,
    ImageIcon
} from 'lucide-react';
import { Screen } from '../../types';

interface EventProps {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const CreateEventDetails: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
    <div className="min-h-screen bg-[#FDFCF8] pb-24">
        {/* Header & Stepper */}
        <header className="bg-white p-4 sm:p-6 sticky top-0 z-30 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => onNavigate('EVENT_LISTINGS')} className="p-2 -ml-2 rounded-full hover:bg-gray-50"><ArrowLeft size={24} /></button>
                <h1 className="font-black text-lg">Create New Event</h1>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            {/* Stepper */}
            <div className="flex justify-between items-center relative max-w-xs mx-auto px-4">
                <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-gray-100 -z-10"></div>
                <div className="absolute left-[10%] right-[50%] top-4 h-0.5 bg-tlb-yellow -z-10"></div>

                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm">1</div>
                    <span className="text-[10px] font-bold text-tlb-yellow">Details</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-sm font-black text-gray-300">2</div>
                    <span className="text-[10px] font-bold text-gray-300">Tickets</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-sm font-black text-gray-300">3</div>
                    <span className="text-[10px] font-bold text-gray-300">Publish</span>
                </div>
            </div>
        </header>

        <main className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

            {/* Basic Info */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><ImageIcon size={20} /></div>
                    <h2 className="font-black text-lg">Basic Info</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-tlb-dark mb-2 block">Event Name</label>
                        <input className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm" placeholder="e.g. The Midnight Masquerade" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-tlb-dark mb-2 block">Event Banner</label>
                        <div className="aspect-[2/1] bg-[#F8F9FA] rounded-[1.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
                            <ImageIcon size={32} />
                            <p className="text-[10px] font-bold">Recommended: 1200 x 675px</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><Calendar size={20} /></div>
                        <h2 className="font-black text-lg">Schedule</h2>
                    </div>
                    <div className="bg-[#F8F9FA] flex rounded-lg p-1 border border-gray-100">
                        <button className="px-3 py-1 text-[10px] font-black bg-white rounded-md shadow-sm">Single</button>
                        <button className="px-3 py-1 text-[10px] font-black text-gray-400">Slots</button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-2 block">Date</label>
                            <div className="relative">
                                <input type="text" placeholder="mm/dd/yyyy" className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm pr-10" />
                                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-2 block">Time</label>
                            <div className="relative">
                                <input type="text" placeholder="-- : -- --" className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm pl-10 text-center" />
                                <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-tlb-dark font-black text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        <Plus size={16} /> Add Another Slot
                    </button>
                </div>
            </div>

            {/* Category & Language */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow flex gap-0.5"><div className="w-1.5 h-1.5 bg-tlb-yellow rounded-full"></div><div className="w-1.5 h-1.5 bg-tlb-yellow rounded-full"></div><div className="w-1.5 h-1.5 bg-tlb-yellow rounded-full"></div></div>
                    <h2 className="font-black text-lg">Category & Language</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-tlb-dark mb-2 block">Event Category</label>
                        <select className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm appearance-none">
                            <option>Musical Theater</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-tlb-dark mb-2 block">Performance Language(s)</label>
                        <div className="flex flex-wrap gap-2">
                            {['English', 'Spanish', 'French'].map((lang, i) => (
                                <button key={lang} className={`px-4 py-2 rounded-full text-xs font-bold border ${i === 0 ? 'border-tlb-yellow text-tlb-dark bg-tlb-yellow/5' : 'border-gray-200 text-gray-400'}`}>
                                    {lang}
                                </button>
                            ))}
                            <button className="px-4 py-2 rounded-full text-xs font-bold border border-gray-200 text-gray-500 uppercase tracking-widest">+ Add</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Age Groups */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><Users size={20} /></div>
                    <h2 className="font-black text-lg">Age Groups</h2>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-tlb-dark mb-3 block">Target Audience</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {[
                            { label: '0-3', active: true },
                            { label: '4-7', active: true },
                            { label: '8-12', active: false },
                            { label: '13-16', active: false },
                            { label: '17-18', active: false },
                            { label: '18+ (Parents)', active: false },
                        ].map((age) => (
                            <button key={age.label} className={`px-4 py-2 rounded-full text-xs font-bold border ${age.active ? 'border-tlb-yellow text-tlb-dark bg-tlb-yellow/5' : 'border-gray-200 text-gray-400'}`}>
                                {age.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 italic">Select all that apply for your production.</p>
                </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><MapPin size={20} /></div>
                    <h2 className="font-black text-lg">Location</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-tlb-dark mb-2 block">Venue Address</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm pl-11" placeholder="Search for theater or address" />
                        </div>
                    </div>

                    <div className="h-40 bg-[#E9ECEF] rounded-[1.5rem] relative overflow-hidden flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MAP PREVIEW</span>
                        <div className="absolute bottom-3 left-3 bg-white p-2 rounded-xl shadow-sm">
                            <p className="font-black text-[10px]">Majestic Theatre</p>
                            <p className="text-[8px] text-gray-500">245 W 44th St, New York</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><span className="text-xl font-black">☰</span></div>
                    <h2 className="font-black text-lg">Description</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-tlb-dark mb-2 block">About the Event</label>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-[#F8F9FA]">
                            <div className="flex gap-4 p-3 border-b border-gray-100 bg-white">
                                <button className="font-serif font-bold text-gray-700">B</button>
                                <button className="italic font-serif text-gray-700">I</button>
                                <button className="text-gray-700">≡</button>
                            </div>
                            <textarea className="w-full bg-transparent p-4 min-h-[120px] outline-none text-sm resize-y" placeholder="Tell your audience what makes this event special..."></textarea>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-tlb-dark">Terms & Conditions</label>
                            <button className="text-[8px] font-bold text-tlb-yellow uppercase tracking-widest">TEMPLATES</button>
                        </div>
                        <textarea className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm min-h-[80px] resize-y" placeholder="Refund policy, age restrictions, etc."></textarea>
                    </div>

                    <button className="flex items-center gap-2 text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">
                        <Plus size={14} /> Add FAQ Section
                    </button>
                </div>
            </div>

        </main>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => onNavigate('CREATE_EVENT_TICKETS')} className="w-full bg-tlb-yellow text-tlb-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-tlb-yellow/20">
                    Next: Ticket Setup <ArrowLeft size={20} className="rotate-180" />
                </button>
            </div>
        </div>
    </div>
);
