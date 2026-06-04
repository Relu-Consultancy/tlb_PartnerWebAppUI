import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Menu, Search, X, ArrowLeft, ChevronRight,
    User, CreditCard, Users, CheckCircle,
    XCircle, Inbox, RefreshCw, Phone, Mail,
    FileText, AlertCircle, CalendarDays, GraduationCap, Layers, MapPin,
} from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import {
    getBookings, getBookingDetail,
    markBookingAttended, cancelBooking,
    getEventListings, getClassListings, getProgramListings, getVenueListings,
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

interface ListingCard {
    id: string;
    title: string;
    type: BookingType;
    status?: string;
    /** True when the card is derived from bookings (listing no longer in catalog). */
    synthetic?: boolean;
}

const TYPE_META: Record<BookingType, { label: string; icon: React.ElementType; grad: string; badge: string }> = {
    event:   { label: 'Event',   icon: CalendarDays,  grad: 'from-blue-700 to-blue-800',     badge: 'bg-blue-100 text-blue-700' },
    class:   { label: 'Class',   icon: GraduationCap, grad: 'from-violet-700 to-violet-800', badge: 'bg-purple-100 text-purple-700' },
    program: { label: 'Program', icon: Layers,        grad: 'from-teal-700 to-teal-800',     badge: 'bg-emerald-100 text-emerald-700' },
    venue:   { label: 'Venue',   icon: MapPin,        grad: 'from-amber-700 to-amber-800',   badge: 'bg-amber-100 text-amber-700' },
};

const ENTITY_TO_TYPE: Record<EntityType, BookingType> = {
    Events: 'event', Classes: 'class', Programs: 'program', Venues: 'venue',
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

function computeCounts(list: BookingSummary[]): StatusCounts {
    const c: StatusCounts = { total: list.length, awaiting_payment: 0, confirmed: 0, attended: 0, cancelled: 0 };
    list.forEach(b => {
        if (b.status === 'awaiting_payment') c.awaiting_payment++;
        else if (b.status === 'confirmed') c.confirmed++;
        else if (b.status === 'attended') c.attended++;
        else if (b.status === 'cancelled') c.cancelled++;
    });
    return c;
}

const UNLINKED_KEY = '__unlinked__';

// Normalize a created_at timestamp to a YYYY-MM-DD grouping key
const dateKeyOf = (iso: string): string => {
    if (!iso) return 'unknown';
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? 'unknown' : d.toISOString().slice(0, 10);
};

const formatFullDate = (key: string): string => {
    if (key === 'unknown') return 'Unknown date';
    const d = new Date(key);
    return Number.isNaN(d.getTime())
        ? key
        : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatWeekday = (key: string): string => {
    if (key === 'unknown') return '';
    const d = new Date(key);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { weekday: 'long' });
};

const Attendees: React.FC<Props> = ({ onOpenSidebar }) => {
    const { allowedEntities } = usePartner();

    // ── Data ──
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [listings, setListings] = useState<ListingCard[]>([]);
    const [bookingsByListing, setBookingsByListing] = useState<Record<string, BookingSummary[]>>({});
    const [bookingsByDate, setBookingsByDate] = useState<Record<string, BookingSummary[]>>({});

    // ── Navigation between the two levels ──
    const [groupMode, setGroupMode] = useState<'listing' | 'date'>('listing');
    const [selected, setSelected] = useState<{ mode: 'listing' | 'date'; key: string } | null>(null);
    const [listingSearch, setListingSearch] = useState('');

    // ── Per-listing booking view ──
    const [activeTab, setActiveTab] = useState<TabFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // ── Booking detail drawer ──
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<BookingDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [markingAttended, setMarkingAttended] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1) Fetch the partner's listings across the entity types they offer
            const wanted: EntityType[] = allowedEntities.length > 0
                ? allowedEntities
                : ['Events', 'Classes', 'Programs', 'Venues'];
            const fetchers: Record<EntityType, (s?: string) => Promise<any>> = {
                Events: getEventListings, Classes: getClassListings,
                Programs: getProgramListings, Venues: getVenueListings,
            };
            const listingFetches = wanted.map(ent =>
                fetchers[ent]().then((res: any) => {
                    const data = res?.data || res;
                    return Array.isArray(data)
                        ? data.map((item: any) => ({
                            id: String(item.id || ''),
                            title: item.title || 'Untitled',
                            type: ENTITY_TO_TYPE[ent],
                            status: item.status as string | undefined,
                        } as ListingCard))
                        : [];
                }).catch(() => [] as ListingCard[]),
            );

            // 2) Fetch every booking (paginated), then group by listing
            const fetchAllBookings = async (): Promise<BookingSummary[]> => {
                const all: BookingSummary[] = [];
                let page = 1;
                for (let guard = 0; guard < 30; guard++) {
                    const res: any = await getBookings({ page });
                    const d = res?.data || res;
                    all.push(...((d?.results || []) as BookingSummary[]));
                    if (!d?.next) break;
                    page++;
                }
                return all;
            };

            const [listingResults, allBookings] = await Promise.all([
                Promise.all(listingFetches),
                fetchAllBookings().catch((e: any) => { throw e; }),
            ]);

            const listingCards: ListingCard[] = listingResults.flat();
            const byId = new Map(listingCards.map(l => [l.id, l]));

            // Group bookings; synthesize cards for listings not in the catalog
            const grouped: Record<string, BookingSummary[]> = {};
            allBookings.forEach(b => {
                const key = b.listing_id || UNLINKED_KEY;
                (grouped[key] ||= []).push(b);
            });

            Object.entries(grouped).forEach(([key, list]) => {
                if (key === UNLINKED_KEY || byId.has(key)) return;
                const first = list[0];
                listingCards.push({
                    id: key,
                    title: (first as any).listing_title || `${TYPE_META[first.booking_type]?.label || 'Listing'}`,
                    type: first.booking_type,
                    synthetic: true,
                });
            });
            if (grouped[UNLINKED_KEY]?.length) {
                listingCards.push({
                    id: UNLINKED_KEY,
                    title: 'Other bookings',
                    type: grouped[UNLINKED_KEY][0].booking_type,
                    synthetic: true,
                });
            }

            // Group the same bookings by date for the "By Date" view
            const byDate: Record<string, BookingSummary[]> = {};
            allBookings.forEach(b => {
                const key = dateKeyOf(b.created_at);
                (byDate[key] ||= []).push(b);
            });

            setListings(listingCards);
            setBookingsByListing(grouped);
            setBookingsByDate(byDate);
        } catch (e: unknown) {
            setError((e as Error)?.message || 'Failed to load attendees');
        } finally {
            setLoading(false);
        }
    }, [allowedEntities]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const openGroup = (mode: 'listing' | 'date', key: string) => {
        setSelected({ mode, key });
        setActiveTab('all');
        setSearchQuery('');
    };

    const backToListings = () => setSelected(null);

    const patchBooking = (id: string, patch: Partial<BookingSummary>) => {
        const patchMap = (prev: Record<string, BookingSummary[]>) => {
            const next = { ...prev };
            for (const k of Object.keys(next)) {
                const idx = next[k].findIndex(b => b.id === id);
                if (idx >= 0) {
                    next[k] = [...next[k]];
                    next[k][idx] = { ...next[k][idx], ...patch };
                }
            }
            return next;
        };
        setBookingsByListing(patchMap);
        setBookingsByDate(patchMap);
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
            d.listing_title = d.listing_title || d.service_title || d.listing_name || d.listing?.title || '';
            setDetail(d);
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
            setDetail(prev => prev ? { ...prev, ...updated, status: 'attended' } : prev);
            patchBooking(detail.id, { status: 'attended' });
        } catch (e: unknown) {
            setActionError((e as Error)?.message || 'Failed to mark as attended');
        } finally {
            setMarkingAttended(false);
        }
    };

    const handleCancelConfirm = async () => {
        if (!detail) return;
        setCancelling(true);
        setActionError(null);
        try {
            const res = await cancelBooking(detail.id, cancelReason || undefined);
            const updated = res?.data || res;
            setDetail(prev => prev ? { ...prev, ...updated, status: 'cancelled' } : prev);
            patchBooking(detail.id, { status: 'cancelled' });
            setCancelOpen(false);
            setCancelReason('');
        } catch (e: unknown) {
            setActionError((e as Error)?.message || 'Failed to cancel booking');
        } finally {
            setCancelling(false);
        }
    };

    const selectedListing = selected?.mode === 'listing'
        ? (listings.find(l => l.id === selected.key) || null)
        : null;
    const listingBookings: BookingSummary[] = !selected
        ? []
        : selected.mode === 'listing'
            ? (bookingsByListing[selected.key] || [])
            : (bookingsByDate[selected.key] || []);
    const listingCounts = computeCounts(listingBookings);

    // Title / subtitle for the drill-down header (works for listing or date)
    const detailTitle = !selected
        ? 'Attendees'
        : selected.mode === 'listing'
            ? (selectedListing?.title || 'Listing')
            : formatFullDate(selected.key);
    const detailSubtitle = !selected
        ? 'Pick a listing or date to view its attendees & bookings'
        : selected.mode === 'listing' && selectedListing
            ? `${TYPE_META[selectedListing.type].label} · ${listingCounts.total} booking${listingCounts.total === 1 ? '' : 's'}`
            : `${listingCounts.total} booking${listingCounts.total === 1 ? '' : 's'} · ${new Set(listingBookings.map(b => b.listing_id || UNLINKED_KEY)).size} listing${new Set(listingBookings.map(b => b.listing_id || UNLINKED_KEY)).size === 1 ? '' : 's'}`;

    const tabFiltered = activeTab === 'all'
        ? listingBookings
        : listingBookings.filter(b => b.status === activeTab);
    const filtered = tabFiltered.filter(b => {
        const q = searchQuery.toLowerCase();
        return (
            b.customer_name.toLowerCase().includes(q) ||
            b.customer_email.toLowerCase().includes(q) ||
            b.booking_reference.toLowerCase().includes(q)
        );
    });

    const visibleListings = listings.filter(l =>
        l.title.toLowerCase().includes(listingSearch.toLowerCase()),
    );

    const visibleDates = (Object.entries(bookingsByDate) as [string, BookingSummary[]][])
        .filter(([key]) => {
            const q = listingSearch.toLowerCase();
            return !q || formatFullDate(key).toLowerCase().includes(q) || formatWeekday(key).toLowerCase().includes(q);
        })
        .sort((a, b) => (a[0] < b[0] ? 1 : -1)); // newest first

    const TABS: { key: TabFilter; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: listingCounts.total },
        { key: 'awaiting_payment', label: 'Awaiting Payment', count: listingCounts.awaiting_payment },
        { key: 'confirmed', label: 'Confirmed', count: listingCounts.confirmed },
        { key: 'attended', label: 'Attended', count: listingCounts.attended },
        { key: 'cancelled', label: 'Cancelled', count: listingCounts.cancelled },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <main className="flex-1 w-full h-screen overflow-y-auto">
                {/* Header */}
                <header className="bg-white px-6 md:px-10 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                    {selected ? (
                        <button onClick={backToListings} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-900">
                            <ArrowLeft size={22} />
                            <span className="hidden sm:inline text-sm font-bold">Back</span>
                        </button>
                    ) : (
                        <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors">
                            <Menu size={24} />
                        </button>
                    )}
                    <div className="min-w-0">
                        <h1 className="tlb-page-title truncate">{detailTitle}</h1>
                        <p className="tlb-page-sub">{detailSubtitle}</p>
                    </div>
                </header>

                {/* ─────────────────────────  LISTINGS GRID  ───────────────────────── */}
                {!selected && (
                    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <RefreshCw size={26} className="text-gray-300 animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-3 py-24 text-center">
                                <AlertCircle size={34} className="text-red-300" />
                                <p className="text-sm font-bold text-gray-500">{error}</p>
                                <button onClick={loadAll} className="text-xs font-black text-blue-500 hover:underline">Try again</button>
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-24 text-center">
                                <Inbox size={34} className="text-gray-200" />
                                <p className="text-sm font-bold text-gray-400">No listings yet</p>
                            </div>
                        ) : (
                            <>
                                {/* Toggle + search */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="inline-flex bg-white border border-gray-100 rounded-2xl p-1 shadow-sm w-fit">
                                        {([
                                            { mode: 'listing' as const, label: 'By Listing Type', icon: Layers },
                                            { mode: 'date' as const, label: 'By Date', icon: CalendarDays },
                                        ]).map(({ mode, label, icon: Icon }) => (
                                            <button
                                                key={mode}
                                                onClick={() => setGroupMode(mode)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                                    groupMode === mode ? 'bg-tlb-dark text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                                }`}
                                            >
                                                <Icon size={15} /> {label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm md:w-72">
                                        <Search size={16} className="text-gray-400 shrink-0" />
                                        <input
                                            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-gray-300"
                                            placeholder={groupMode === 'listing' ? 'Search listings…' : 'Search dates…'}
                                            value={listingSearch}
                                            onChange={e => setListingSearch(e.target.value)}
                                        />
                                        {listingSearch && (
                                            <button onClick={() => setListingSearch('')} className="text-gray-400 hover:text-gray-600">
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {groupMode === 'listing' ? (
                                        <motion.div
                                            key="by-listing"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.18 }}
                                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5"
                                        >
                                            {visibleListings.map((l, i) => {
                                                const meta = TYPE_META[l.type];
                                                const Icon = meta.icon;
                                                const c = computeCounts(bookingsByListing[l.id] || []);
                                                return (
                                                    <motion.button
                                                        key={l.id}
                                                        initial={{ opacity: 0, y: 12 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
                                                        onClick={() => openGroup('listing', l.id)}
                                                        className="group text-left bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all overflow-hidden"
                                                    >
                                                        <div className={`relative h-20 bg-gradient-to-br ${meta.grad} flex items-center px-5`}>
                                                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                                                <Icon size={22} className="text-white" />
                                                            </div>
                                                            <span className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full bg-white/25 text-white uppercase tracking-widest">
                                                                {meta.label}
                                                            </span>
                                                            <ChevronRight size={20} className="absolute right-3 bottom-3 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                        <div className="p-5">
                                                            <h3 className="font-black text-gray-900 leading-snug line-clamp-2 min-h-[2.6rem]">{l.title}</h3>
                                                            <div className="flex items-baseline gap-2 mt-2">
                                                                <span className="text-2xl font-black text-gray-900">{c.total}</span>
                                                                <span className="text-xs font-bold text-gray-400">total booking{c.total === 1 ? '' : 's'}</span>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2 mt-4">
                                                                <div className="rounded-xl bg-sky-50 px-2 py-2 text-center">
                                                                    <p className="text-sm font-black text-sky-600">{c.confirmed}</p>
                                                                    <p className="text-[9px] font-black text-sky-400 uppercase tracking-wider mt-0.5">Confirmed</p>
                                                                </div>
                                                                <div className="rounded-xl bg-emerald-50 px-2 py-2 text-center">
                                                                    <p className="text-sm font-black text-emerald-600">{c.attended}</p>
                                                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mt-0.5">Attended</p>
                                                                </div>
                                                                <div className="rounded-xl bg-amber-50 px-2 py-2 text-center">
                                                                    <p className="text-sm font-black text-amber-600">{c.awaiting_payment}</p>
                                                                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider mt-0.5">Awaiting</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                            {visibleListings.length === 0 && (
                                                <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
                                                    <Inbox size={30} className="text-gray-200" />
                                                    <p className="text-sm font-bold text-gray-400">No listings match “{listingSearch}”</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="by-date"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.18 }}
                                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5"
                                        >
                                            {visibleDates.map(([key, list], i) => {
                                                const c = computeCounts(list);
                                                const distinct = new Set(list.map(b => b.listing_id || UNLINKED_KEY)).size;
                                                return (
                                                    <motion.button
                                                        key={key}
                                                        initial={{ opacity: 0, y: 12 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
                                                        onClick={() => openGroup('date', key)}
                                                        className="group text-left bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all overflow-hidden"
                                                    >
                                                        <div className="relative h-20 bg-gradient-to-br from-slate-600 to-slate-900 flex items-center px-5">
                                                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                                                <CalendarDays size={22} className="text-white" />
                                                            </div>
                                                            {formatWeekday(key) && (
                                                                <span className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full bg-white/25 text-white uppercase tracking-widest">
                                                                    {formatWeekday(key)}
                                                                </span>
                                                            )}
                                                            <ChevronRight size={20} className="absolute right-3 bottom-3 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                        <div className="p-5">
                                                            <h3 className="font-black text-gray-900 leading-snug min-h-[2.6rem]">{formatFullDate(key)}</h3>
                                                            <div className="flex items-baseline gap-2 mt-2">
                                                                <span className="text-2xl font-black text-gray-900">{c.total}</span>
                                                                <span className="text-xs font-bold text-gray-400">
                                                                    booking{c.total === 1 ? '' : 's'} · {distinct} listing{distinct === 1 ? '' : 's'}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2 mt-4">
                                                                <div className="rounded-xl bg-sky-50 px-2 py-2 text-center">
                                                                    <p className="text-sm font-black text-sky-600">{c.confirmed}</p>
                                                                    <p className="text-[9px] font-black text-sky-400 uppercase tracking-wider mt-0.5">Confirmed</p>
                                                                </div>
                                                                <div className="rounded-xl bg-emerald-50 px-2 py-2 text-center">
                                                                    <p className="text-sm font-black text-emerald-600">{c.attended}</p>
                                                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mt-0.5">Attended</p>
                                                                </div>
                                                                <div className="rounded-xl bg-amber-50 px-2 py-2 text-center">
                                                                    <p className="text-sm font-black text-amber-600">{c.awaiting_payment}</p>
                                                                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider mt-0.5">Awaiting</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                            {visibleDates.length === 0 && (
                                                <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
                                                    <Inbox size={30} className="text-gray-200" />
                                                    <p className="text-sm font-bold text-gray-400">
                                                        {listingSearch ? `No dates match “${listingSearch}”` : 'No bookings yet'}
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                )}

                {/* ─────────────────────  SINGLE GROUP'S BOOKINGS  ───────────────────── */}
                {selected && (
                    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { label: 'Total Bookings', value: listingCounts.total, color: 'text-gray-900', bg: 'bg-white' },
                                { label: 'Awaiting Payment', value: listingCounts.awaiting_payment, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'Confirmed', value: listingCounts.confirmed, color: 'text-sky-600', bg: 'bg-sky-50' },
                                { label: 'Attended', value: listingCounts.attended, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Cancelled', value: listingCounts.cancelled, color: 'text-red-500', bg: 'bg-red-50' },
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
                                        onClick={() => setActiveTab(tab.key)}
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
                                {filtered.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-20 text-center">
                                        <Inbox size={32} className="text-gray-200" />
                                        <p className="text-sm font-bold text-gray-400">
                                            {searchQuery ? 'No bookings match your search' : 'No bookings in this view'}
                                        </p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                {['Booking Ref', 'Customer', 'Status', 'Payment', 'Amount', 'Date', ''].map(h => (
                                                    <th key={h} className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filtered.map(b => (
                                                <tr key={b.id} className="hover:bg-gray-50/40 transition-colors cursor-pointer" onClick={() => handleViewDetail(b.id)}>
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
                                                        <span className="text-xs font-black text-blue-600 group-hover:text-blue-700 px-3 py-1.5 rounded-xl whitespace-nowrap">
                                                            View
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Booking Detail Drawer */}
            {selectedId && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={handleCloseDetail} />
                    <div className="w-full max-w-lg bg-white h-full overflow-hidden shadow-2xl flex flex-col">
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
                                <div className="flex-1 overflow-y-auto">
                                    <div className="px-6 pt-5 pb-4 flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${STATUS_COLORS[detail.status] || FALLBACK_BADGE}`}>
                                            {detail.status.replace(/_/g, ' ')}
                                        </span>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${TYPE_META[detail.booking_type]?.badge || FALLBACK_BADGE}`}>
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
                                        {detail.listing_title && (
                                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{detail.booking_type || 'Listing'}</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{detail.listing_title}</p>
                                            </div>
                                        )}

                                        {actionError && (
                                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                                                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-sm font-bold text-red-700">{actionError}</p>
                                            </div>
                                        )}

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

                                        {detail.line_items.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
                                                <div className="space-y-2">
                                                    {detail.line_items.map(item => (
                                                        <div key={item.id} className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between">
                                                            <p className="text-sm font-bold text-gray-900">
                                                                {item.ticket_name || item.package_name || item.batch_name || item.item_type}
                                                            </p>
                                                            <span className="text-xs font-bold text-gray-500">Qty {item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

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

                                        {(detail.status === 'cancelled' || detail.cancelled_at) && (
                                            <div className="bg-red-50 rounded-2xl px-4 py-3 border border-red-100 space-y-1">
                                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Cancellation</p>
                                                <p className="text-sm font-bold text-red-700">
                                                    {detail.cancellation_reason || 'No reason provided'}
                                                </p>
                                                {detail.cancelled_at && (
                                                    <p className="text-xs text-red-400 font-medium">{formatDate(detail.cancelled_at)}</p>
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
                                                            : <CheckCircle size={15} />}
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
