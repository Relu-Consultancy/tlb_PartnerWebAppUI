import React, { useState } from 'react';
import { Menu, Search, Download, FileText, FileSpreadsheet, Clock, CheckSquare, Square, Inbox } from 'lucide-react';
import { Screen } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface Attendee { id: number; name: string; phone: string; event: string; status: string; checkedIn: boolean; time: string; }

const Attendees: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [attendees, setAttendees] = useState<Attendee[]>([]);

    const toggleCheckIn = (id: number) => {
        setAttendees(prev => prev.map(a => a.id === id ? { ...a, checkedIn: !a.checkedIn } : a));
    };

    const filtered = attendees.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone.includes(searchQuery)
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <main className="flex-1 w-full md:w-auto h-screen overflow-y-auto">
                <header className="bg-white p-6 md:p-10 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Attendees</h1>
                            <p className="text-sm font-bold text-gray-400 mt-1">Manage class rosters and check-ins</p>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 tlb-content space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-gray-100 mb-6">
                        <button onClick={() => setActiveTab('Upcoming')} className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'Upcoming' ? 'border-tlb-yellow text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Active & Upcoming</button>
                        <button onClick={() => setActiveTab('Past')} className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'Past' ? 'border-tlb-yellow text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Past Events</button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <div className="flex-1 w-full space-y-4">
                            {/* Search */}
                            <div className="bg-white rounded-2xl p-2 flex items-center border border-gray-100 shadow-sm">
                                <div className="pl-4 text-gray-400"><Search size={18} /></div>
                                <input 
                                    className="w-full bg-transparent border-none focus:outline-none px-4 py-2 text-sm font-bold placeholder:text-gray-300"
                                    placeholder="Search by Name or Phone..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Phone Number</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Check-in</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filtered.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-16 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-gray-300">
                                                            <Inbox size={32} />
                                                            <p className="text-sm font-bold">No attendees yet</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filtered.map(attendee => (
                                                <tr key={attendee.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-sm text-gray-900">{attendee.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-800 font-bold">{attendee.event}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{attendee.phone}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                                                            attendee.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                            attendee.status === 'Comp' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>{attendee.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => toggleCheckIn(attendee.id)}
                                                            className={`p-1.5 rounded-lg transition-colors ${attendee.checkedIn ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                                        >
                                                            {attendee.checkedIn ? <CheckSquare size={24} /> : <Square size={24} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Download Options */}
                        <div className="w-full lg:w-80 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm shrink-0">
                            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                                <Download size={18} className="text-gray-400" /> Download Options
                            </h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><FileText size={18} /></div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">PDF Download</div>
                                        <div className="text-xs text-gray-400">Printable roster</div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all text-left group">
                                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors"><FileSpreadsheet size={18} /></div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Export to Excel</div>
                                        <div className="text-xs text-gray-400">Full detailed CSV data</div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all text-left group">
                                    <div className="bg-purple-100 text-purple-600 p-2 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors"><Clock size={18} /></div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Check-in Report</div>
                                        <div className="text-xs text-gray-400">Time of entry for each person</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Attendees;
