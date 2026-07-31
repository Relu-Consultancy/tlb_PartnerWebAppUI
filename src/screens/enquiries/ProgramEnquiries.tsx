import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Phone, MessageCircle, X, StickyNote, Inbox, Loader2,
    Users, Sparkles, CheckCircle2, GraduationCap, Mail, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen, EnquiryStatus } from '../../types';
import { Pagination } from '../../components/ui/Pagination';
import { getProgramListings, getProgramEnquiries, updateProgramEnquiry } from '../../api/listings';
import { Select } from '../../components/ui';

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

const STATUS_META: Record<EnquiryStatus, { fg: string; bg: string; dot: string }> = {
    new:          { fg: '#059669', bg: '#ECFDF5', dot: '#10B981' },
    contacted:    { fg: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
    enrolled:     { fg: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' },
    trial_booked:         { fg: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' },
    site_visit_scheduled: { fg: '#B45309', bg: '#FFFBEB', dot: '#F59E0B' },
    closed:               { fg: '#4B5563', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const statusStyle = (s: EnquiryStatus) => {
    switch (s) {
        case 'new':       return 'bg-emerald-500 text-white border-emerald-600';
        case 'contacted': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'enrolled':  return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'closed':    return 'bg-gray-100 text-gray-600 border-gray-200';
        default:          return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

const initials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

const avatarTint = (name: string) => {
    const palette = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return palette[h % palette.length];
};

export const ProgramEnquiries: React.FC<Props> = () => {
    const [programs, setPrograms] = useState<ProgramOption[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [leads, setLeads] = useState<ProgramLead[]>([]);
    const [selectedLead, setSelectedLead] = useState<ProgramLead | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<EnquiryStatus | ''>('');
    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [loadingEnquiries, setLoadingEnquiries] = useState(false);

    useEffect(() => {
        loadPrograms();
    }, []);

    useEffect(() => {
        if (selectedProgramId) loadEnquiries(selectedProgramId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const counts = useMemo(() => {
        const c: Record<string, number> = { '': leads.length, new: 0, contacted: 0, enrolled: 0, closed: 0 };
        for (const l of leads) c[l.status] = (c[l.status] || 0) + 1;
        return c;
    }, [leads]);

    const filtered = useMemo(() => [...leads]
        .filter(l =>
            (statusFilter === '' || l.status === statusFilter) &&
            (l.studentName.toLowerCase().includes(search.toLowerCase()) ||
             (l.parentName || '').toLowerCase().includes(search.toLowerCase()) ||
             l.program.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => (a.status === 'new' ? -1 : 1) - (b.status === 'new' ? -1 : 1)),
        [leads, statusFilter, search]);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedLeads = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const isLoading = loadingPrograms || loadingEnquiries;

    const kpiCards: { key: EnquiryStatus | ''; label: string; icon: React.ElementType; fg: string; bg: string }[] = [
        { key: '',          label: 'Total Leads', icon: Users,        fg: '#CA8A04', bg: '#FEFCE8' },
        { key: 'new',       label: 'New',         icon: Sparkles,     fg: STATUS_META.new.fg,       bg: STATUS_META.new.bg },
        { key: 'contacted', label: 'Contacted',   icon: Phone,        fg: STATUS_META.contacted.fg, bg: STATUS_META.contacted.bg },
        { key: 'enrolled',  label: 'Enrolled',    icon: GraduationCap,fg: STATUS_META.enrolled.fg,  bg: STATUS_META.enrolled.bg },
        { key: 'closed',    label: 'Closed',      icon: CheckCircle2, fg: STATUS_META.closed.fg,    bg: STATUS_META.closed.bg },
    ];

    return (
        <>
        <main className="p-5 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Program selector */}
                {programs.length > 1 && (
                    <Select
                        value={selectedProgramId || ''}
                        onChange={(v) => setSelectedProgramId(v)}
                        options={programs.map(p => ({ value: p.id, label: p.title, icon: GraduationCap }))}
                        ariaLabel="Select program"
                        triggerExtra="font-bold"
                    />
                )}

                {/* KPI / quick-filter cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {kpiCards.map(card => {
                        const active = statusFilter === card.key;
                        return (
                            <motion.div
                                key={card.key || 'all'}
                                onClick={() => setStatusFilter(card.key)}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.97 }}
                                className={`cursor-pointer rounded-2xl p-4 border bg-white transition-all ${active ? 'border-tlb-yellow ring-2 ring-tlb-yellow/30 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'}`}
                            >
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{ background: card.bg, color: card.fg }}>
                                    <card.icon size={16} />
                                </div>
                                <p className="text-2xl font-black leading-none text-gray-900">{counts[card.key] ?? 0}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{card.label}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm focus-within:border-tlb-yellow transition-colors">
                        <Search size={18} className="text-gray-400" />
                        <input
                            className="bg-transparent flex-1 text-sm outline-none"
                            placeholder="Search by student, parent, or program..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500"><X size={16} /></button>}
                    </div>
                </div>

                {/* Enquiries Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100">
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Program</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Age</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Received</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
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
                                ) : programs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-300">
                                                <Inbox size={36} />
                                                <p className="text-sm font-bold">No programs found</p>
                                                <p className="text-xs text-gray-400">Create a program listing to start receiving enquiries</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-300">
                                                <Inbox size={36} />
                                                <p className="text-sm font-bold">No enquiries yet</p>
                                                {(search || statusFilter) && (
                                                    <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="text-xs font-black text-tlb-yellow hover:underline">Clear filters</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedLeads.map((lead, i) => (
                                    <motion.tr
                                        key={lead.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                                        onClick={() => setSelectedLead(lead)}
                                        className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${lead.status === 'new' ? 'bg-emerald-50/30' : ''}`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: avatarTint(lead.studentName) }}>
                                                    {initials(lead.studentName)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-gray-900 truncate">{lead.studentName}</span>
                                                        {lead.status === 'new' && (
                                                            <span className="flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                                                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />New
                                                            </span>
                                                        )}
                                                    </div>
                                                    {lead.parentName && <p className="text-[11px] text-gray-400 truncate">Parent: {lead.parentName}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-bold text-gray-800">{lead.program}</span>
                                            {lead.format && (
                                                <span className="text-[10px] text-gray-400 font-bold ml-1.5 bg-gray-100 px-1.5 py-0.5 rounded">{lead.format}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center"><span className="text-sm text-gray-500">{lead.age}</span></td>
                                        <td className="px-5 py-4"><span className="text-[11px] font-bold text-gray-400">{lead.receivedOn}</span></td>
                                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                            {lead.contact ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-black text-gray-700 whitespace-nowrap">{lead.contact}</span>
                                                    <div className="flex gap-1">
                                                        <a href={`tel:${lead.contact}`} title="Call" className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100">
                                                            <Phone size={14} />
                                                        </a>
                                                        <a href={`https://wa.me/91${lead.contact.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp" className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100 transition-colors border border-green-100">
                                                            <MessageCircle size={14} />
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No contact</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                            <Select
                                                value={lead.status}
                                                onChange={(v) => updateStatus(lead.id, lead.listingId, v as EnquiryStatus)}
                                                options={STATUS_OPTIONS}
                                                ariaLabel="Lead status"
                                                align="right"
                                                className="inline-block"
                                                buttonClassName={`inline-flex items-center gap-1.5 text-xs font-bold rounded-xl px-3 py-2 border outline-none cursor-pointer transition-all shadow-sm ${statusStyle(lead.status)}`}
                                            />
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filtered.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </main>

        {/* Lead Detail Slide-out */}
        <AnimatePresence>
        {selectedLead && (
            <>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelectedLead(null)}
                />
                <motion.div
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col"
                >
                    <div className="relative p-6 pb-7 bg-gradient-to-br from-gray-900 to-gray-700 text-white">
                        <button onClick={() => setSelectedLead(null)} className="absolute top-5 right-5 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0" style={{ background: avatarTint(selectedLead.studentName) }}>
                                {initials(selectedLead.studentName)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xl font-black truncate">{selectedLead.studentName}</p>
                                {selectedLead.parentName && <p className="text-sm text-white/60 truncate">Parent: {selectedLead.parentName}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-6 space-y-5 -mt-3 bg-white rounded-t-3xl">
                        {/* Status segmented control */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                {STATUS_OPTIONS.map(opt => {
                                    const active = selectedLead.status === opt.value;
                                    const m = STATUS_META[opt.value];
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateStatus(selectedLead.id, selectedLead.listingId, opt.value)}
                                            className="px-3 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5"
                                            style={active
                                                ? { background: m.bg, color: m.fg, borderColor: m.dot }
                                                : { background: '#fff', color: '#9CA3AF', borderColor: '#F3F4F6' }}
                                        >
                                            {active && <Check size={13} />}{opt.label}
                                        </button>
                                    );
                                })}
                            </div>
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
                            {selectedLead.email && (
                                <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400 shrink-0" />
                                    <span className="text-sm font-bold truncate">{selectedLead.email}</span>
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
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <StickyNote size={12} /> Internal Notes
                            </label>
                            <textarea
                                className="tlb-input w-full min-h-[96px] resize-y"
                                placeholder="Add your notes here..."
                                defaultValue={selectedLead.notes}
                                onBlur={(e) => updateNotes(selectedLead.id, selectedLead.listingId, e.target.value)}
                            />
                        </div>

                        {selectedLead.contact ? (
                            <div className="space-y-3">
                                <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    <span className="text-sm font-black">{selectedLead.contact}</span>
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
                            <div className="bg-gray-50 rounded-xl px-4 py-3 text-center text-xs font-bold text-gray-400">No contact information available</div>
                        )}
                    </div>
                </motion.div>
            </>
        )}
        </AnimatePresence>
        </>
    );
};
