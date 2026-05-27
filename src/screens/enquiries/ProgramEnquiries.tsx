import React, { useState, useEffect } from 'react';
import { Menu, Search, Filter, Phone, MessageCircle, X, StickyNote, Inbox, Loader2, ChevronDown } from 'lucide-react';
import { Screen, EnquiryStatus } from '../../types';
import { getProgramListings, getProgramEnquiries, updateProgramEnquiry } from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface ProgramOption { id: string; title: string; format: string; }

interface ProgramLead {
    id: number;
    listingId: string;
    studentName: string;
    parentName?: string;
    program: string;
    format: string;
    age: string;
    receivedOn: string;
    contact: string;
    email?: string;
    status: EnquiryStatus;
    message?: string;
    area?: string;
    notes: string;
}

const STATUS_OPTIONS: { value: EnquiryStatus; label: string }[] = [
    { value: 'new',       label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'enrolled',  label: 'Enrolled' },
    { value: 'closed',    label: 'Closed' },
];

const statusStyle = (s: EnquiryStatus) => {
    switch (s) {
        case 'new':       return 'bg-emerald-500 text-white border-emerald-600';
        case 'contacted': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'enrolled':  return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'closed':    return 'bg-gray-100 text-gray-600 border-gray-200';
        default:          return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

export const ProgramEnquiries: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [programs, setPrograms] = useState<ProgramOption[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [leads, setLeads] = useState<ProgramLead[]>([]);
    const [selectedLead, setSelectedLead] = useState<ProgramLead | null>(null);
    const [search, setSearch] = useState('');
    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [loadingEnquiries, setLoadingEnquiries] = useState(false);

    useEffect(() => {
        loadPrograms();
    }, []);

    useEffect(() => {
        if (selectedProgramId) loadEnquiries(selectedProgramId);
    }, [selectedProgramId]);

    const loadPrograms = async () => {
        try {
            setLoadingPrograms(true);
            const res = await getProgramListings();
            const data: any[] = res.data || res || [];
            const opts: ProgramOption[] = Array.isArray(data)
                ? data.map(p => ({ id: String(p.id), title: p.title || 'Untitled Program', format: p.program_format || p.format || '' }))
                : [];
            setPrograms(opts);
            if (opts.length > 0) setSelectedProgramId(opts[0].id);
        } catch (e) {
            console.error('Failed to load programs', e);
        } finally {
            setLoadingPrograms(false);
        }
    };

    const loadEnquiries = async (listingId: string) => {
        try {
            setLoadingEnquiries(true);
            setLeads([]);
            const selectedProgram = programs.find(p => p.id === listingId);
            const res = await getProgramEnquiries(listingId);
            const data: any[] = res.data || res || [];
            const formatted: ProgramLead[] = Array.isArray(data) ? data.map((item: any) => ({
                id: item.id,
                listingId,
                studentName: item.student_name || 'Unknown Student',
                parentName: item.parent_name,
                program: item.program_title || item.listing_title || selectedProgram?.title || '',
                format: item.program_format || item.format || selectedProgram?.format || '',
                age: item.student_age != null ? String(item.student_age) : 'N/A',
                receivedOn: item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
                contact: item.contact_number || '',
                email: item.email || '',
                status: (item.status || 'new') as EnquiryStatus,
                message: item.message,
                area: item.area,
                notes: item.partner_note || '',
            })) : [];
            setLeads(formatted);
        } catch (e) {
            console.error('Failed to load program enquiries', e);
        } finally {
            setLoadingEnquiries(false);
        }
    };

    const updateStatus = async (id: number, listingId: string, status: EnquiryStatus) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : prev);
        try {
            await updateProgramEnquiry(listingId, id, { status });
        } catch (e) {
            console.error('Failed to update status', e);
            if (selectedProgramId) loadEnquiries(selectedProgramId);
        }
    };

    const updateNotes = async (id: number, listingId: string, notes: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
        if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, notes } : prev);
        try {
            await updateProgramEnquiry(listingId, id, { partner_note: notes });
        } catch (e) {
            console.error('Failed to update notes', e);
        }
    };

    const sorted = [...leads]
        .filter(l =>
            l.studentName.toLowerCase().includes(search.toLowerCase()) ||
            (l.parentName || '').toLowerCase().includes(search.toLowerCase()) ||
            l.program.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => (a.status === 'new' ? -1 : 1) - (b.status === 'new' ? -1 : 1));

    const isLoading = loadingPrograms || loadingEnquiries;

    return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
            <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
            <h1 className="font-black text-lg">Program Enquiry Management</h1>
            <div className="w-10" />
        </header>

        <main className="p-6">
            <div className="tlb-content space-y-6">
                {/* Program selector */}
                {programs.length > 1 && (
                    <div className="relative">
                        <select
                            value={selectedProgramId || ''}
                            onChange={e => setSelectedProgramId(e.target.value)}
                            className="tlb-input w-full appearance-none pr-10 font-bold"
                        >
                            {programs.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                )}

                {/* Search */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                        <Search size={18} className="text-gray-400" />
                        <input
                            className="bg-transparent flex-1 text-sm outline-none"
                            placeholder="Search by student, parent, or program..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="bg-white border border-gray-100 p-3 rounded-2xl text-gray-400 shadow-sm">
                        <Filter size={18} />
                    </button>
                </div>

                {/* Enquiries Table */}
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
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Loader2 size={32} className="animate-spin mb-3" />
                                                <p className="text-sm font-bold">Loading enquiries...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : programs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-300">
                                                <Inbox size={36} />
                                                <p className="text-sm font-bold">No programs found</p>
                                                <p className="text-xs text-gray-400">Create a program listing to start receiving enquiries</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : sorted.length === 0 ? (
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
                                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${lead.status === 'new' ? 'bg-emerald-50/20' : ''}`}
                                    >
                                        <td className="px-5 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-900">{lead.studentName}</span>
                                                {lead.status === 'new' && (
                                                    <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">New</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5">
                                            <span className="text-sm text-gray-600 font-medium">{lead.parentName || '—'}</span>
                                        </td>
                                        <td className="px-5 py-5">
                                            <div>
                                                <span className="text-sm font-bold text-gray-800">{lead.program}</span>
                                                {lead.format && (
                                                    <span className="text-[10px] text-gray-400 font-bold ml-1.5 bg-gray-100 px-1.5 py-0.5 rounded">({lead.format})</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 text-center">
                                            <span className="text-sm text-gray-500">{lead.age}</span>
                                        </td>
                                        <td className="px-5 py-5">
                                            <span className="text-[11px] font-bold text-gray-400">{lead.receivedOn}</span>
                                        </td>
                                        <td className="px-5 py-5" onClick={(e) => e.stopPropagation()}>
                                            {lead.contact ? (
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
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No contact</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-5" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={lead.status}
                                                onChange={(e) => updateStatus(lead.id, lead.listingId, e.target.value as EnquiryStatus)}
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

        {/* Lead Detail Slide-out */}
        {selectedLead && (
            <>
                <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
                <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col animate-slide-in">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-black text-lg">Lead Detail</h2>
                        <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} />
                        </button>
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
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Program</p>
                                <p className="text-sm font-bold mt-0.5">
                                    {selectedLead.program}
                                    {selectedLead.format && <span className="text-gray-400 font-medium"> ({selectedLead.format})</span>}
                                </p>
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

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <StickyNote size={12} /> Internal Notes
                            </label>
                            <textarea
                                className="tlb-input w-full min-h-[100px] resize-y"
                                placeholder="Add your notes here..."
                                defaultValue={selectedLead.notes}
                                onBlur={(e) => updateNotes(selectedLead.id, selectedLead.listingId, e.target.value)}
                            />
                        </div>

                        {selectedLead.contact && (
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
