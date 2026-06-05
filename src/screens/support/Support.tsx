import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
    Menu, ArrowLeft, Plus, LifeBuoy, Search, RefreshCw, AlertCircle,
    Send, CheckCircle2, MessageSquare, Clock, Lock, Ticket as TicketIcon,
} from 'lucide-react';
import { Screen } from '../../types';
import { Select, SelectOption, toast } from '../../components/ui';
import {
    listTickets, getTicket, createTicket, closeTicket,
    getTicketMessages, sendTicketMessage, getTicketCategories, ticketCategoryLabel,
    TicketListItem, Ticket, TicketMessage, TicketCategory,
} from '../../api/help';
import { getBookings } from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

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

export const Support: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    // List
    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    // Categories + bookings (for the new-ticket form)
    const [categories, setCategories] = useState<TicketCategory[]>([]);
    const [bookingOptions, setBookingOptions] = useState<SelectOption[]>([]);

    // New ticket
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ subject: '', category: '', body: '', bookingId: '' });
    const [formErrors, setFormErrors] = useState<{ subject?: string; category?: string; body?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    // Detail
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

    // ── Load list + categories on mount ──
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

    useEffect(() => {
        loadList();
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

    // ── Poll messages while a ticket is open ──
    // Cadence follows the ticket status: in_progress → 5s (feels real-time),
    // open → 30s, resolved → 60s, closed → stop. `lastTsRef` carries the UTC
    // cursor verbatim so deltas work correctly.
    useEffect(() => {
        if (!selectedId) return;
        const status = detail?.status;
        if (status === 'closed') return; // terminal — no more messages
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

    // Auto-scroll the thread to the newest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages.length]);

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
            // Optimistically clear unread badge in the list
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

    // ── New ticket ──
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

    const filtered = tickets.filter(t => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return t.subject.toLowerCase().includes(q) || ticketCategoryLabel(t.category).toLowerCase().includes(q);
    });

    const openCount = tickets.filter(t => !isClosed(t.status)).length;

    // -----------------------------------------------------------------------
    // Header
    // -----------------------------------------------------------------------
    const header = (
        <header className="bg-white/90 backdrop-blur-sm px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
            {(creating || selectedId) ? (
                <button
                    onClick={() => (creating ? setCreating(false) : backToList())}
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
                <h1 className="tlb-page-title truncate">
                    {creating ? 'Raise a Ticket' : detail ? detail.subject : 'Help & Support'}
                </h1>
                <p className="tlb-page-sub">
                    {creating ? 'Tell us what you need help with'
                        : detail ? `${ticketCategoryLabel(detail.category)}${detail.booking_reference ? ` · ${detail.booking_reference}` : ''}`
                            : 'Raise tickets and chat with the TLB team'}
                </p>
            </div>
            {!creating && !selectedId && (
                <button onClick={openNew} className="tlb-button hidden sm:inline-flex">
                    <Plus size={18} /> New Ticket
                </button>
            )}
        </header>
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
    // Ticket detail (conversation)
    // -----------------------------------------------------------------------
    if (selectedId) {
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
                        {/* Sub-bar */}
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

                        {/* Thread */}
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
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                                        {m.sender_role === 'customer' ? 'Customer' : 'TLB Support'}
                                                    </p>
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

                        {/* Composer */}
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
    // Ticket list
    // -----------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {header}
            <main className="p-5 md:p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Summary + search */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <p className="text-sm font-bold text-gray-500">
                            {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
                            {openCount > 0 && <span className="text-gray-400"> · {openCount} open</span>}
                        </p>
                        <div className="relative md:w-72">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text" value={query} onChange={e => setQuery(e.target.value)}
                                placeholder="Search tickets"
                                className="tlb-input !pl-9 !py-2.5"
                            />
                        </div>
                    </div>

                    {loadingList ? (
                        <div className="flex items-center justify-center py-24">
                            <RefreshCw size={26} className="text-gray-300 animate-spin" />
                        </div>
                    ) : listError ? (
                        <div className="tlb-card flex flex-col items-center justify-center text-center py-16">
                            <AlertCircle size={32} className="text-red-300 mb-3" />
                            <p className="text-sm font-bold text-gray-500">{listError}</p>
                            <button onClick={loadList} className="text-xs font-black text-blue-500 hover:underline mt-3">Try again</button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="tlb-card flex flex-col items-center justify-center text-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                <LifeBuoy size={28} className="text-gray-400" />
                            </div>
                            <h3 className="tlb-h3">{query ? 'No tickets match your search' : 'No support tickets yet'}</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-xs">
                                {query ? 'Try a different search term.' : 'Raise a ticket and our team will get back to you here.'}
                            </p>
                            {!query && (
                                <button onClick={openNew} className="tlb-button mt-5"><Plus size={18} /> Raise your first ticket</button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((t, i) => {
                                const st = statusStyle(t.status);
                                const unread = toCount(t.unread_count);
                                return (
                                    <motion.button
                                        key={t.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                                        onClick={() => openTicket(t.id)}
                                        className="w-full text-left tlb-card !p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all"
                                    >
                                        <div className="w-11 h-11 rounded-2xl bg-tlb-yellow/15 flex items-center justify-center shrink-0">
                                            <TicketIcon size={20} className="text-tlb-dark" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900 truncate">{t.subject}</p>
                                                {unread > 0 && (
                                                    <span className="shrink-0 text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5">{unread}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
                                                {ticketCategoryLabel(t.category)} · Updated {fmtDate(t.updated_at)}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.cls}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile FAB */}
            <button onClick={openNew}
                className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-tlb-yellow text-tlb-dark shadow-xl flex items-center justify-center"
                aria-label="New ticket">
                <Plus size={26} />
            </button>
        </div>
    );
};

export default Support;
