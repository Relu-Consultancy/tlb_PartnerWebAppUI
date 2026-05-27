import React, { useState, useEffect, useCallback } from 'react';
import {
    Menu, Search, X, ChevronLeft, ChevronRight,
    User, CreditCard, Users, CheckCircle,
    XCircle, Inbox, RefreshCw, Phone, Mail,
    FileText, AlertCircle,
} from 'lucide-react';
import { Screen } from '../../types';
import {
    getBookings, getBookingDetail,
    markBookingAttended, cancelBooking,
    getListingDetail, getClassListingDetail, getProgramListingDetail, getVenueListingDetail,
} from '../../api/listings';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

type BookingStatus = 'confirmed' | 'awaiting_payment' | 'attended' | 'cancelled';
type PaymentStatus = 'paid' | 'pending' | 'refunded';
type BookingType = 'event' | 'class' | 'program' | 'venue';
type TabFilter = 'all' | BookingStatus;

interface BookingSummary {
    id: string;
    listing_id?: string;
    booking_reference: string;
    booking_type: BookingType;
    status: BookingStatus;
    total_amount: number;
    currency: string;
    payment_status: PaymentStatus;
    customer_name: string;
    customer_email: string;
    cancelled_at: string | null;
    created_at: string;
}

interface LineItem {
    id: number;
    item_type: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    ticket_name: string | null;
    package_name: string | null;
    batch_name: string | null;
}

interface BookingAttendee {
    id: number;
    name: string;
    age: number;
    email: string;
    phone: string;
    extra_data: Record<string, unknown>;
}

interface Transaction {
    id: string;
    transaction_type: string;
    status: string;
    amount: number;
    currency: string;
    razorpay_payment_id: string | null;
    razorpay_refund_id: string | null;
    failure_reason: string;
    created_at: string;
}

interface BookingDetail extends BookingSummary {
    listing_title: string;
    customer_phone: string;
    cancellation_reason: string;
    refund_amount: number | null;
    customer_notes: string;
    line_items: LineItem[];
    attendees: BookingAttendee[];
    venue_detail: unknown;
    transactions: Transaction[];
    updated_at: string;
}

interface StatusCounts {
    total: number;
    awaiting_payment: number;
    confirmed: number;
    attended: number;
    cancelled: number;
}

const TYPE_COLORS: Partial<Record<BookingType, string>> = {
    event: 'bg-blue-100 text-blue-700',
    class: 'bg-purple-100 text-purple-700',
    program: 'bg-emerald-100 text-emerald-700',
    venue: 'bg-amber-100 text-amber-700',
};

const STATUS_COLORS: Partial<Record<BookingStatus, string>> = {
    awaiting_payment: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-sky-100 text-sky-700',
    attended: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_COLORS: Partial<Record<PaymentStatus, string>> = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    refunded: 'bg-purple-100 text-purple-700',
};

const FALLBACK_BADGE = 'bg-gray-100 text-gray-600';

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
}

const PAGE_SIZE = 20;

const Attendees: React.FC<Props> = ({ onOpenSidebar }) => {
    const [activeTab, setActiveTab] = useState<TabFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [bookings, setBookings] = useState<BookingSummary[]>([]);
    const [counts, setCounts] = useState<StatusCounts>({ total: 0, awaiting_payment: 0, confirmed: 0, attended: 0, cancelled: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<BookingDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [markingAttended, setMarkingAttended] = useState(false);

    const fetchList = useCallback(async (tab: TabFilter, pg: number) => {
        setLoading(true);
        setListError(null);
        try {
            const params: { status?: string; page?: number } = { page: pg };
            if (tab !== 'all') params.status = tab;
            const res = await getBookings(params);
            const d = res?.data || res;
            setBookings(d?.results || []);
            setTotalCount(d?.count || 0);
            setHasNext(!!d?.next);
            setHasPrev(!!d?.previous);
        } catch (e: unknown) {
            setListError((e as Error)?.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    }, []);

    // Parallel status-count fetch on mount
    useEffect(() => {
        const loadCounts = async () => {
            const [allRes, awaitRes, confRes, attRes, canRes] = await Promise.allSettled([
                getBookings({ page: 1 }),
                getBookings({ status: 'awaiting_payment', page: 1 }),
                getBookings({ status: 'confirmed', page: 1 }),
                getBookings({ status: 'attended', page: 1 }),
                getBookings({ status: 'cancelled', page: 1 }),
            ]);
            const getCount = (r: PromiseSettledResult<unknown>) => {
                if (r.status !== 'fulfilled') return 0;
                const v = r.value as Record<string, unknown>;
                const d = v?.data as Record<string, unknown> | undefined;
                return Number(d?.count ?? v?.count ?? 0);
            };
            setCounts({
                total: getCount(allRes),
                awaiting_payment: getCount(awaitRes),
                confirmed: getCount(confRes),
                attended: getCount(attRes),
                cancelled: getCount(canRes),
            });
        };
        loadCounts();
    }, []);

    useEffect(() => {
        fetchList(activeTab, page);
    }, [activeTab, page, fetchList]);

    const handleTabChange = (tab: TabFilter) => {
        setActiveTab(tab);
        setPage(1);
        setSelectedId(null);
        setDetail(null);
    };

    const handleViewDetail = async (id: string) => {
        setSelectedId(id);
        setDetail(null);
        setLoadingDetail(true);
        setActionError(null);
        setCancelOpen(false);
        setCancelReason('');
        try {
            const res = await getBookingDetail(id);
            const d = res?.data || res;
            // Try to resolve listing title from inline fields first
            d.listing_title = d.listing_title || d.service_title || d.listing_name || d.listing?.title || '';
            setDetail(d);
            // If no title yet, fetch it from the listing endpoint using listing_id
            const listingId = d.listing_id || d.listing;
            if (!d.listing_title && listingId && d.booking_type) {
                try {
                    const fetcher = d.booking_type === 'event' ? getListingDetail
                        : d.booking_type === 'class' ? getClassListingDetail
                        : d.booking_type === 'program' ? getProgramListingDetail
                        : d.booking_type === 'venue' ? getVenueListingDetail
                        : null;
                    if (fetcher) {
                        const lr = await fetcher(listingId);
                        const ld = lr?.data || lr;
                        const title = ld?.title || ld?.service?.title || '';
                        if (title) setDetail(prev => prev ? { ...prev, listing_title: title } : prev);
                    }
                } catch { /* listing fetch is best-effort */ }
            }
        } catch (e: unknown) {
            setActionError((e as Error)?.message || 'Failed to load booking details');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCloseDetail = () => {
        setSelectedId(null);
        setDetail(null);
        setActionError(null);
        setCancelOpen(false);
        setCancelReason('');
    };

    const handleMarkAttended = async () => {
        if (!detail) return;
        setMarkingAttended(true);
        setActionError(null);
        try {
            const res = await markBookingAttended(detail.id);
            const updated = res?.data || res;
            setDetail(prev => prev ? { ...prev, ...updated } : prev);
            fetchList(activeTab, page);
            setCounts(prev => ({
                ...prev,
                confirmed: Math.max(0, prev.confirmed - 1),
                attended: prev.attended + 1,
            }));
        } catch (e: unknown) {
            setActionError((e as Error)?.message || 'Failed to mark as attended');
        } finally {
            setMarkingAttended(false);
        }
    };

    const handleCancelConfirm = async () => {
        if (!detail) return;
        const prevStatus = detail.status;
        setCancelling(true);
        setActionError(null);
        try {
            const res = await cancelBooking(detail.id, cancelReason || undefined);
            const updated = res?.data || res;
            setDetail(prev => prev ? { ...prev, ...updated } : prev);
            setCancelOpen(false);
            setCancelReason('');
            fetchList(activeTab, page);
            setCounts(prev => ({
                ...prev,
                ...(prevStatus === 'confirmed' ? { confirmed: Math.max(0, prev.confirmed - 1) } : {}),
                ...(prevStatus === 'awaiting_payment' ? { awaiting_payment: Math.max(0, prev.awaiting_payment - 1) } : {}),
                cancelled: prev.cancelled + 1,
            }));
        } catch (e: unknown) {
            setActionError((e as Error)?.message || 'Failed to cancel booking');
        } finally {
            setCancelling(false);
        }
    };

    const filtered = bookings.filter(b => {
        const q = searchQuery.toLowerCase();
        return (
            b.customer_name.toLowerCase().includes(q) ||
            b.customer_email.toLowerCase().includes(q) ||
            b.booking_reference.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const TABS: { key: TabFilter; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: counts.total },
        { key: 'awaiting_payment', label: 'Awaiting Payment', count: counts.awaiting_payment },
        { key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
        { key: 'attended', label: 'Attended', count: counts.attended },
        { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <main className="flex-1 w-full h-screen overflow-y-auto">
                <header className="bg-white px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors">
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bookings</h1>
                            <p className="text-sm font-bold text-gray-400 mt-0.5">Track attendees, payments, and attendance</p>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'Total Bookings', value: counts.total, color: 'text-gray-900', bg: 'bg-white' },
                            { label: 'Awaiting Payment', value: counts.awaiting_payment, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Confirmed', value: counts.confirmed, color: 'text-sky-600', bg: 'bg-sky-50' },
                            { label: 'Attended', value: counts.attended, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Cancelled', value: counts.cancelled, color: 'text-red-500', bg: 'bg-red-50' },
                        ].map(card => (
                            <div key={card.label} className={`${card.bg} rounded-2xl p-5 border border-gray-100 shadow-sm`}>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{card.label}</p>
                                <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Table card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Tabs */}
                        <div className="flex gap-1 border-b border-gray-100 px-4 pt-4 overflow-x-auto">
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                        activeTab === tab.key
                                            ? 'border-tlb-yellow text-gray-900'
                                            : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                            activeTab === tab.key ? 'bg-tlb-yellow text-gray-900' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-gray-50">
                            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                                <Search size={16} className="text-gray-400 shrink-0" />
                                <input
                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-gray-300"
                                    placeholder="Search by name, email, or booking ref…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table body */}
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <RefreshCw size={24} className="text-gray-300 animate-spin" />
                                </div>
                            ) : listError ? (
                                <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
                                    <AlertCircle size={32} className="text-red-300" />
                                    <p className="text-sm font-bold text-gray-500">{listError}</p>
                                    <button
                                        onClick={() => fetchList(activeTab, page)}
                                        className="text-xs font-black text-blue-500 hover:underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-20 text-center">
                                    <Inbox size={32} className="text-gray-200" />
                                    <p className="text-sm font-bold text-gray-400">
                                        {searchQuery ? 'No bookings match your search' : 'No bookings yet'}
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            {['Booking Ref', 'Customer', 'Type', 'Status', 'Payment', 'Amount', 'Date', ''].map(h => (
                                                <th key={h} className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filtered.map(b => (
                                            <tr key={b.id} className="hover:bg-gray-50/40 transition-colors">
                                                <td className="px-5 py-4">
                                                    <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap">
                                                        {b.booking_reference}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-sm text-gray-900 whitespace-nowrap">{b.customer_name}</p>
                                                    <p className="text-xs text-gray-400 font-medium mt-0.5">{b.customer_email}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${TYPE_COLORS[b.booking_type] || FALLBACK_BADGE}`}>
                                                        {b.booking_type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${STATUS_COLORS[b.status] || FALLBACK_BADGE}`}>
                                                        {b.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${PAYMENT_COLORS[b.payment_status] || FALLBACK_BADGE}`}>
                                                        {b.payment_status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-sm font-black text-gray-900 whitespace-nowrap">
                                                        {b.total_amount === 0 ? 'Free' : formatAmount(b.total_amount, b.currency)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-500 font-medium whitespace-nowrap">
                                                    {formatDate(b.created_at)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <button
                                                        onClick={() => handleViewDetail(b.id)}
                                                        className="text-xs font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                                <p className="text-xs font-bold text-gray-400">
                                    Page {page} of {totalPages} &middot; {totalCount} total
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        disabled={!hasPrev}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="p-2 rounded-xl border border-gray-100 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        disabled={!hasNext}
                                        onClick={() => setPage(p => p + 1)}
                                        className="p-2 rounded-xl border border-gray-100 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Booking Detail Drawer */}
            {selectedId && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="flex-1 bg-black/30 backdrop-blur-sm"
                        onClick={handleCloseDetail}
                    />
                    {/* Drawer panel */}
                    <div className="w-full max-w-lg bg-white h-full overflow-hidden shadow-2xl flex flex-col">
                        {/* Drawer header */}
                        <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking Details</p>
                                {detail && (
                                    <p className="font-mono text-sm font-bold text-gray-900 mt-0.5">{detail.booking_reference}</p>
                                )}
                            </div>
                            <button onClick={handleCloseDetail} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <div className="flex-1 flex items-center justify-center">
                                <RefreshCw size={24} className="text-gray-300 animate-spin" />
                            </div>
                        ) : !detail && actionError ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                                <AlertCircle size={32} className="text-red-300" />
                                <p className="text-sm font-bold text-gray-500">{actionError}</p>
                            </div>
                        ) : detail ? (
                            <>
                                {/* Scrollable content */}
                                <div className="flex-1 overflow-y-auto">
                                    {/* Status badges + amount */}
                                    <div className="px-6 pt-5 pb-4 flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${STATUS_COLORS[detail.status] || FALLBACK_BADGE}`}>
                                            {detail.status.replace(/_/g, ' ')}
                                        </span>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${TYPE_COLORS[detail.booking_type] || FALLBACK_BADGE}`}>
                                            {detail.booking_type}
                                        </span>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${PAYMENT_COLORS[detail.payment_status] || FALLBACK_BADGE}`}>
                                            {detail.payment_status}
                                        </span>
                                        <span className="ml-auto text-xl font-black text-gray-900">
                                            {detail.total_amount === 0 ? 'Free' : formatAmount(detail.total_amount, detail.currency)}
                                        </span>
                                    </div>

                                    <div className="px-6 space-y-5 pb-6">
                                        {/* Listing name */}
                                        {detail.listing_title && (
                                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{detail.booking_type || 'Listing'}</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{detail.listing_title}</p>
                                            </div>
                                        )}

                                        {/* Action error */}
                                        {actionError && (
                                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                                                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-sm font-bold text-red-700">{actionError}</p>
                                            </div>
                                        )}

                                        {/* Customer info */}
                                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                                    <User size={16} className="text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{detail.customer_name}</p>
                                                    <p className="text-xs text-gray-400 font-medium">{formatDate(detail.created_at)}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 pt-1">
                                                {detail.customer_email && (
                                                    <div className="flex items-center gap-2.5">
                                                        <Mail size={13} className="text-gray-400 shrink-0" />
                                                        <span className="text-sm text-gray-700 font-medium">{detail.customer_email}</span>
                                                    </div>
                                                )}
                                                {detail.customer_phone && (
                                                    <div className="flex items-center gap-2.5">
                                                        <Phone size={13} className="text-gray-400 shrink-0" />
                                                        <span className="text-sm text-gray-700 font-medium">{detail.customer_phone}</span>
                                                    </div>
                                                )}
                                                {detail.customer_notes && (
                                                    <div className="flex items-start gap-2.5 pt-1">
                                                        <FileText size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                                        <span className="text-sm text-gray-500 font-medium italic">"{detail.customer_notes}"</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Line items */}
                                        {detail.line_items.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
                                                <div className="space-y-2">
                                                    {detail.line_items.map(item => (
                                                        <div key={item.id} className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between">
                                                            <p className="text-sm font-bold text-gray-900">
                                                                {item.ticket_name || item.package_name || item.batch_name || item.item_type}
                                                            </p>
                                                            <span className="text-xs font-bold text-gray-500">
                                                                Qty {item.quantity}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Attendees list */}
                                        {detail.attendees.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Users size={11} />
                                                    Attendees ({detail.attendees.length})
                                                </p>
                                                <div className="space-y-2">
                                                    {detail.attendees.map((att, i) => (
                                                        <div key={att.id} className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xs font-black text-gray-500">
                                                                {i + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-900">{att.name}</p>
                                                                {att.age > 0 && (
                                                                    <p className="text-xs text-gray-400 font-medium">Age {att.age}</p>
                                                                )}
                                                            </div>
                                                            {(att.email || att.phone) && (
                                                                <div className="text-right shrink-0">
                                                                    {att.email && <p className="text-xs text-gray-500 font-medium">{att.email}</p>}
                                                                    {att.phone && <p className="text-xs text-gray-500 font-medium">{att.phone}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Transactions */}
                                        {detail.transactions.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <CreditCard size={11} />
                                                    Payment Activity
                                                </p>
                                                <div className="space-y-1.5">
                                                    {detail.transactions.map(txn => (
                                                        <div key={txn.id} className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center gap-3">
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${
                                                                txn.status === 'success' && detail.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                                txn.status === 'success' ? 'bg-amber-100 text-amber-700' :
                                                                txn.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {txn.status === 'success' && detail.payment_status !== 'paid' ? 'Initiated' : txn.status}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-gray-700 capitalize truncate">
                                                                    {txn.transaction_type.replace(/_/g, ' ')}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400">{formatDate(txn.created_at)}</p>
                                                            </div>
                                                            {txn.razorpay_payment_id && (
                                                                <p className="font-mono text-[10px] text-gray-400 shrink-0">{txn.razorpay_payment_id.slice(-8)}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Cancellation info */}
                                        {(detail.status === 'cancelled' || detail.cancelled_at) && (
                                            <div className="bg-red-50 rounded-2xl px-4 py-3 border border-red-100 space-y-1">
                                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Cancellation</p>
                                                <p className="text-sm font-bold text-red-700">
                                                    {detail.cancellation_reason || 'No reason provided'}
                                                </p>
                                                {detail.cancelled_at && (
                                                    <p className="text-xs text-red-400 font-medium">
                                                        {formatDate(detail.cancelled_at)}
                                                    </p>
                                                )}
                                                {detail.refund_amount != null && (
                                                    <p className="text-sm font-black text-red-500 pt-0.5">
                                                        Refund: {formatAmount(detail.refund_amount, detail.currency)}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action bar — for confirmed and awaiting_payment bookings */}
                                {(detail.status === 'confirmed' || detail.status === 'awaiting_payment') && (
                                    <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3">
                                        {!cancelOpen ? (
                                            <div className="flex gap-3">
                                                {detail.status === 'confirmed' && (
                                                    <button
                                                        onClick={handleMarkAttended}
                                                        disabled={markingAttended}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-3 rounded-2xl transition-colors disabled:opacity-50"
                                                    >
                                                        {markingAttended
                                                            ? <RefreshCw size={15} className="animate-spin" />
                                                            : <CheckCircle size={15} />
                                                        }
                                                        Mark Attended
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setCancelOpen(true)}
                                                    className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 hover:bg-red-50 text-red-600 font-black text-sm py-3 rounded-2xl transition-colors"
                                                >
                                                    <XCircle size={15} />
                                                    Cancel Booking
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-xs font-black text-gray-700">Reason for cancellation <span className="font-medium text-gray-400">(optional)</span></p>
                                                <textarea
                                                    className="w-full bg-gray-50 rounded-xl border border-gray-200 p-3 text-sm font-medium text-gray-700 focus:outline-none focus:border-red-300 resize-none"
                                                    rows={2}
                                                    placeholder="e.g. Event rescheduled due to weather"
                                                    value={cancelReason}
                                                    onChange={e => setCancelReason(e.target.value)}
                                                />
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => { setCancelOpen(false); setCancelReason(''); setActionError(null); }}
                                                        className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50 transition-colors"
                                                    >
                                                        Back
                                                    </button>
                                                    <button
                                                        onClick={handleCancelConfirm}
                                                        disabled={cancelling}
                                                        className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {cancelling && <RefreshCw size={14} className="animate-spin" />}
                                                        Confirm Cancel
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendees;
