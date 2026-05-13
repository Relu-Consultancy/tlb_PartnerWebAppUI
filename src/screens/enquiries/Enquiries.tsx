import React, { useState, useEffect } from 'react';
import { Menu, Search, Filter, Lock, Phone, MessageCircle, X, StickyNote, Inbox, Loader2 } from 'lucide-react';
import { Screen, EnquiryStatus } from '../../types';
import { getClassEnquiries, updateClassEnquiry, unlockClassEnquiry } from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface Lead {
    id: number;
    studentName: string;
    parentName?: string;
    batch: string;
    age: string;
    dateTime: string;
    contact: string;
    isUnlocked: boolean;
    status: EnquiryStatus;
    message?: string;
    area?: string;
    notes: string;
}

export const Enquiries: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadEnquiries();
    }, []);

    const loadEnquiries = async () => {
        try {
            setIsLoading(true);
            const res = await getClassEnquiries();
            // Map the API response fields to the UI interface format if necessary
            // For now assuming the backend matches or we provide fallbacks
            const formattedData = (res.data || []).map((item: any) => ({
                id: item.id,
                studentName: item.student_name || item.studentName || 'Unknown Student',
                parentName: item.parent_name || item.parentName,
                batch: item.batch_name || item.batch || 'General',
                age: item.age || item.student_age || 'N/A',
                dateTime: item.created_at ? new Date(item.created_at).toLocaleString() : (item.dateTime || ''),
                contact: item.contact_number || item.contact || 'Hidden',
                isUnlocked: !!item.is_unlocked || !!item.isUnlocked,
                status: (item.status || 'New') as EnquiryStatus,
                message: item.message,
                area: item.area,
                notes: item.internal_notes || item.notes || '',
            }));
            setLeads(formattedData);
        } catch (e) {
            console.error('Failed to load enquiries', e);
        } finally {
            setIsLoading(false);
        }
    };

    const unlockLead = async (id: number) => {
        try {
            await unlockClassEnquiry(id);
            setLeads(prev => prev.map(l => l.id === id ? { ...l, isUnlocked: true } : l));
            // Reload to get the actual contact info
            loadEnquiries();
        } catch (e) {
            console.error('Failed to unlock lead', e);
        }
    };

    const updateStatus = async (id: number, status: EnquiryStatus) => {
        try {
            // Optimistic update
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
            await updateClassEnquiry(id, { status: status.toLowerCase() });
            if (selectedLead && selectedLead.id === id) {
                setSelectedLead({ ...selectedLead, status });
            }
        } catch (e) {
            console.error('Failed to update status', e);
            loadEnquiries(); // Revert on failure
        }
    };

    const updateNotes = async (id: number, notes: string) => {
        try {
            setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
            await updateClassEnquiry(id, { internal_notes: notes });
            if (selectedLead && selectedLead.id === id) {
                setSelectedLead({ ...selectedLead, notes });
            }
        } catch (e) {
            console.error('Failed to update notes', e);
            loadEnquiries(); // Revert on failure
        }
    };

    const sorted = [...leads]
        .filter(l => l.studentName.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (a.status === 'New' ? -1 : 1) - (b.status === 'New' ? -1 : 1));

    return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
            <h1 className="font-black text-lg">Class Enquiry Management</h1>
            <div className="w-10" />
        </header>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                {/* Search */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                        <Search size={18} className="text-gray-400" />
                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search enquiries..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button className="bg-white border border-gray-100 p-3 rounded-2xl text-gray-400 shadow-sm"><Filter size={18} /></button>
                </div>

                {/* Enquiries Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Batch Interested In</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Student Age</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date/Time</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact Information</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Loader2 size={32} className="animate-spin mb-3" />
                                                <p className="text-sm font-bold">Loading enquiries...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : sorted.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
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
                                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${lead.status === 'New' ? 'bg-blue-50/20' : ''}`}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-900">{lead.studentName}</span>
                                                {lead.status === 'New' && (
                                                    <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">New</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-gray-600 font-medium">{lead.batch}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm text-gray-500">{lead.age}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[11px] font-bold text-gray-400">{lead.dateTime}</span>
                                        </td>
                                        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                            {!lead.isUnlocked ? (
                                                <button
                                                    onClick={() => unlockLead(lead.id)}
                                                    className="bg-tlb-yellow/10 text-tlb-yellow px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black border border-tlb-yellow/20 hover:bg-tlb-yellow/20 transition-all"
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
                                        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={lead.status}
                                                onChange={(e) => updateStatus(lead.id, e.target.value as EnquiryStatus)}
                                                className={`text-xs font-bold rounded-xl px-3 py-2 border outline-none cursor-pointer transition-all shadow-sm ${
                                                    lead.status === 'New' ? 'bg-blue-500 text-white border-blue-600' :
                                                    lead.status === 'Contacted' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
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

        {/* Slide-out Lead Card */}
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
                            {selectedLead.parentName && (
                                <p className="text-sm text-gray-400 mt-1">Parent: <span className="text-gray-600 font-bold">{selectedLead.parentName}</span></p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Batch Interested</p>
                                <p className="text-sm font-bold mt-0.5">{selectedLead.batch}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Age</p>
                                    <p className="text-sm font-bold mt-0.5">{selectedLead.age}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enquiry Date</p>
                                    <p className="text-sm font-bold mt-0.5">{selectedLead.dateTime}</p>
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
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Message</p>
                                <p className="text-sm text-blue-800 italic">"{selectedLead.message}"</p>
                            </div>
                        )}

                        {/* Internal Notes */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <StickyNote size={12} /> Internal Notes
                            </label>
                            <textarea
                                className="tlb-input w-full min-h-[100px] resize-y"
                                placeholder="Add your notes here... (e.g. Called on 12th, will come for trial next week)"
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
