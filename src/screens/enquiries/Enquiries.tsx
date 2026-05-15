import React, { useState, useEffect } from 'react';
import { Menu, Search, Filter, Lock, Phone, MessageCircle, X, StickyNote, Inbox, Loader2 } from 'lucide-react';
import { Screen, EnquiryStatus } from '../../types';
import { getClassEnquiries, updateClassEnquiry, unlockClassEnquiry } from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface Lead {
    id: string;
    classTitle: string;
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

// ── API status values ↔ display labels ─────────────────────────────────────
const STATUS_OPTIONS: { value: EnquiryStatus; label: string }[] = [
    { value: 'new',           label: 'New' },
    { value: 'contacted',     label: 'Contacted' },
    { value: 'trial_booked',  label: 'Trial Booked' },
    { value: 'closed',        label: 'Closed' },
];

const statusStyle = (s: EnquiryStatus) => {
    switch (s) {
        case 'new':          return 'bg-blue-500 text-white border-blue-600';
        case 'contacted':    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'trial_booked': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'closed':       return 'bg-gray-100 text-gray-600 border-gray-200';
        default:             return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

export const Enquiries: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<EnquiryStatus | ''>('');
    const [showFilter, setShowFilter] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const loadEnquiries = async () => {
        try {
            setIsLoading(true);
            const res = await getClassEnquiries(statusFilter || undefined);
            // API returns a flat array or { data: [...] }
            const raw: any[] = Array.isArray(res) ? res : (res.data || []);
            const formattedData: Lead[] = raw.map((item: any) => ({
                id: String(item.id),
                classTitle: item.class_title || '',
                studentName: item.student_name || 'Unknown Student',
                parentName: item.parent_name || undefined,
                batch: item.batch_name || `Batch ${item.batch || ''}`.trim() || 'General',
                age: item.student_age != null ? String(item.student_age) : 'N/A',
                dateTime: item.created_at ? new Date(item.created_at).toLocaleString() : '',
                contact: item.mobile || 'Hidden',
                isUnlocked: !!item.is_contact_unlocked,
                status: (item.status || 'new') as EnquiryStatus,
                message: item.message || undefined,
                area: item.area || undefined,
                notes: item.internal_notes || '',
            }));
            setLeads(formattedData);
        } catch (e) {
            console.error('Failed to load enquiries', e);
        } finally {
            setIsLoading(false);
        }
    };

    const unlockLead = async (id: string) => {
        try {
            const res = await unlockClassEnquiry(id);
            // API returns the full updated enquiry with is_contact_unlocked: true and unmasked mobile
            const item = res.data || res;
            const updatedLead: Partial<Lead> = {
                isUnlocked: !!item.is_contact_unlocked,
                contact: item.mobile || 'Hidden',
            };
            setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updatedLead } : l));
            if (selectedLead && selectedLead.id === id) {
                setSelectedLead({ ...selectedLead, ...updatedLead });
            }
        } catch (e: any) {
            console.error('Failed to unlock lead', e);
            alert(e?.message || 'Failed to unlock contact. Please try again.');
        }
    };

    const updateStatus = async (id: string, status: EnquiryStatus) => {
        try {
            // Optimistic update
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
            await updateClassEnquiry(id, { status });
            if (selectedLead && selectedLead.id === id) {
                setSelectedLead({ ...selectedLead, status });
            }
        } catch (e) {
            console.error('Failed to update status', e);
            loadEnquiries(); // Revert on failure
        }
    };

    const updateNotes = async (id: string, notes: string) => {
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

    // Client-side search on top of any API-side status filter
    const filtered = leads.filter(l =>
        l.studentName.toLowerCase().includes(search.toLowerCase()) ||
        l.classTitle.toLowerCase().includes(search.toLowerCase())
    );

    return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
            <h1 className="font-black text-lg">Class Enquiry Management</h1>
            <div className="w-10" />
        </header>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                {/* Search + Filter */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                        <Search size={18} className="text-gray-400" />
                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search by student or class name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`bg-white border p-3 rounded-2xl shadow-sm transition-colors ${statusFilter ? 'border-tlb-yellow text-tlb-yellow' : 'border-gray-100 text-gray-400'}`}
                        >
                            <Filter size={18} />
                        </button>
                        {showFilter && (
                            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-2 min-w-[160px]">
                                <button
                                    onClick={() => { setStatusFilter(''); setShowFilter(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${!statusFilter ? 'bg-tlb-yellow/10 text-tlb-yellow' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    All Statuses
                                </button>
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setStatusFilter(opt.value); setShowFilter(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${statusFilter === opt.value ? 'bg-tlb-yellow/10 text-tlb-yellow' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enquiries Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Class / Batch</th>
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
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-300">
                                                <Inbox size={36} />
                                                <p className="text-sm font-bold">No enquiries yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => setSelectedLead(lead)}
                                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${lead.status === 'new' ? 'bg-blue-50/20' : ''}`}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-900">{lead.studentName}</span>
                                                {lead.status === 'new' && (
                                                    <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">New</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div>
                                                {lead.classTitle && (
                                                    <p className="text-xs font-bold text-gray-700">{lead.classTitle}</p>
                                                )}
                                                <p className="text-xs text-gray-400">{lead.batch}</p>
                                            </div>
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
                                                        <a href={`tel:${lead.contact}`} title="Call" className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-100">
                                                            <Phone size={14} />
                                                        </a>
                                                        <a href={`https://wa.me/91${lead.contact.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp" className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100 transition-colors shadow-sm border border-green-100">
                                                            <MessageCircle size={14} />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={lead.status}
                                                onChange={(e) => updateStatus(lead.id, e.target.value as EnquiryStatus)}
                                                className={`text-xs font-bold rounded-xl px-3 py-2 border outline-none cursor-pointer transition-all shadow-sm ${statusStyle(lead.status)}`}
                                            >
                                                {STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
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
                            {selectedLead.classTitle && (
                                <div className="bg-gray-50 rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Class</p>
                                    <p className="text-sm font-bold mt-0.5">{selectedLead.classTitle}</p>
                                </div>
                            )}
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

                        {/* Status */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Status</label>
                            <select
                                value={selectedLead.status}
                                onChange={(e) => updateStatus(selectedLead.id, e.target.value as EnquiryStatus)}
                                className={`text-xs font-bold rounded-xl px-4 py-3 border outline-none cursor-pointer transition-all shadow-sm w-full ${statusStyle(selectedLead.status)}`}
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

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
                        {selectedLead.isUnlocked ? (
                            <div className="space-y-3">
                                <div className="bg-gray-50 rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile</p>
                                    <p className="text-sm font-black mt-0.5">{selectedLead.contact}</p>
                                </div>
                                <div className="flex gap-3">
                                    <a href={`tel:${selectedLead.contact}`} className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors">
                                        <Phone size={16} /> Call
                                    </a>
                                    <a href={`https://wa.me/91${selectedLead.contact.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                                        <MessageCircle size={16} /> WhatsApp
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => unlockLead(selectedLead.id)}
                                className="w-full bg-tlb-yellow text-tlb-dark py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:brightness-95 transition-all"
                            >
                                <Lock size={16} /> Unlock Contact Info
                            </button>
                        )}
                    </div>
                </div>
            </>
        )}
    </div>
    );
};
