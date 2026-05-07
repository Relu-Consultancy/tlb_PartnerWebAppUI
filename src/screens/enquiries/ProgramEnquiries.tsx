import React, { useState } from 'react';
import { Menu, Search, Filter, Lock, Phone, MessageCircle, X, StickyNote, Inbox } from 'lucide-react';
import { Screen, EnquiryStatus } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface ProgramLead {
    id: string;
    studentName: string;
    parentName: string;
    program: string;
    format: string;
    age: string;
    receivedOn: string;
    contact: string;
    isUnlocked: boolean;
    status: EnquiryStatus;
    message?: string;
    area?: string;
    notes: string;
}

export const ProgramEnquiries: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [leads, setLeads] = useState<ProgramLead[]>([]);
    const [selectedLead, setSelectedLead] = useState<ProgramLead | null>(null);
    const [search, setSearch] = useState('');

    const unlockLead = (id: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, isUnlocked: true } : l));
    };

    const updateStatus = (id: string, status: EnquiryStatus) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    };

    const updateNotes = (id: string, notes: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
    };

    const sorted = [...leads]
        .filter(l =>
            l.studentName.toLowerCase().includes(search.toLowerCase()) ||
            l.parentName.toLowerCase().includes(search.toLowerCase()) ||
            l.program.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => (a.status === 'New' ? -1 : 1) - (b.status === 'New' ? -1 : 1));

    return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
            <h1 className="font-black text-lg">Program Enquiry Management</h1>
            <div className="w-10" />
        </header>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                {/* Search */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                        <Search size={18} className="text-gray-400" />
                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search by student, parent, or program..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button className="bg-white border border-gray-100 p-3 rounded-2xl text-gray-400 shadow-sm"><Filter size={18} /></button>
                </div>

                {/* Program Enquiries Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Parent Name</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Program (Format)</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Student Age</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Received On</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact Information</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {sorted.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-300">
                                                <Inbox size={36} />
                                                <p className="text-sm font-bold">No enquiries yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : sorted.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => setSelectedLead(lead)}
                                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${lead.status === 'New' ? 'bg-emerald-50/20' : ''}`}
                                    >
                                        <td className="px-5 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-900">{lead.studentName}</span>
                                                {lead.status === 'New' && (
                                                    <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">New</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5">
                                            <span className="text-sm text-gray-600 font-medium">{lead.parentName}</span>
                                        </td>
                                        <td className="px-5 py-5">
                                            <div>
                                                <span className="text-sm font-bold text-gray-800">{lead.program}</span>
                                                <span className="text-[10px] text-gray-400 font-bold ml-1.5 bg-gray-100 px-1.5 py-0.5 rounded">({lead.format})</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 text-center">
                                            <span className="text-sm text-gray-500">{lead.age}</span>
                                        </td>
                                        <td className="px-5 py-5">
                                            <span className="text-[11px] font-bold text-gray-400">{lead.receivedOn}</span>
                                        </td>
                                        <td className="px-5 py-5" onClick={(e) => e.stopPropagation()}>
                                            {!lead.isUnlocked ? (
                                                <button
                                                    onClick={() => unlockLead(lead.id)}
                                                    className="bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                                                >
                                                    <Lock size={14} /> Unlock Mobile
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-black text-gray-700 whitespace-nowrap">{lead.contact}</span>
                                                    <div className="flex gap-1">
                                                        <button title="Call" className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-100">
                                                            <Phone size={14} />
                                                        </button>
                                                        <button title="WhatsApp" className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100 transition-colors shadow-sm border border-green-100">
                                                            <MessageCircle size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-5" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={lead.status}
                                                onChange={(e) => updateStatus(lead.id, e.target.value as EnquiryStatus)}
                                                className={`text-xs font-bold rounded-xl px-3 py-2 border outline-none cursor-pointer transition-all shadow-sm ${
                                                    lead.status === 'New' ? 'bg-emerald-500 text-white border-emerald-600' :
                                                    lead.status === 'Contacted' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    lead.status === 'Converted' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}
                                            >
                                                <option value="New">New</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Converted">Converted</option>
                                                <option value="Lost">Lost</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>

        {/* Lead Detail Slide-out */}
        {selectedLead && (
            <>
                <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
                <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col animate-slide-in">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-black text-lg">Lead Detail</h2>
                        <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-auto p-6 space-y-5">
                        <div>
                            <p className="text-2xl font-black">{selectedLead.studentName}</p>
                            <p className="text-sm text-gray-400 mt-1">Parent: <span className="text-gray-600 font-bold">{selectedLead.parentName}</span></p>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Program</p>
                                <p className="text-sm font-bold mt-0.5">{selectedLead.program} <span className="text-gray-400 font-medium">({selectedLead.format})</span></p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Age</p>
                                    <p className="text-sm font-bold mt-0.5">{selectedLead.age}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Received</p>
                                    <p className="text-sm font-bold mt-0.5">{selectedLead.receivedOn}</p>
                                </div>
                            </div>
                            {selectedLead.area && (
                                <div className="bg-gray-50 rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Area / Locality</p>
                                    <p className="text-sm font-bold mt-0.5">{selectedLead.area}</p>
                                </div>
                            )}
                        </div>

                        {selectedLead.message && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Message</p>
                                <p className="text-sm text-emerald-800 italic">"{selectedLead.message}"</p>
                            </div>
                        )}

                        {/* Internal Notes */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <StickyNote size={12} /> Internal Notes
                            </label>
                            <textarea
                                className="tlb-input w-full min-h-[100px] resize-y"
                                placeholder="Add your notes here... (e.g. Called parent, will visit for demo on Saturday)"
                                defaultValue={selectedLead.notes}
                                onBlur={(e) => updateNotes(selectedLead.id, e.target.value)}
                            />
                        </div>

                        {/* Contact Actions */}
                        {selectedLead.isUnlocked && (
                            <div className="flex gap-3">
                                <button className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                                    <Phone size={16} /> Call
                                </button>
                                <button className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                                    <MessageCircle size={16} /> WhatsApp
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
    </div>
    );
};
