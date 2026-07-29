import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
    Menu, ArrowLeft, Plus, LifeBuoy, Search, RefreshCw, AlertCircle,
    Send, CheckCircle2, MessageSquare, Clock, Lock, Ticket as TicketIcon,
    Share2, ChevronRight,
} from 'lucide-react';
import { Screen } from '../../types';
import { Select, SelectOption, toast } from '../../components/ui';
import {
    listTickets, getTicket, createTicket, closeTicket,
    getTicketMessages, sendTicketMessage, getTicketCategories, ticketCategoryLabel,
    listSharedTickets, getSharedTicket, getSharedTicketMessages, sendSharedTicketMessage,
    TicketListItem, Ticket, TicketMessage, TicketCategory,
    SharedTicketListItem, SharedTicketDetail,
} from '../../api/help';
import { getBookings } from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

type Tab = 'my' | 'shared';

// ---------------------------------------------------------------------------
// Status styling
// ---------------------------------------------------------------------------
const STATUS_STYLE: Record<string, { label: string; cls: string; dot: string }> = {
    open:        { label: 'Open',        cls: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
    pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
    in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
    resolved:    { label: 'Resolved',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    closed:      { label: 'Closed',      cls: 'bg-gray-100 text-gray-500 border-gray-200',      dot: 'bg-gray-400' },
};
const statusStyle = (s: string) => STATUS_STYLE[s] || { label: s.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };

const isStaff = (role: string) => ['admin', 'support', 'staff'].includes(role);
const isClosed = (s?: string) => s === 'closed' || s === 'resolved';

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const toCount = (v: number | string | undefined) => {
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) && (n as number) > 0 ? (n as number) : 0;
};

const ROLE_LABEL: Record<string, string> = {
    customer: 'Customer',
    admin: 'Admin',
    support: 'TLB Support',
    staff: 'TLB Support',
};

export const Support: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [activeTab, setActiveTab] = useState<Tab>('my');

    // ── My Tickets state ──
    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');

    const [categories, setCategories] = useState<TicketCategory[]>([]);
    const [bookingOptions, setBookingOptions] = useState<SelectOption[]>([]);

    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ subject: '', category: '', body: '', bookingId: '' });
    const [formErrors, setFormErrors] = useState<{ subject?: string; category?: string; body?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [closing, setClosing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const lastTsRef = useRef<string | undefined>(undefined);
    const bottomRef = useRef<HTMLDivElement>(null);

    // ── Shared Queries state ──
    const [sharedTickets, setSharedTickets] = useState<SharedTicketListItem[]>([]);
    const [loadingShared, setLoadingShared] = useState(true);
    const [sharedError, setSharedError] = useState<string | null>(null);
    const [sharedQuery, setSharedQuery] = useState('');

    const [sharedSelectedId, setSharedSelectedId] = useState<string | null>(null);
    const [sharedDetail, setSharedDetail] = useState<SharedTicketDetail | null>(null);
    const [sharedMessages, setSharedMessages] = useState<TicketMessage[]>([]);
    const [loadingSharedDetail, setLoadingSharedDetail] = useState(false);
    const [sharedReply, setSharedReply] = useState('');
    const [sendingShared, setSendingShared] = useState(false);
    const [refreshingShared, setRefreshingShared] = useState(false);

    const sharedLastTsRef = useRef<string | undefined>(undefined);
    const sharedBottomRef = useRef<HTMLDivElement>(null);

    // ── Load my tickets + categories on mount ──
    const loadList = async () => {
        setLoadingList(true);
        setListError(null);
        try {
            setTickets(await listTickets());
        } catch (e: any) {
            setListError(e?.message || 'Failed to load tickets');
        } finally {
            setLoadingList(false);
        }
    };

    const loadSharedList = async () => {
        setLoadingShared(true);
        setSharedError(null);
        try {
            setSharedTickets(await listSharedTickets());
        } catch (e: any) {
            setSharedError(e?.message || 'Failed to load shared queries');
        } finally {
            setLoadingShared(false);
        }
    };

    useEffect(() => {
        loadList();
        loadSharedList();
        getTicketCategories().then(setCategories).catch(() => {});
        getBookings()
            .then((res: any) => {
                const d = res?.data || res;
                const list = d?.results || d || [];
                const opts: SelectOption[] = [{ value: '', label: 'No booking' }];
                (Array.isArray(list) ? list : []).forEach((b: any) => {
                    if (b?.id) opts.push({ value: String(b.id), label: b.booking_reference || String(b.id).slice(0, 8) });
                });
                setBookingOptions(opts);
            })
            .catch(() => setBookingOptions([{ value: '', label: 'No booking' }]));
    }, []);

    // ── Poll my ticket messages ──
    useEffect(() => {
        if (!selectedId) return;
        const status = detail?.status;
        if (status === 'closed') return;
        const intervalMs = status === 'in_progress' ? 5000 : status === 'resolved' ? 60000 : 30000;
        const poll = async () => {
            try {
                const { messages: msgs, ticket_status } = await getTicketMessages(selectedId, lastTsRef.current);
                if (msgs.length) {
                    setMessages(prev => {
                        const seen = new Set(prev.map(m => m.id));
                        const fresh = msgs.filter(m => !seen.has(m.id));
                        return fresh.length ? [...prev, ...fresh] : prev;
                    });
                    lastTsRef.current = msgs[msgs.length - 1].created_at;
                }
                if (ticket_status && ticket_status !== detail?.status) {
                    setDetail(prev => prev ? { ...prev, status: ticket_status } : prev);
                }
            } catch { /* silent during polling */ }
        };
        const iv = setInterval(poll, intervalMs);
        return () => clearInterval(iv);
    }, [selectedId, detail?.status]);

    // ── Poll shared ticket messages ──
    useEffect(() => {
        if (!sharedSelectedId) return;
        const status = sharedDetail?.ticket_status || sharedDetail?.ticket?.status;
        if (status === 'closed') return;
        const intervalMs = status === 'in_progress' ? 5000 : status === 'resolved' ? 60000 : 30000;
        const poll = async () => {
            try {
                const { messages: msgs, ticket_status } = await getSharedTicketMessages(sharedSelectedId, sharedLastTsRef.current);
                if (msgs.length) {
                    setSharedMessages(prev => {
                        const seen = new Set(prev.map(m => m.id));
                        const fresh = msgs.filter(m => !seen.has(m.id));
                        return fresh.length ? [...prev, ...fresh] : prev;
                    });
                    sharedLastTsRef.current = msgs[msgs.length - 1].created_at;
                }
                if (ticket_status && sharedDetail) {
                    setSharedDetail(prev => prev ? { ...prev, ticket_status } : prev);
                }
            } catch { /* silent during polling */ }
        };
        const iv = setInterval(poll, intervalMs);
        return () => clearInterval(iv);
    }, [sharedSelectedId, sharedDetail?.ticket_status, sharedDetail?.ticket?.status]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages.length]);
    useEffect(() => {
        sharedBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [sharedMessages.length]);

    // ── My ticket handlers ──
    const openTicket = async (id: string) => {
        setSelectedId(id);
        setDetail(null);
        setMessages([]);
        setReply('');
        lastTsRef.current = undefined;
        setLoadingDetail(true);
        try {
            const [t, msgsRes] = await Promise.all([getTicket(id), getTicketMessages(id)]);
            setDetail(msgsRes.ticket_status ? { ...t, status: msgsRes.ticket_status } : t);
            setMessages(msgsRes.messages);
            lastTsRef.current = msgsRes.messages.length ? msgsRes.messages[msgsRes.messages.length - 1].created_at : undefined;
            setTickets(prev => prev.map(tk => tk.id === id ? { ...tk, unread_count: 0 } : tk));
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load ticket');
            setSelectedId(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    const refreshMessages = async () => {
        if (!selectedId) return;
        setRefreshing(true);
        try {
            const { messages: msgs, ticket_status } = await getTicketMessages(selectedId, lastTsRef.current);
            if (msgs.length) {
                setMessages(prev => {
                    const seen = new Set(prev.map(m => m.id));
                    const fresh = msgs.filter(m => !seen.has(m.id));
                    return fresh.length ? [...prev, ...fresh] : prev;
                });
                lastTsRef.current = msgs[msgs.length - 1].created_at;
            }
            if (ticket_status && ticket_status !== detail?.status) {
                setDetail(prev => prev ? { ...prev, status: ticket_status } : prev);
            }
        } catch (e: any) {
            toast.error(e?.message || 'Failed to refresh messages');
        } finally {
            setRefreshing(false);
        }
    };

    const backToList = () => {
        setSelectedId(null);
        setDetail(null);
        setMessages([]);
        loadList();
    };

    const openNew = () => {
        setForm({ subject: '', category: categories[0]?.value || '', body: '', bookingId: '' });
        setFormErrors({});
        setCreating(true);
    };

    const submitNew = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const errs: typeof formErrors = {};
        if (!form.subject.trim()) errs.subject = 'Subject is required.';
        if (!form.category) errs.category = 'Pick a category.';
        if (!form.body.trim()) errs.body = 'Describe your issue.';
        setFormErrors(errs);
        if (Object.keys(errs).length) return;
        setSubmitting(true);
        try {
            const t = await createTicket({
                subject: form.subject.trim(),
                category: form.category,
                body: form.body.trim(),
                booking_id: form.bookingId || undefined,
            });
            toast.success('Support ticket raised.');
            setCreating(false);
            await loadList();
            openTicket(t.id);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to raise ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const sendReply = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const body = reply.trim();
        if (!body || !selectedId) return;
        setSending(true);
        try {
            const msg = await sendTicketMessage(selectedId, body);
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            lastTsRef.current = msg.created_at;
            setReply('');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleClose = async () => {
        if (!selectedId) return;
        setClosing(true);
        try {
            const t = await closeTicket(selectedId);
            setDetail(t);
            setTickets(prev => prev.map(tk => tk.id === selectedId ? { ...tk, status: t.status } : tk));
            toast.success('Ticket closed.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to close ticket');
        } finally {
            setClosing(false);
        }
    };

    // ── Shared ticket handlers ──
    const openSharedTicket = async (id: string) => {
        setSharedSelectedId(id);
        setSharedDetail(null);
        setSharedMessages([]);
        setSharedReply('');
        sharedLastTsRef.current = undefined;
        setLoadingSharedDetail(true);
        try {
            const data = await getSharedTicket(id);
            setSharedDetail(data);
            setSharedMessages(data.messages || []);
            if (data.messages?.length) {
                sharedLastTsRef.current = data.messages[data.messages.length - 1].created_at;
            }
            setSharedTickets(prev => prev.map(tk => tk.id === id ? { ...tk, unread_count: 0 } : tk));
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load shared query');
            setSharedSelectedId(null);
        } finally {
            setLoadingSharedDetail(false);
        }
    };

    const refreshSharedMessages = async () => {
        if (!sharedSelectedId) return;
        setRefreshingShared(true);
        try {
            const { messages: msgs, ticket_status } = await getSharedTicketMessages(sharedSelectedId, sharedLastTsRef.current);
            if (msgs.length) {
                setSharedMessages(prev => {
                    const seen = new Set(prev.map(m => m.id));
                    const fresh = msgs.filter(m => !seen.has(m.id));
                    return fresh.length ? [...prev, ...fresh] : prev;
                });
                sharedLastTsRef.current = msgs[msgs.length - 1].created_at;
            }
            if (ticket_status && sharedDetail) {
                setSharedDetail(prev => prev ? { ...prev, ticket_status } : prev);
            }
        } catch (e: any) {
            toast.error(e?.message || 'Failed to refresh messages');
        } finally {
            setRefreshingShared(false);
        }
    };

    const sendSharedReply = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const body = sharedReply.trim();
        if (!body || !sharedSelectedId) return;
        setSendingShared(true);
        try {
            const msg = await sendSharedTicketMessage(sharedSelectedId, body);
            setSharedMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            sharedLastTsRef.current = msg.created_at;
            setSharedReply('');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to send message');
        } finally {
            setSendingShared(false);
        }
    };

    const backToSharedList = () => {
        setSharedSelectedId(null);
        setSharedDetail(null);
        setSharedMessages([]);
        loadSharedList();
    };

    // ── Filters ──
    const matchesStatus = (s: string) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'open') return s === 'open' || s === 'pending';
        return s === statusFilter;
    };
    const filtered = tickets.filter(t => {
        if (!matchesStatus(t.status)) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return t.subject.toLowerCase().includes(q) || ticketCategoryLabel(t.category).toLowerCase().includes(q);
    });

    // KPI counts across all my tickets
    const activeCount = tickets.filter(t => !isClosed(t.status)).length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
    const closedCount = tickets.filter(t => t.status === 'closed').length;

    const filteredShared = sharedTickets.filter(t => {
        const q = sharedQuery.trim().toLowerCase();
        if (!q) return true;
        return t.subject.toLowerCase().includes(q)
            || ticketCategoryLabel(t.category).toLowerCase().includes(q)
            || (t.booking_reference || '').toLowerCase().includes(q);
    });

    const sharedUnread = sharedTickets.reduce((s, t) => s + toCount(t.unread_count), 0);

    const isInDetail = activeTab === 'my' ? !!selectedId : !!sharedSelectedId;

    // -----------------------------------------------------------------------
    // Header
    // -----------------------------------------------------------------------
    const headerTitle = () => {
        if (creating) return 'Raise a Ticket';
        if (activeTab === 'my' && detail) return detail.subject;
        if (activeTab === 'shared' && sharedDetail) return sharedDetail.ticket.subject;
        return 'Help & Support';
    };
    const headerSub = () => {
        if (creating) return 'Tell us what you need help with';
        if (activeTab === 'my' && detail) {
            return `${ticketCategoryLabel(detail.category)}${detail.booking_reference ? ` · ${detail.booking_reference}` : ''}`;
        }
        if (activeTab === 'shared' && sharedDetail) {
            const t = sharedDetail.ticket;
            return `${ticketCategoryLabel(t.category)}${t.booking_reference ? ` · ${t.booking_reference}` : ''}`;
        }
        return 'Raise tickets and chat with the TLB team';
    };

    const header = (
        <header className="bg-white/90 backdrop-blur-sm px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
            {(creating || isInDetail) ? (
                <button
                    onClick={() => {
                        if (creating) setCreating(false);
                        else if (activeTab === 'my') backToList();
                        else backToSharedList();
                    }}
                    className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-900"
                    aria-label="Back"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline text-sm font-bold">Support</span>
                </button>
            ) : (
                <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
            )}
            <div className="flex-1 min-w-0">
                <h1 className="tlb-page-title truncate">{headerTitle()}</h1>
                <p className="tlb-page-sub">{headerSub()}</p>
            </div>
            {!creating && !isInDetail && activeTab === 'my' && (
                <button onClick={openNew} className="tlb-button hidden sm:inline-flex">
                    <Plus size={18} /> New Ticket
                </button>
            )}
        </header>
    );

    // -----------------------------------------------------------------------
    // Tab bar (only shown in list view)
    // -----------------------------------------------------------------------
    const tabBar = !creating && !isInDetail && (
        <div className="bg-white border-b border-gray-100 px-5 md:px-8">
            <div className="max-w-5xl mx-auto flex gap-1">
                {([
                    { key: 'my' as Tab, label: 'My Tickets', icon: <TicketIcon size={14} />, badge: 0 },
                    { key: 'shared' as Tab, label: 'Shared Queries', icon: <Share2 size={14} />, badge: sharedUnread },
                ]).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b-2 ${
                            activeTab === tab.key
                                ? 'border-tlb-yellow text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab.icon} {tab.label}
                        {tab.badge > 0 && (
                            <span className="text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5 leading-none">{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );

    // -----------------------------------------------------------------------
    // New ticket form
    // -----------------------------------------------------------------------
    if (creating) {
        const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2';
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                {header}
                <main className="p-5 md:p-6">
                    <form onSubmit={submitNew} className="max-w-2xl mx-auto space-y-6">
                        <div className="tlb-card space-y-5">
                            <div>
                                <label className={labelCls}>Subject *</label>
                                <input
                                    type="text" value={form.subject}
                                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                    placeholder="Brief summary of your issue"
                                    className={`tlb-input ${formErrors.subject ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                />
                                {formErrors.subject && <p className="text-xs text-red-500 mt-1.5">{formErrors.subject}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Category *</label>
                                    <Select
                                        value={form.category}
                                        onChange={v => setForm(f => ({ ...f, category: v }))}
                                        options={categories}
                                        placeholder="Select a category"
                                        ariaLabel="Ticket category"
                                        triggerExtra={formErrors.category ? 'border-red-300 ring-1 ring-red-200' : ''}
                                    />
                                    {formErrors.category && <p className="text-xs text-red-500 mt-1.5">{formErrors.category}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>Related Booking (optional)</label>
                                    <Select
                                        value={form.bookingId}
                                        onChange={v => setForm(f => ({ ...f, bookingId: v }))}
                                        options={bookingOptions.length ? bookingOptions : [{ value: '', label: 'No booking' }]}
                                        placeholder="Link a booking"
                                        ariaLabel="Related booking"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Description *</label>
                                <textarea
                                    rows={6} value={form.body}
                                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                    placeholder="Describe the issue in detail…"
                                    className={`tlb-input resize-none ${formErrors.body ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                />
                                {formErrors.body && <p className="text-xs text-red-500 mt-1.5">{formErrors.body}</p>}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setCreating(false)}
                                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting} className="tlb-button flex-1 py-3.5 disabled:opacity-60">
                                {submitting
                                    ? <><span className="w-4 h-4 border-2 border-tlb-dark/30 border-t-tlb-dark rounded-full animate-spin" /> Submitting…</>
                                    : <><LifeBuoy size={18} /> Submit Ticket</>}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // My Ticket detail (conversation)
    // -----------------------------------------------------------------------
    if (selectedId && activeTab === 'my') {
        const closed = isClosed(detail?.status);
        const st = detail ? statusStyle(detail.status) : null;
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
                {header}
                {loadingDetail ? (
                    <div className="flex-1 flex items-center justify-center">
                        <RefreshCw size={26} className="text-gray-300 animate-spin" />
                    </div>
                ) : (
                    <>
                        {detail && st && (
                            <div className="bg-white border-b border-gray-100 px-5 md:px-8 py-3 flex items-center gap-3 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.cls}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                                </span>
                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                                    <Clock size={12} /> Opened {fmtDate(detail.created_at)}
                                </span>
                                <div className="ml-auto flex items-center gap-2">
                                    <button onClick={refreshMessages} disabled={refreshing}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        title="Refresh messages">
                                        <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
                                    </button>
                                    {!closed ? (
                                        <button onClick={handleClose} disabled={closing}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
                                            {closing ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Close Ticket
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                                            <Lock size={12} /> Closed
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                            <div className="max-w-3xl mx-auto space-y-3">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                                        <MessageSquare size={30} className="text-gray-200" />
                                        <p className="text-sm font-bold text-gray-400">No messages yet — start the conversation below.</p>
                                    </div>
                                ) : messages.map(m => {
                                    const mine = !isStaff(m.sender_role);
                                    return (
                                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-tlb-yellow text-tlb-dark rounded-br-md' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'}`}>
                                                {!mine && (
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">TLB Support</p>
                                                )}
                                                <p className="text-sm leading-snug whitespace-pre-wrap break-words">{m.body}</p>
                                                <p className={`text-[10px] mt-1 ${mine ? 'text-tlb-dark/50' : 'text-gray-400'}`}>{fmtTime(m.created_at)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>
                        </div>

                        <div className="bg-white border-t border-gray-100 px-4 md:px-8 py-4">
                            {closed ? (
                                <p className="max-w-3xl mx-auto text-center text-sm font-bold text-gray-400 flex items-center justify-center gap-2">
                                    <Lock size={14} /> This ticket is closed.
                                </p>
                            ) : (
                                <form onSubmit={sendReply} className="max-w-3xl mx-auto flex items-end gap-3">
                                    <textarea
                                        rows={1} value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e); } }}
                                        placeholder="Type your message…"
                                        className="flex-1 tlb-input resize-none max-h-32 py-3"
                                    />
                                    <button type="submit" disabled={sending || !reply.trim()}
                                        className="tlb-button !px-4 py-3 shrink-0 disabled:opacity-50">
                                        {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // Shared query detail (three-party conversation)
    // -----------------------------------------------------------------------
    if (sharedSelectedId && activeTab === 'shared') {
        const ticket = sharedDetail?.ticket;
        const status = sharedDetail?.ticket_status || ticket?.status || '';
        const closed = isClosed(status);
        const st = statusStyle(status);
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
                {header}
                {loadingSharedDetail ? (
                    <div className="flex-1 flex items-center justify-center">
                        <RefreshCw size={26} className="text-gray-300 animate-spin" />
                    </div>
                ) : (
                    <>
                        {ticket && (
                            <div className="bg-white border-b border-gray-100 px-5 md:px-8 py-3 flex items-center gap-3 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.cls}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-purple-50 text-purple-700 border-purple-200">
                                    <Share2 size={10} /> Shared Query
                                </span>
                                {ticket.booking_reference && (
                                    <span className="text-xs font-bold text-gray-400">Ref: {ticket.booking_reference}</span>
                                )}
                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                                    <Clock size={12} /> Opened {fmtDate(ticket.created_at)}
                                </span>
                                <div className="ml-auto flex items-center gap-2">
                                    <button onClick={refreshSharedMessages} disabled={refreshingShared}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        title="Refresh messages">
                                        <RefreshCw size={12} className={refreshingShared ? 'animate-spin' : ''} /> Refresh
                                    </button>
                                    {closed && (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                                            <Lock size={12} /> Closed
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                            <div className="max-w-3xl mx-auto space-y-3">
                                {sharedMessages.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                                        <MessageSquare size={30} className="text-gray-200" />
                                        <p className="text-sm font-bold text-gray-400">No messages in this thread yet.</p>
                                    </div>
                                ) : sharedMessages.map(m => {
                                    const mine = m.sender_role === 'partner';
                                    const roleLabel = ROLE_LABEL[m.sender_role] || m.sender_role;
                                    const isCustomer = m.sender_role === 'customer';
                                    return (
                                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                                mine
                                                    ? 'bg-tlb-yellow text-tlb-dark rounded-br-md'
                                                    : isCustomer
                                                        ? 'bg-blue-50 border border-blue-100 text-gray-800 rounded-bl-md'
                                                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                                            }`}>
                                                {!mine && (
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCustomer ? 'text-blue-400' : 'text-gray-400'}`}>
                                                        {roleLabel}
                                                    </p>
                                                )}
                                                <p className="text-sm leading-snug whitespace-pre-wrap break-words">{m.body}</p>
                                                <p className={`text-[10px] mt-1 ${mine ? 'text-tlb-dark/50' : 'text-gray-400'}`}>{fmtTime(m.created_at)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={sharedBottomRef} />
                            </div>
                        </div>

                        <div className="bg-white border-t border-gray-100 px-4 md:px-8 py-4">
                            {closed ? (
                                <p className="max-w-3xl mx-auto text-center text-sm font-bold text-gray-400 flex items-center justify-center gap-2">
                                    <Lock size={14} /> This ticket is closed.
                                </p>
                            ) : (
                                <form onSubmit={sendSharedReply} className="max-w-3xl mx-auto flex items-end gap-3">
                                    <textarea
                                        rows={1} value={sharedReply}
                                        onChange={e => setSharedReply(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSharedReply(e); } }}
                                        placeholder="Reply to this query…"
                                        className="flex-1 tlb-input resize-none max-h-32 py-3"
                                    />
                                    <button type="submit" disabled={sendingShared || !sharedReply.trim()}
                                        className="tlb-button !px-4 py-3 shrink-0 disabled:opacity-50">
                                        {sendingShared ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // List view (both tabs)
    // -----------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {header}
            {tabBar}
            <main className="p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {activeTab === 'my' ? (
                        <>
                            {/* Support hero */}
                            <motion.section
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tlb-dark via-gray-900 to-black text-white p-6 sm:p-8"
                            >
                                <div className="absolute -right-12 -top-16 w-60 h-60 bg-tlb-yellow/10 rounded-full blur-3xl" />
                                <LifeBuoy size={150} className="absolute -right-8 -bottom-14 text-white/5" />
                                <div className="relative">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">We're here to help</p>
                                    <h2 className="text-2xl font-black mt-1.5">How can we help you today?</h2>
                                    <p className="text-sm text-gray-400 mt-1.5 max-w-md">Raise a ticket and the TLB team will get back to you — usually within a few hours.</p>
                                    <div className="mt-5 flex flex-col sm:flex-row gap-3 max-w-2xl">
                                        <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                                            <Search size={18} className="text-gray-400 shrink-0" />
                                            <input
                                                type="text" value={query} onChange={e => setQuery(e.target.value)}
                                                placeholder="Search your tickets…"
                                                className="flex-1 bg-transparent text-sm font-bold text-gray-800 placeholder:text-gray-300 outline-none"
                                            />
                                        </div>
                                        <button onClick={openNew} className="bg-tlb-yellow text-tlb-dark rounded-xl px-5 py-3 text-sm font-black flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-95 transition-all shrink-0">
                                            <Plus size={18} /> New Ticket
                                        </button>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/60 font-medium">
                                        <span className="inline-flex items-center gap-1.5"><Clock size={12} /> Avg response in a few hours</span>
                                        <span className="inline-flex items-center gap-1.5"><MessageSquare size={12} /> Chat-based support</span>
                                    </div>
                                </div>
                            </motion.section>

                            {/* KPI cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {([
                                    { label: 'Total Tickets', value: tickets.length, icon: TicketIcon, tint: 'bg-tlb-yellow/15 text-tlb-dark' },
                                    { label: 'Open', value: activeCount, icon: MessageSquare, tint: 'bg-blue-50 text-blue-600' },
                                    { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, tint: 'bg-emerald-50 text-emerald-600' },
                                    { label: 'Closed', value: closedCount, icon: Lock, tint: 'bg-gray-100 text-gray-500' },
                                ]).map(s => (
                                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}><s.icon size={18} /></div>
                                        <div>
                                            <p className="text-2xl font-black text-gray-900 leading-none">{s.value}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Status filter chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                {([
                                    { key: 'all' as const, label: 'All' },
                                    { key: 'open' as const, label: 'Open' },
                                    { key: 'in_progress' as const, label: 'In Progress' },
                                    { key: 'resolved' as const, label: 'Resolved' },
                                    { key: 'closed' as const, label: 'Closed' },
                                ]).map(c => (
                                    <button
                                        key={c.key}
                                        onClick={() => setStatusFilter(c.key)}
                                        className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                            statusFilter === c.key ? 'bg-tlb-dark text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>

                            {/* List */}
                            {loadingList ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 animate-pulse">
                                            <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
                                            <div className="flex-1 space-y-2.5"><div className="h-3.5 w-1/3 bg-gray-100 rounded-full" /><div className="h-2.5 w-1/2 bg-gray-50 rounded-full" /></div>
                                        </div>
                                    ))}
                                </div>
                            ) : listError ? (
                                <div className="tlb-card flex flex-col items-center justify-center text-center py-16">
                                    <AlertCircle size={32} className="text-red-300 mb-3" />
                                    <p className="text-sm font-bold text-gray-500">{listError}</p>
                                    <button onClick={loadList} className="text-xs font-black text-blue-500 hover:underline mt-3">Try again</button>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="tlb-card flex flex-col items-center justify-center text-center py-16">
                                    <div className="w-16 h-16 rounded-2xl bg-tlb-yellow/10 flex items-center justify-center mb-4">
                                        <LifeBuoy size={28} className="text-tlb-yellow" />
                                    </div>
                                    <h3 className="tlb-h3">{query || statusFilter !== 'all' ? 'No tickets match your filters' : 'No support tickets yet'}</h3>
                                    <p className="text-sm text-gray-500 mt-1 max-w-xs">
                                        {query || statusFilter !== 'all' ? 'Try a different search or status.' : 'Raise a ticket and our team will get back to you here.'}
                                    </p>
                                    {!query && statusFilter === 'all' && (
                                        <button onClick={openNew} className="tlb-button mt-5"><Plus size={18} /> Raise your first ticket</button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-400 px-1">{filtered.length} ticket{filtered.length === 1 ? '' : 's'}</p>
                                    {filtered.map((t, i) => {
                                        const st = statusStyle(t.status);
                                        const unread = toCount(t.unread_count);
                                        return (
                                            <motion.button
                                                key={t.id}
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                                                onClick={() => openTicket(t.id)}
                                                className="group w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all"
                                            >
                                                <div className="w-11 h-11 rounded-xl bg-tlb-yellow/15 flex items-center justify-center shrink-0 text-tlb-dark"><TicketIcon size={20} /></div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-[15px] text-gray-900 truncate">{t.subject}</p>
                                                        {unread > 0 && <span className="shrink-0 text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5">{unread}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 rounded-full px-2 py-0.5">{ticketCategoryLabel(t.category)}</span>
                                                        <span className="text-[11px] text-gray-400 font-medium">Updated {fmtDate(t.updated_at)}</span>
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                                                </span>
                                                <ChevronRight size={16} className="hidden sm:block text-gray-300 shrink-0 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        /* ── Shared Queries tab ── */
                        <>
                            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                                <p className="text-sm font-bold text-gray-500">
                                    {sharedTickets.length} shared quer{sharedTickets.length === 1 ? 'y' : 'ies'}
                                </p>
                                <div className="relative md:w-72">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text" value={sharedQuery} onChange={e => setSharedQuery(e.target.value)}
                                        placeholder="Search shared queries"
                                        className="tlb-input !pl-9 !py-2.5"
                                    />
                                </div>
                            </div>

                            {loadingShared ? (
                                <div className="flex items-center justify-center py-24">
                                    <RefreshCw size={26} className="text-gray-300 animate-spin" />
                                </div>
                            ) : sharedError ? (
                                <div className="tlb-card flex flex-col items-center justify-center text-center py-16">
                                    <AlertCircle size={32} className="text-red-300 mb-3" />
                                    <p className="text-sm font-bold text-gray-500">{sharedError}</p>
                                    <button onClick={loadSharedList} className="text-xs font-black text-blue-500 hover:underline mt-3">Try again</button>
                                </div>
                            ) : filteredShared.length === 0 ? (
                                <div className="tlb-card flex flex-col items-center justify-center text-center py-16">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                        <Share2 size={28} className="text-gray-400" />
                                    </div>
                                    <h3 className="tlb-h3">{sharedQuery ? 'No queries match your search' : 'No shared queries'}</h3>
                                    <p className="text-sm text-gray-500 mt-1 max-w-xs">
                                        {sharedQuery ? 'Try a different search term.' : 'When admin shares a customer query with you, it will appear here.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredShared.map((t, i) => {
                                        const st = statusStyle(t.status);
                                        const unread = toCount(t.unread_count);
                                        return (
                                            <motion.button
                                                key={t.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                                                onClick={() => openSharedTicket(t.id)}
                                                className="group w-full text-left tlb-card !p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all"
                                            >
                                                <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                                                    <Share2 size={18} className="text-purple-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-900 truncate">{t.subject}</p>
                                                        {unread > 0 && (
                                                            <span className="shrink-0 text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5">{unread}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
                                                        {ticketCategoryLabel(t.category)}
                                                        {t.booking_reference && <> · Ref: {t.booking_reference}</>}
                                                        {t.raised_by_role && <> · By: {t.raised_by_role}</>}
                                                        {t.shared_at && <> · Shared {fmtDate(t.shared_at)}</>}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                                                </span>
                                                <ChevronRight size={16} className="hidden sm:block text-gray-300 shrink-0 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {activeTab === 'my' && (
                <button onClick={openNew}
                    className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-tlb-yellow text-tlb-dark shadow-xl flex items-center justify-center"
                    aria-label="New ticket">
                    <Plus size={26} />
                </button>
            )}
        </div>
    );
};

export default Support;
