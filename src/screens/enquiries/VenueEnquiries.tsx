import React, { useState, useEffect, useMemo } from 'react';
import {
    Menu, Search, Filter, Lock, Phone, MessageCircle, X, StickyNote, Inbox, Loader2,
    Users, Sparkles, CheckCircle2, CalendarClock, Check, Mail, Clock,
    IndianRupee, ClipboardList, Calendar, MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../types';
import { toast, Select } from '../../components/ui';
import { getVenueEnquiries, getVenueEnquiryDetail, updateVenueEnquiry, unlockVenueEnquiry } from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

type VenueEnquiryStatus = 'new' | 'contacted' | 'site_visit_scheduled' | 'closed';

interface ProjectDetails {
    occasion: string | null;
    guest_count: number | null;
    event_date: string | null;
    budget: string | null;
    duration_hours: number | null;
    requirements: string | null;
    message: string | null;
    preferred_slot: { id: number; date: string; start_time: string; end_time: string } | null;
}

interface Lead {
    id: string;
    venueTitle: string;
    customerName: string;
    email?: string;
    occasion?: string;
    guests: string;
    eventDate?: string;
    dateTime: string;
    contact: string;
    isUnlocked: boolean;
    status: VenueEnquiryStatus;
    message?: string;
    notes: string;
    respondedAt?: string;
    projectDetails?: ProjectDetails;
}

const STATUS_OPTIONS: { value: VenueEnquiryStatus; label: string }[] = [
    { value: 'new',                   label: 'New' },
    { value: 'contacted',             label: 'Contacted' },
    { value: 'site_visit_scheduled',  label: 'Site Visit' },
    { value: 'closed',                label: 'Closed' },
];

const STATUS_META: Record<VenueEnquiryStatus, { fg: string; bg: string; dot: string }> = {
    new:                   { fg: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
    contacted:             { fg: '#059669', bg: '#ECFDF5', dot: '#10B981' },
    site_visit_scheduled:  { fg: '#B45309', bg: '#FFFBEB', dot: '#F59E0B' },
    closed:                { fg: '#4B5563', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const statusStyle = (s: VenueEnquiryStatus) => {
    switch (s) {
        case 'new':                   return 'bg-blue-500 text-white border-blue-600';
        case 'contacted':             return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'site_visit_scheduled':  return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'closed':                return 'bg-gray-100 text-gray-600 border-gray-200';
        default:                      return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

const initials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

const avatarTint = (name: string) => {
    const palette = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return palette[h % palette.length];
};

const fmtDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtCurrency = (val?: string | null) => {
    if (!val) return null;
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const fmtTime = (t?: string | null) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const normalizeStatus = (s: string): VenueEnquiryStatus => {
    if (['new', 'contacted', 'site_visit_scheduled', 'closed'].includes(s)) return s as VenueEnquiryStatus;
    if (s === 'trial_booked') return 'site_visit_scheduled';
    return 'new';
};

const parseLead = (item: any): Lead => ({
    id: String(item.id),
    venueTitle: item.venue_title || item.listing_title || item.listing?.title || '',
    customerName: item.customer_name || item.name || item.contact_name || 'Unknown',
    email: item.email || undefined,
    occasion: item.occasion || item.project_details?.occasion || undefined,
    guests: item.guest_count != null ? String(item.guest_count) : (item.project_details?.guest_count != null ? String(item.project_details.guest_count) : 'N/A'),
    eventDate: fmtDate(item.event_date || item.project_details?.event_date) || undefined,
    dateTime: item.created_at ? new Date(item.created_at).toLocaleString() : '',
    contact: item.mobile || item.contact_number || 'Hidden',
    isUnlocked: !!item.is_contact_unlocked,
    status: normalizeStatus(item.status || 'new'),
    message: item.message || item.project_details?.message || undefined,
    notes: item.internal_notes || '',
    respondedAt: item.responded_at || undefined,
    projectDetails: item.project_details || undefined,
});

export const VenueEnquiries: React.FC<Props> = ({ onOpenSidebar }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<VenueEnquiryStatus | ''>('');
    const [showFilter, setShowFilter] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { loadEnquiries(); }, []);

    const loadEnquiries = async () => {
        try {
            setIsLoading(true);
            const res = await getVenueEnquiries();
            const raw: any[] = Array.isArray(res) ? res : (res.data?.results || res.data || res.results || []);
            setLeads(raw.map(parseLead));
        } catch (e) {
            console.error('Failed to load venue enquiries', e);
        } finally {
            setIsLoading(false);
        }
    };

    const openDetail = async (lead: Lead) => {
        setSelectedLead(lead);
        setDetailLoading(true);
        try {
            const res = await getVenueEnquiryDetail(lead.id);
            const item = res.data || res;
            const full = parseLead(item);
            setSelectedLead(full);
        } catch {
            // keep the list-level data if detail fetch fails
        } finally {
            setDetailLoading(false);
        }
    };

    const unlockLead = async (id: string) => {
        try {
            const res = await unlockVenueEnquiry(id);
            const item = res.data || res;
            const patch: Partial<Lead> = {
                isUnlocked: !!item.is_contact_unlocked,
                contact: item.mobile || item.contact_number || 'Hidden',
            };
            setLeads(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
            if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, ...patch } : prev);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to unlock contact. Please try again.');
        }
    };

    const updateStatus = async (id: string, status: VenueEnquiryStatus) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : prev);
        try {
            await updateVenueEnquiry(id, { status });
        } catch {
            loadEnquiries();
        }
    };

    const updateNotes = async (id: string, notes: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
        if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, notes } : prev);
        try {
            await updateVenueEnquiry(id, { internal_notes: notes });
        } catch {
            loadEnquiries();
        }
    };

    const counts = useMemo(() => {
        const c: Record<string, number> = { '': leads.length, new: 0, contacted: 0, site_visit_scheduled: 0, closed: 0 };
        for (const l of leads) c[l.status] = (c[l.status] || 0) + 1;
        return c;
    }, [leads]);

    const filtered = leads.filter(l =>
        (statusFilter === '' || l.status === statusFilter) &&
        (l.customerName.toLowerCase().includes(search.toLowerCase()) ||
         l.venueTitle.toLowerCase().includes(search.toLowerCase()))
    );

    const kpiCards: { key: VenueEnquiryStatus | ''; label: string; icon: React.ElementType; fg: string; bg: string }[] = [
        { key: '',                     label: 'Total Leads',  icon: Users,         fg: '#B45309', bg: '#FFFBEB' },
        { key: 'new',                  label: 'New',          icon: Sparkles,      fg: STATUS_META.new.fg,                  bg: STATUS_META.new.bg },
        { key: 'contacted',            label: 'Contacted',    icon: Phone,         fg: STATUS_META.contacted.fg,            bg: STATUS_META.contacted.bg },
        { key: 'site_visit_scheduled', label: 'Site Visit',   icon: CalendarClock, fg: STATUS_META.site_visit_scheduled.fg, bg: STATUS_META.site_visit_scheduled.bg },
        { key: 'closed',               label: 'Closed',       icon: CheckCircle2,  fg: STATUS_META.closed.fg,               bg: STATUS_META.closed.bg },
    ];

    const pd = selectedLead?.projectDetails;
    const hasBrief = pd && (pd.occasion || pd.guest_count || pd.event_date || pd.budget || pd.duration_hours || pd.requirements);

    return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white/90 backdrop-blur-sm px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
            <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
            <div className="flex-1">
                <h1 className="tlb-page-title">Venue Enquiries</h1>
                <p className="tlb-page-sub">Manage venue booking leads</p>
            </div>
        </header>

        <main className="p-5 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* KPI / quick-filter cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {kpiCards.map(card => {
                        const active = statusFilter === card.key;
                        return (
                            <motion.div
                                key={card.key || 'all'}
                                onClick={() => setStatusFilter(card.key as any)}
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

                {/* Search + Filter */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm focus-within:border-tlb-yellow transition-colors">
                        <Search size={18} className="text-gray-400" />
                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search by customer or venue name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500"><X size={16} /></button>}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`bg-white border p-3 rounded-2xl shadow-sm transition-colors ${statusFilter ? 'border-tlb-yellow text-tlb-yellow' : 'border-gray-100 text-gray-400 hover:text-gray-600'}`}
                        >
                            <Filter size={18} />
                        </button>
                        <AnimatePresence>
                        {showFilter && (
                            <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-2 min-w-[170px]"
                            >
                                <button
                                    onClick={() => { setStatusFilter(''); setShowFilter(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${!statusFilter ? 'bg-tlb-yellow/10 text-tlb-yellow' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    All Statuses {!statusFilter && <Check size={13} />}
                                </button>
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setStatusFilter(opt.value); setShowFilter(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${statusFilter === opt.value ? 'bg-tlb-yellow/10 text-tlb-yellow' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {opt.label} {statusFilter === opt.value && <Check size={13} />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Enquiries Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Venue / Occasion</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Guests</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Received</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
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
                                                {(search || statusFilter) && (
                                                    <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="text-xs font-black text-tlb-yellow hover:underline">Clear filters</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map((lead, i) => (
                                    <motion.tr
                                        key={lead.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                                        onClick={() => openDetail(lead)}
                                        className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${lead.status === 'new' ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: avatarTint(lead.customerName) }}>
                                                    {initials(lead.customerName)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-gray-900 truncate">{lead.customerName}</span>
                                                        {lead.status === 'new' && (
                                                            <span className="flex items-center gap-1 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                                                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />New
                                                            </span>
                                                        )}
                                                    </div>
                                                    {lead.eventDate && <p className="text-[11px] text-gray-400 truncate">Event: {lead.eventDate}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.venueTitle && <p className="text-xs font-bold text-gray-700">{lead.venueTitle}</p>}
                                            <p className="text-xs text-gray-400">{lead.occasion || 'General enquiry'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center"><span className="text-sm text-gray-500">{lead.guests}</span></td>
                                        <td className="px-6 py-4"><span className="text-[11px] font-bold text-gray-400">{lead.dateTime}</span></td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            {!lead.isUnlocked ? (
                                                <button
                                                    onClick={() => unlockLead(lead.id)}
                                                    className="bg-tlb-yellow/10 text-tlb-yellow px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black border border-tlb-yellow/20 hover:bg-tlb-yellow/20 transition-all"
                                                >
                                                    <Lock size={14} /> Unlock
                                                </button>
                                            ) : (
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
                                            )}
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <Select
                                                value={lead.status}
                                                onChange={(v) => updateStatus(lead.id, v as VenueEnquiryStatus)}
                                                options={STATUS_OPTIONS as any}
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
                </div>
            </div>
        </main>

        {/* Slide-out Lead Detail */}
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
                    className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-white z-50 shadow-2xl flex flex-col"
                >
                    {/* Gradient header */}
                    <div className="relative p-6 pb-7 bg-gradient-to-br from-gray-900 to-gray-700 text-white shrink-0">
                        <button onClick={() => setSelectedLead(null)} className="absolute top-5 right-5 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0" style={{ background: avatarTint(selectedLead.customerName) }}>
                                {initials(selectedLead.customerName)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xl font-black truncate">{selectedLead.customerName}</p>
                                {selectedLead.venueTitle && <p className="text-sm text-white/60 truncate">{selectedLead.venueTitle}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-6 space-y-5 -mt-3 bg-white rounded-t-3xl">
                        {detailLoading && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 size={18} className="text-gray-300 animate-spin" />
                            </div>
                        )}

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
                                            onClick={() => updateStatus(selectedLead.id, opt.value)}
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

                        {/* Project Details Card */}
                        {hasBrief && (
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-3">
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                                    <ClipboardList size={12} /> Project Brief
                                </p>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {pd!.occasion && (
                                        <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100/60">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Occasion</p>
                                            <p className="text-sm font-bold text-gray-800 mt-0.5">{pd!.occasion}</p>
                                        </div>
                                    )}
                                    {pd!.guest_count && (
                                        <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100/60">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Users size={10} /> Guests</p>
                                            <p className="text-sm font-bold text-gray-800 mt-0.5">{pd!.guest_count}</p>
                                        </div>
                                    )}
                                    {pd!.event_date && (
                                        <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100/60">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10} /> Event Date</p>
                                            <p className="text-sm font-bold text-gray-800 mt-0.5">{fmtDate(pd!.event_date)}</p>
                                        </div>
                                    )}
                                    {pd!.budget && (
                                        <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100/60">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><IndianRupee size={10} /> Budget</p>
                                            <p className="text-sm font-bold text-gray-800 mt-0.5">{fmtCurrency(pd!.budget)}</p>
                                        </div>
                                    )}
                                    {pd!.duration_hours && (
                                        <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100/60">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> Duration</p>
                                            <p className="text-sm font-bold text-gray-800 mt-0.5">{pd!.duration_hours}h</p>
                                        </div>
                                    )}
                                </div>
                                {pd!.requirements && (
                                    <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100/60">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Requirements</p>
                                        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{pd!.requirements}</p>
                                    </div>
                                )}
                                {pd!.preferred_slot && (
                                    <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100/60">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={10} /> Preferred Slot</p>
                                        <p className="text-sm font-bold text-gray-800 mt-0.5">
                                            {fmtDate(pd!.preferred_slot.date)} &middot; {fmtTime(pd!.preferred_slot.start_time)} - {fmtTime(pd!.preferred_slot.end_time)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Basic details (when no project brief) */}
                        {!hasBrief && (
                            <div className="space-y-3">
                                {selectedLead.venueTitle && (
                                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Venue</p>
                                        <p className="text-sm font-bold mt-0.5">{selectedLead.venueTitle}</p>
                                    </div>
                                )}
                                {selectedLead.occasion && (
                                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Occasion</p>
                                        <p className="text-sm font-bold mt-0.5">{selectedLead.occasion}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guests</p>
                                        <p className="text-sm font-bold mt-0.5">{selectedLead.guests}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Event Date</p>
                                        <p className="text-sm font-bold mt-0.5">{selectedLead.eventDate || '--'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Enquiry date & responded */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Received</p>
                                <p className="text-sm font-bold mt-0.5">{selectedLead.dateTime}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Responded</p>
                                <p className="text-sm font-bold mt-0.5">{selectedLead.respondedAt ? fmtDate(selectedLead.respondedAt) : 'Not yet'}</p>
                            </div>
                        </div>

                        {/* Email */}
                        {selectedLead.email && (
                            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                                <Mail size={14} className="text-gray-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                                    <p className="text-sm font-bold mt-0.5 truncate">{selectedLead.email}</p>
                                </div>
                            </div>
                        )}

                        {selectedLead.message && (
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Message</p>
                                <p className="text-sm text-amber-900 italic">"{selectedLead.message}"</p>
                            </div>
                        )}

                        {/* Internal Notes */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <StickyNote size={12} /> Internal Notes
                            </label>
                            <textarea
                                className="tlb-input w-full min-h-[96px] resize-y"
                                placeholder="Add your notes here..."
                                defaultValue={selectedLead.notes}
                                onBlur={(e) => updateNotes(selectedLead.id, e.target.value)}
                            />
                        </div>

                        {/* Contact Actions */}
                        {selectedLead.isUnlocked ? (
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
                            <button
                                onClick={() => unlockLead(selectedLead.id)}
                                className="w-full bg-tlb-yellow text-tlb-dark py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:brightness-95 transition-all"
                            >
                                <Lock size={16} /> Unlock Contact Info
                            </button>
                        )}
                    </div>
                </motion.div>
            </>
        )}
        </AnimatePresence>
    </div>
    );
};
