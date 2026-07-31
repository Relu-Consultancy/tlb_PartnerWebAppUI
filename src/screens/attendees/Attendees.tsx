import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search, X, ArrowLeft, ChevronRight,
    User, CreditCard, Users, CheckCircle,
    Inbox, RefreshCw, Phone, Mail, Wallet, MessageCircle,
    FileText, AlertCircle, CalendarDays, GraduationCap, Layers, MapPin,
    LayoutGrid, Grid3X3, List, History,
} from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { toast, Pagination } from '../../components/ui';
import {
    getBookings, getBookingDetail, markBookingAttended, getBookingPaymentDetail,
    getEventListings, getClassListings, getProgramListings, getVenueListings,
    getClassEnquiries, getVenueEnquiries, getProgramEnquiries, getPartnerListings,
} from '../../api/listings';

type ScreenVariant = 'attendees' | 'bookings';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
    /** 'attendees' = only people who attended; 'bookings' = every booking. */
    variant?: ScreenVariant;
}

type BookingStatus = 'confirmed' | 'awaiting_payment' | 'attended' | 'cancelled';
type PaymentStatus = 'paid' | 'pending' | 'refunded';
type BookingType = 'event' | 'class' | 'program' | 'venue';
type TabFilter = 'all' | BookingStatus;

interface BookingSummary {
    id: string;
    listing_id?: string;
    listing_title?: string;
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

interface PaymentSummary {
    payment_method: string | null;
    amount: number | null;
    status: string | null;
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
    /** 'enquiry' → lead-based listing; 'booking' / 'direct_booking' → direct bookings. */
    bookingType?: string;
    /** When the listing happens (ISO) — used to sort & highlight upcoming listings. */
    happenAt?: string;
    happenEnd?: string;
    isLive?: boolean;
    /** True when the card is derived from bookings (listing no longer in catalog). */
    synthetic?: boolean;
}

// Normalized enquiry row shown in a listing's Enquiries tab (shape-tolerant across
// Class / Program / Venue enquiry endpoints).
interface EnquiryRow {
    id: string;
    listingId: string;
    name: string;
    detail: string;   // batch / occasion / parent
    contact: string;  // phone / email, or 'Hidden' until unlocked
    status: string;
    createdAt: string;
}

const ENQUIRY_STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-emerald-100 text-emerald-700',
    trial_booked: 'bg-purple-100 text-purple-700',
    enrolled: 'bg-purple-100 text-purple-700',
    site_visit_scheduled: 'bg-amber-100 text-amber-700',
    closed: 'bg-gray-100 text-gray-600',
};

const pick = (...vals: unknown[]): string => {
    for (const v of vals) {
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
    }
    return '';
};

// Map a raw enquiry object (any entity) → EnquiryRow. `listingId` is passed in for
// per-listing endpoints (programs) or resolved from the payload (classes/venues).
const normalizeEnquiry = (item: any, listingId?: string): EnquiryRow => ({
    id: String(item.id ?? ''),
    listingId: listingId ?? pick(item.listing_id, item.class_id, item.venue_id, item.program_id, item.class, item.venue),
    name: pick(item.student_name, item.contact_name, item.customer_name, item.name) || 'Unknown',
    detail: pick(item.batch_name, item.occasion, item.parent_name && `Parent: ${item.parent_name}`, item.event_type),
    contact: pick(item.mobile, item.contact_number, item.phone, item.email) || 'Hidden',
    status: pick(item.status) || 'new',
    createdAt: pick(item.created_at),
});

type UpcomingState = 'live' | 'soon' | null;

const MS_TWO_DAYS = 48 * 60 * 60 * 1000;

const happenTime = (c: ListingCard): number => {
    if (!c.happenAt) return NaN;
    const t = new Date(c.happenAt).getTime();
    return Number.isNaN(t) ? NaN : t;
};

// Currently live, or happening within the next two days.
const upcomingStateOf = (c: ListingCard, nowMs: number): UpcomingState => {
    if (c.isLive) return 'live';
    const t = happenTime(c);
    if (Number.isNaN(t)) return null;
    const end = c.happenEnd ? new Date(c.happenEnd).getTime() : NaN;
    if (!Number.isNaN(end) && t <= nowMs && nowMs <= end) return 'live';
    if (t >= nowMs && t - nowMs <= MS_TWO_DAYS) return 'soon';
    // Started earlier today (no end info) → treat as live for the day
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    if (t >= startOfToday.getTime() && t <= nowMs) return 'live';
    return null;
};

// Sort: live first, then soonest upcoming, then most-recent past, then undated.
const byHappenDate = (nowMs: number) => (a: ListingCard, b: ListingCard): number => {
    const rank = (c: ListingCard): number => {
        if (upcomingStateOf(c, nowMs) === 'live') return 0;
        const t = happenTime(c);
        if (Number.isNaN(t)) return 3;
        return t >= nowMs ? 1 : 2;
    };
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    const ta = happenTime(a), tb = happenTime(b);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ra === 2 ? tb - ta : ta - tb; // past: newest first; else soonest first
};

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

type Density = 'comfortable' | 'compact' | 'list';

interface GroupItemProps {
    title: string;
    subtitle?: string;
    counts: StatusCounts;
    grad: string;
    icon: React.ElementType;
    badge?: string;
    index: number;
    onClick: () => void;
    size?: Density;
    highlight?: UpcomingState;
}

// Pill shown on listings that are live now / happening within two days.
const LivePill: React.FC<{ state: Exclude<UpcomingState, null>; className?: string }> = ({ state, className = '' }) => (
    <span className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider ${
        state === 'live' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'
    } ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-white ${state === 'live' ? 'animate-pulse' : ''}`} />
        {state === 'live' ? 'Live' : 'Soon'}
    </span>
);

// Refined, interactive card used in both the By-Listing and By-Date grids.
// `size === 'compact'` renders a denser variant for large catalogs.
const GroupCard: React.FC<GroupItemProps> = ({ title, subtitle, counts: c, grad, icon: Icon, badge, index, onClick, size = 'comfortable', highlight }) => {
    const attendedPct = c.total ? Math.round((c.attended / c.total) * 100) : 0;
    const compact = size === 'compact';
    const breakdown = [
        { label: 'Confirmed', value: c.confirmed, color: '#38BDF8' },
        { label: 'Attended', value: c.attended, color: '#34D399' },
        { label: 'Awaiting', value: c.awaiting_payment, color: '#FBBF24' },
    ];
    return (
        <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.25) }}
            onClick={onClick}
            className={`group text-left bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-shadow duration-200 overflow-hidden ${
                highlight === 'live' ? 'border-emerald-300 ring-2 ring-emerald-200' :
                highlight === 'soon' ? 'border-amber-300 ring-2 ring-amber-200' :
                'border-gray-100 hover:border-gray-200'
            }`}
        >
            {/* Banner */}
            <div className={`relative ${compact ? 'h-16 px-4 py-3' : 'h-24 px-5 py-4'} bg-gradient-to-br ${grad} flex flex-col justify-between overflow-hidden`}>
                {/* soft decorative depth */}
                <div className="absolute -right-8 -top-10 w-28 h-28 rounded-full bg-white/10" />
                <div className="absolute -right-2 top-10 w-16 h-16 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                <div className="relative z-10 flex items-start justify-between">
                    <div className={`${compact ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-white/20 ring-1 ring-white/25 backdrop-blur flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <Icon size={compact ? 16 : 20} className="text-white" />
                    </div>
                    {highlight ? (
                        <LivePill state={highlight} className={compact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'} />
                    ) : badge && (
                        <span className={`font-black rounded-full bg-white/25 text-white uppercase tracking-widest ${compact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'}`}>
                            {badge}
                        </span>
                    )}
                </div>
                {!compact && (
                    <div className="relative z-10 flex items-end justify-between">
                        <div>
                            <p className="text-2xl font-black text-white leading-none">{c.total}</p>
                            <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-1">total booking{c.total === 1 ? '' : 's'}</p>
                        </div>
                        <ChevronRight size={20} className="text-white/70 group-hover:translate-x-1 transition-transform" />
                    </div>
                )}
            </div>

            {/* Body */}
            <div className={compact ? 'p-3' : 'p-4'}>
                <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-black text-gray-900 leading-snug line-clamp-1 ${compact ? 'text-sm' : ''}`}>{title}</h3>
                    {compact && <span className="text-sm font-black text-gray-900 shrink-0">{c.total}</span>}
                </div>
                {subtitle && !compact && <p className="text-[11px] font-medium text-gray-400 mt-0.5 line-clamp-1">{subtitle}</p>}

                {!compact ? (
                    <>
                        {/* Attendance meter */}
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                                <span className="text-gray-400 uppercase tracking-wider">Attendance</span>
                                <span className="text-gray-500">
                                    <span className={attendedPct > 0 ? 'text-emerald-600' : 'text-gray-400'}>{c.attended}</span>/{c.total} · {attendedPct}%
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${attendedPct}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        {/* Status breakdown */}
                        <div className="mt-3 grid grid-cols-3 rounded-xl bg-gray-50 border border-gray-100 divide-x divide-gray-100 overflow-hidden">
                            {breakdown.map(b => (
                                <div key={b.label} className="px-2 py-2 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
                                        <p className="text-base font-black text-gray-900 leading-none">{b.value}</p>
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">{b.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* hover-revealed action hint */}
                        <div className="mt-3 flex items-center justify-end gap-1 text-[11px] font-black text-gray-300 group-hover:text-gray-900 transition-colors">
                            Manage bookings <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-gray-500">
                        {breakdown.map(b => (
                            <span key={b.label} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: b.color }} />{b.value}</span>
                        ))}
                    </div>
                )}
            </div>
        </motion.button>
    );
};

// Dense one-per-row layout — best for hundreds of listings.
const GroupRow: React.FC<GroupItemProps> = ({ title, subtitle, counts: c, grad, icon: Icon, badge, index, onClick, highlight }) => {
    const attendedPct = c.total ? Math.round((c.attended / c.total) * 100) : 0;
    return (
        <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.2) }}
            onClick={onClick}
            className={`group w-full text-left flex items-center gap-4 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all px-3.5 py-3 ${
                highlight === 'live' ? 'border-emerald-300 ring-2 ring-emerald-200' :
                highlight === 'soon' ? 'border-amber-300 ring-2 ring-amber-200' :
                'border-gray-100 hover:border-gray-200'
            }`}
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
                <Icon size={18} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-900 truncate">{title}</p>
                    {highlight
                        ? <LivePill state={highlight} className="text-[9px] px-1.5 py-0.5 shrink-0" />
                        : badge && <span className="hidden sm:inline text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wider shrink-0">{badge}</span>}
                </div>
                {subtitle && <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>}
            </div>
            {/* mini attendance bar */}
            <div className="hidden md:flex items-center gap-2 w-28 shrink-0">
                <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${attendedPct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 w-8 text-right">{attendedPct}%</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold shrink-0">
                <span className="flex items-center gap-1 text-sky-600"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" />{c.confirmed}</span>
                <span className="flex items-center gap-1 text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{c.attended}</span>
                <span className="flex items-center gap-1 text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{c.awaiting_payment}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-black text-gray-900">{c.total}</span>
                <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
            </div>
        </motion.button>
    );
};

const BookingsBase: React.FC<Props> = ({ onNavigate, onOpenSidebar, variant = 'attendees' }) => {
    const { allowedEntities } = usePartner();
    const isAttendees = variant === 'attendees';

    // ── Data ──
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [listings, setListings] = useState<ListingCard[]>([]);
    const [bookingsByListing, setBookingsByListing] = useState<Record<string, BookingSummary[]>>({});
    const [bookingsByDate, setBookingsByDate] = useState<Record<string, BookingSummary[]>>({});
    const [enquiriesByListing, setEnquiriesByListing] = useState<Record<string, EnquiryRow[]>>({});

    // ── Navigation between the two levels ──
    const [groupMode, setGroupMode] = useState<'listing' | 'date'>('listing');
    const [selected, setSelected] = useState<{ mode: 'listing' | 'date'; key: string } | null>(null);
    const [listingSearch, setListingSearch] = useState('');
    const [density, setDensityState] = useState<Density>(() => {
        try { return (localStorage.getItem('attendees_density') as Density) || 'comfortable'; } catch { return 'comfortable'; }
    });
    const setDensity = (d: Density) => {
        setDensityState(d);
        try { localStorage.setItem('attendees_density', d); } catch { /* ignore */ }
    };

    // ── Per-listing booking view ──
    const [activeTab, setActiveTab] = useState<TabFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Sub-view inside a selected listing. Enquiry-type listings default to 'enquiries';
    // booking-type listings default to 'bookings'. All listings offer 'attendees'.
    const [groupView, setGroupView] = useState<'bookings' | 'attendees' | 'enquiries'>('bookings');
    const [markingRowId, setMarkingRowId] = useState<string | null>(null);

    // ── Booking detail drawer ──
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<BookingDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [markingAttended, setMarkingAttended] = useState(false);
    const [paymentDetail, setPaymentDetail] = useState<PaymentSummary | null>(null);

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
                            // Events are always direct-booking; others carry booking_type.
                            bookingType: ent === 'Events' ? 'booking' : (item.booking_type || 'booking'),
                            happenAt: item.start_datetime || item.start_date || item.next_session_at
                                || item.next_batch_start || item.next_occurrence || item.starts_at || item.event_date || undefined,
                            happenEnd: item.end_datetime || item.end_date || undefined,
                            isLive: item.is_live === true,
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

            // Attendees screen shows ONLY attended entries; Bookings screen shows all.
            const sourceBookings = isAttendees
                ? allBookings.filter(b => b.status === 'attended')
                : allBookings;

            // Group bookings; synthesize cards for listings not in the catalog
            const grouped: Record<string, BookingSummary[]> = {};
            sourceBookings.forEach(b => {
                const key = b.listing_id || UNLINKED_KEY;
                (grouped[key] ||= []).push(b);
            });

            Object.entries(grouped).forEach(([key, list]) => {
                if (key === UNLINKED_KEY || byId.has(key)) return;
                const first = list[0];
                listingCards.push({
                    id: key,
                    title: first.listing_title || `${TYPE_META[first.booking_type]?.label || 'Listing'}`,
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
            sourceBookings.forEach(b => {
                const key = dateKeyOf(b.created_at);
                (byDate[key] ||= []).push(b);
            });

            // On the Attendees screen, hide listings that have no attended entries.
            const finalCards = isAttendees
                ? listingCards.filter(l => (grouped[l.id]?.length || 0) > 0)
                : listingCards;

            setListings(finalCards);
            setBookingsByListing(grouped);
            setBookingsByDate(byDate);

            // 3) Enquiries — best-effort, per entity. Loads in the background so the
            //    bookings grid renders immediately; each enquiry endpoint is tolerant
            //    of failure (partner may not offer that entity / not be approved).
            (async () => {
                const enquiryMap: Record<string, EnquiryRow[]> = {};
                const push = (row: EnquiryRow) => { if (row.listingId) (enquiryMap[row.listingId] ||= []).push(row); };
                const unwrapList = (res: any): any[] => Array.isArray(res) ? res : (res?.data || res?.results || res?.data?.results || []);
                const jobs: Promise<void>[] = [];
                if (wanted.includes('Classes')) {
                    jobs.push(getClassEnquiries().then((res: any) => unwrapList(res).forEach(it => push(normalizeEnquiry(it)))).catch(() => { /* ignore */ }));
                }
                if (wanted.includes('Venues')) {
                    jobs.push(getVenueEnquiries().then((res: any) => unwrapList(res).forEach(it => push(normalizeEnquiry(it)))).catch(() => { /* ignore */ }));
                }
                if (wanted.includes('Programs')) {
                    listingCards.filter(l => l.type === 'program').forEach(l => {
                        jobs.push(getProgramEnquiries(l.id).then((res: any) => unwrapList(res).forEach(it => push(normalizeEnquiry(it, l.id)))).catch(() => { /* ignore */ }));
                    });
                }
                await Promise.all(jobs);
                setEnquiriesByListing(enquiryMap);
            })();
        } catch (e: unknown) {
            setError((e as Error)?.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    }, [allowedEntities, isAttendees]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const openGroup = (mode: 'listing' | 'date', key: string) => {
        setSelected({ mode, key });
        setActiveTab('all');
        setSearchQuery('');
        // Lead-based listings open on their Enquiries tab; everything else on Bookings.
        const listing = mode === 'listing' ? listings.find(l => l.id === key) : null;
        setGroupView(listing?.bookingType === 'enquiry' ? 'enquiries' : 'bookings');
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
        setPaymentDetail(null);
        setLoadingDetail(true);
        setActionError(null);
        // Payment summary is best-effort and loads in parallel
        getBookingPaymentDetail(id)
            .then((res: any) => setPaymentDetail(res?.data || res))
            .catch(() => setPaymentDetail(null));
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
        setPaymentDetail(null);
        setActionError(null);
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

    // Mark a confirmed booking as attended directly from the roster row (no drawer).
    const markAttendedInline = async (id: string) => {
        setMarkingRowId(id);
        try {
            const res = await markBookingAttended(id);
            const updated = res?.data || res;
            patchBooking(id, { status: 'attended' });
            setDetail(prev => (prev && prev.id === id ? { ...prev, ...updated, status: 'attended' } : prev));
        } catch (e: unknown) {
            toast.error((e as Error)?.message || 'Failed to mark as attended');
        } finally {
            setMarkingRowId(null);
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
    const groupRevenue = listingBookings.reduce((s, b) => s + (Number(b.total_amount) || 0), 0);
    const groupGuests = new Set(listingBookings.map(b => b.customer_email).filter(Boolean)).size;
    const groupKpis: { label: string; value: number | string; color: string; bg: string }[] = isAttendees
        ? [
            { label: 'Attended', value: listingCounts.total, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Unique Guests', value: groupGuests, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Revenue', value: formatAmount(groupRevenue), color: 'text-gray-900', bg: 'bg-white' },
        ]
        : [
            { label: 'Total Bookings', value: listingCounts.total, color: 'text-gray-900', bg: 'bg-white' },
            { label: 'Awaiting Payment', value: listingCounts.awaiting_payment, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Confirmed', value: listingCounts.confirmed, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Attended', value: listingCounts.attended, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Cancelled', value: listingCounts.cancelled, color: 'text-red-500', bg: 'bg-red-50' },
        ];

    // Title / subtitle for the drill-down header (works for listing or date)
    const detailTitle = !selected
        ? (isAttendees ? 'Attendees' : 'Bookings & Enquiries')
        : selected.mode === 'listing'
            ? (selectedListing?.title || 'Listing')
            : formatFullDate(selected.key);
    const detailSubtitle = !selected
        ? (isAttendees ? 'People who attended your listings' : 'Bookings, enquiries & attendance across your listings')
        : selected.mode === 'listing' && selectedListing
            ? `${TYPE_META[selectedListing.type].label} · ${listingCounts.total} booking${listingCounts.total === 1 ? '' : 's'}`
            : `${listingCounts.total} booking${listingCounts.total === 1 ? '' : 's'} · ${new Set(listingBookings.map(b => b.listing_id || UNLINKED_KEY)).size} listing${new Set(listingBookings.map(b => b.listing_id || UNLINKED_KEY)).size === 1 ? '' : 's'}`;

    const tabFiltered = activeTab === 'all'
        ? listingBookings
        : listingBookings.filter(b => b.status === activeTab);
    const matchesSearch = (b: BookingSummary) => {
        const q = searchQuery.toLowerCase();
        return (
            b.customer_name.toLowerCase().includes(q) ||
            b.customer_email.toLowerCase().includes(q) ||
            b.booking_reference.toLowerCase().includes(q)
        );
    };
    const filtered = tabFiltered.filter(matchesSearch);

    const [bookingPage, setBookingPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    useEffect(() => { setBookingPage(1); }, [searchQuery, activeTab]);
    const totalBookingPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedBookings = filtered.slice((bookingPage - 1) * ITEMS_PER_PAGE, bookingPage * ITEMS_PER_PAGE);

    // Attendee check-in roster: confirmed (to check in) + already-attended guests.
    const attendeeRoster = listingBookings
        .filter(b => b.status === 'confirmed' || b.status === 'attended')
        .filter(matchesSearch);

    // Enquiries for the selected listing (lead-based listings only).
    const isEnquiryListing = selectedListing?.bookingType === 'enquiry';
    const listingEnquiries = (selected?.mode === 'listing' ? (enquiriesByListing[selected.key] || []) : [])
        .filter(e => {
            const q = searchQuery.toLowerCase();
            return e.name.toLowerCase().includes(q) || e.contact.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q);
        });

    // Shared search input (reused by the bookings table, attendee roster & enquiries).
    const searchBlock = (
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
    );

    const nowMs = Date.now();
    const startOfTodayMs = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
    const visibleListings = listings
        .filter(l => l.title.toLowerCase().includes(listingSearch.toLowerCase()))
        // Bookings screen: always order by when the listing is due to happen.
        .sort(isAttendees ? () => 0 : byHappenDate(nowMs));
    // A listing is "history" once its happen date has passed (and it isn't live now).
    const isPastListing = (l: ListingCard) => {
        const t = happenTime(l);
        return !Number.isNaN(t) && t < startOfTodayMs && upcomingStateOf(l, nowMs) !== 'live';
    };
    const currentListings = visibleListings.filter(l => !isPastListing(l));
    const historyListings = visibleListings
        .filter(isPastListing)
        .sort((a, b) => happenTime(b) - happenTime(a)); // most recent first

    const allBookings: BookingSummary[] = [];
    Object.keys(bookingsByDate).forEach(k => allBookings.push(...bookingsByDate[k]));
    const globalCounts = computeCounts(allBookings);
    const uniqueCustomers = new Set(allBookings.map(b => b.customer_email).filter(Boolean)).size;

    const globalKpis = isAttendees
        ? [
            { label: 'Total Attended', value: globalCounts.total, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Listings', value: listings.length, icon: Layers, color: 'text-tlb-dark', bg: 'bg-tlb-yellow/15' },
            { label: 'Days', value: Object.keys(bookingsByDate).length, icon: CalendarDays, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Unique Guests', value: uniqueCustomers, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        ]
        : [
            { label: 'Total Bookings', value: globalCounts.total, icon: Users, color: 'text-tlb-dark', bg: 'bg-tlb-yellow/15' },
            { label: 'Confirmed', value: globalCounts.confirmed, icon: CalendarDays, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Attended', value: globalCounts.attended, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Awaiting Payment', value: globalCounts.awaiting_payment, icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
        ];

    const ItemComp = density === 'list' ? GroupRow : GroupCard;
    const gridClass = density === 'list'
        ? 'grid grid-cols-1 gap-2.5'
        : density === 'compact'
            ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3'
            : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5';

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
                <header className="bg-white px-6 md:px-10 py-5 flex items-center justify-between gap-4 sticky top-0 z-30 border-b border-gray-100">
                    <div className="flex items-center gap-4 min-w-0">
                        {selected && (
                            <button onClick={backToListings} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-900">
                                <ArrowLeft size={22} />
                                <span className="hidden sm:inline text-sm font-bold">Back</span>
                            </button>
                        )}
                        <div className="min-w-0">
                            <h1 className="tlb-page-title truncate">{detailTitle}</h1>
                            <p className="tlb-page-sub">{detailSubtitle}</p>
                        </div>
                    </div>
                    {/* Back to the Listings hub (parent of this screen) */}
                    {!selected && (
                        <button
                            onClick={() => onNavigate('SERVICE_LISTINGS')}
                            className="shrink-0 flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-bold text-xs px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft size={15} /> <span className="hidden sm:inline">Listings</span>
                        </button>
                    )}
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
                                {/* Summary KPI strip */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                    {globalKpis.map(({ label, value, icon: Icon, color, bg }) => (
                                        <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                                                <Icon size={20} className={color} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 truncate">{label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

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
                                    <div className="flex items-center gap-3">
                                        {/* Density / view control */}
                                        <div className="inline-flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm shrink-0">
                                            {([
                                                { v: 'comfortable' as const, icon: LayoutGrid, label: 'Comfortable' },
                                                { v: 'compact' as const, icon: Grid3X3, label: 'Compact' },
                                                { v: 'list' as const, icon: List, label: 'List' },
                                            ]).map(({ v, icon: Icon, label }) => (
                                                <button
                                                    key={v}
                                                    onClick={() => setDensity(v)}
                                                    title={label}
                                                    aria-label={label}
                                                    className={`p-2 rounded-lg transition-all ${density === v ? 'bg-tlb-dark text-white' : 'text-gray-400 hover:text-gray-700'}`}
                                                >
                                                    <Icon size={16} />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex-1 md:w-64 md:flex-none">
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
                                </div>

                                <AnimatePresence mode="wait">
                                    {groupMode === 'listing' ? (
                                        <motion.div
                                            key="by-listing"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.18 }}
                                            className="space-y-6"
                                        >
                                            <div className={gridClass}>
                                                {currentListings.map((l, i) => {
                                                    const meta = TYPE_META[l.type];
                                                    const c = computeCounts(bookingsByListing[l.id] || []);
                                                    return (
                                                        <ItemComp
                                                            key={l.id}
                                                            index={i}
                                                            title={l.title}
                                                            subtitle={meta.label}
                                                            counts={c}
                                                            grad={meta.grad}
                                                            icon={meta.icon}
                                                            badge={meta.label}
                                                            size={density}
                                                            highlight={isAttendees ? null : upcomingStateOf(l, nowMs)}
                                                            onClick={() => openGroup('listing', l.id)}
                                                        />
                                                    );
                                                })}
                                                {visibleListings.length === 0 && (
                                                    <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
                                                        <Inbox size={30} className="text-gray-200" />
                                                        <p className="text-sm font-bold text-gray-400">No listings match “{listingSearch}”</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* History — listings whose date has already passed */}
                                            {historyListings.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <History size={15} className="text-gray-400" />
                                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">History</h3>
                                                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{historyListings.length}</span>
                                                    </div>
                                                    <div className={`${gridClass} opacity-80`}>
                                                        {historyListings.map((l, i) => {
                                                            const meta = TYPE_META[l.type];
                                                            const c = computeCounts(bookingsByListing[l.id] || []);
                                                            return (
                                                                <ItemComp
                                                                    key={l.id}
                                                                    index={i}
                                                                    title={l.title}
                                                                    subtitle={meta.label}
                                                                    counts={c}
                                                                    grad={meta.grad}
                                                                    icon={meta.icon}
                                                                    badge={meta.label}
                                                                    size={density}
                                                                    highlight={null}
                                                                    onClick={() => openGroup('listing', l.id)}
                                                                />
                                                            );
                                                        })}
                                                    </div>
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
                                            className={gridClass}
                                        >
                                            {visibleDates.map(([key, list], i) => {
                                                const c = computeCounts(list);
                                                const distinct = new Set(list.map(b => b.listing_id || UNLINKED_KEY)).size;
                                                return (
                                                    <ItemComp
                                                        key={key}
                                                        index={i}
                                                        title={formatFullDate(key)}
                                                        subtitle={`${distinct} listing${distinct === 1 ? '' : 's'}`}
                                                        counts={c}
                                                        grad="from-slate-600 to-slate-900"
                                                        icon={CalendarDays}
                                                        badge={formatWeekday(key) || undefined}
                                                        size={density}
                                                        onClick={() => openGroup('date', key)}
                                                    />
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
                        <div className={`grid grid-cols-2 gap-4 ${isAttendees ? 'lg:grid-cols-3' : 'lg:grid-cols-5'}`}>
                            {groupKpis.map(card => (
                                <div key={card.label} className={`${card.bg} rounded-2xl p-5 border border-gray-100 shadow-sm`}>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{card.label}</p>
                                    <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Table card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* View toggle — Enquiries/Bookings + Attendees, per listing type */}
                            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100">
                                <div className="inline-flex bg-gray-100 rounded-xl p-1">
                                    {(isEnquiryListing
                                        ? [
                                            { k: 'enquiries' as const, label: 'Enquiries', icon: MessageCircle },
                                            { k: 'attendees' as const, label: 'Attendees', icon: CheckCircle },
                                        ]
                                        : [
                                            { k: 'bookings' as const, label: 'Bookings', icon: List },
                                            { k: 'attendees' as const, label: 'Attendees', icon: CheckCircle },
                                        ]
                                    ).map(v => (
                                        <button
                                            key={v.k}
                                            onClick={() => setGroupView(v.k)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${groupView === v.k ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <v.icon size={15} /> {v.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] font-bold text-gray-400 hidden sm:block">
                                    {groupView === 'attendees'
                                        ? `${listingCounts.attended}/${listingCounts.confirmed + listingCounts.attended} checked in`
                                        : groupView === 'enquiries'
                                            ? `${listingEnquiries.length} enquir${listingEnquiries.length === 1 ? 'y' : 'ies'}`
                                            : `${listingCounts.total} booking${listingCounts.total === 1 ? '' : 's'}`}
                                </p>
                            </div>

                            {groupView === 'bookings' ? (
                                <>
                                    {/* Status tabs */}
                                    {!isAttendees && (
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
                                    )}

                                    {searchBlock}

                                    {/* Bookings table body */}
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
                                                        {['Booking Ref', 'Customer', ...(selected.mode === 'date' ? ['Listing'] : []), 'Status', 'Payment', 'Amount', 'Date', ''].map(h => (
                                                            <th key={h || 'actions'} className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {paginatedBookings.map(b => (
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
                                                            {selected.mode === 'date' && (
                                                                <td className="px-5 py-4">
                                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                                        {React.createElement(TYPE_META[b.booking_type]?.icon || Layers, { size: 13, className: 'text-gray-400 shrink-0' })}
                                                                        <span className="truncate max-w-[180px]">{b.listing_title || '—'}</span>
                                                                    </span>
                                                                </td>
                                                            )}
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
                                        <Pagination 
                                            currentPage={bookingPage}
                                            totalPages={totalBookingPages}
                                            totalItems={filtered.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                            onPageChange={setBookingPage}
                                        />
                                    </div>
                                </>
                            ) : groupView === 'enquiries' ? (
                                <>
                                    {searchBlock}

                                    {/* Enquiries — lead-based listings */}
                                    <div className="overflow-x-auto">
                                        {listingEnquiries.length === 0 ? (
                                            <div className="flex flex-col items-center gap-2 py-20 text-center">
                                                <MessageCircle size={32} className="text-gray-200" />
                                                <p className="text-sm font-bold text-gray-400">
                                                    {searchQuery ? 'No enquiries match your search' : 'No enquiries yet for this listing'}
                                                </p>
                                                <p className="text-xs text-gray-400">Leads for this listing will appear here.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                                        {['Enquirer', 'Details', 'Received', 'Contact', 'Status'].map(h => (
                                                            <th key={h} className={`px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap ${h === 'Status' ? 'text-right' : ''}`}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {listingEnquiries.map(e => {
                                                        const hidden = !e.contact || e.contact === 'Hidden';
                                                        const wa = e.contact.replace(/[^\d]/g, '');
                                                        return (
                                                            <tr key={e.id} className="hover:bg-gray-50/40 transition-colors">
                                                                <td className="px-5 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-black shrink-0">
                                                                            {(e.name.trim()[0] || '?').toUpperCase()}
                                                                        </div>
                                                                        <p className="font-bold text-sm text-gray-900 whitespace-nowrap">{e.name}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4 text-sm text-gray-500 font-medium">{e.detail || '—'}</td>
                                                                <td className="px-5 py-4 text-sm text-gray-500 font-medium whitespace-nowrap">{e.createdAt ? formatDate(e.createdAt) : '—'}</td>
                                                                <td className="px-5 py-4">
                                                                    {hidden ? (
                                                                        <span className="text-xs font-bold text-gray-300">Hidden</span>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-mono text-xs font-bold text-gray-700 whitespace-nowrap">{e.contact}</span>
                                                                            <a href={`tel:${e.contact}`} className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"><Phone size={13} /></a>
                                                                            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"><MessageCircle size={13} /></a>}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${ENQUIRY_STATUS_COLORS[e.status] || FALLBACK_BADGE}`}>
                                                                        {e.status.replace(/_/g, ' ')}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {searchBlock}

                                    {/* Attendee check-in roster */}
                                    <div className="overflow-x-auto">
                                        {attendeeRoster.length === 0 ? (
                                            <div className="flex flex-col items-center gap-2 py-20 text-center">
                                                <Users size={32} className="text-gray-200" />
                                                <p className="text-sm font-bold text-gray-400">
                                                    {searchQuery ? 'No guests match your search' : 'No confirmed guests to check in yet'}
                                                </p>
                                                <p className="text-xs text-gray-400">Confirmed bookings appear here so you can mark attendance.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                                        {['Customer', 'Booking Ref', 'Status', 'Attendance'].map(h => (
                                                            <th key={h} className={`px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap ${h === 'Attendance' ? 'text-right' : ''}`}>
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {attendeeRoster.map(b => {
                                                        const attended = b.status === 'attended';
                                                        const marking = markingRowId === b.id;
                                                        return (
                                                            <tr key={b.id} className="hover:bg-gray-50/40 transition-colors cursor-pointer" onClick={() => handleViewDetail(b.id)}>
                                                                <td className="px-5 py-4">
                                                                    <p className="font-bold text-sm text-gray-900 whitespace-nowrap">{b.customer_name}</p>
                                                                    <p className="text-xs text-gray-400 font-medium mt-0.5">{b.customer_email}</p>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap">
                                                                        {b.booking_reference}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${STATUS_COLORS[b.status] || FALLBACK_BADGE}`}>
                                                                        {b.status.replace(/_/g, ' ')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    {attended ? (
                                                                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600">
                                                                            <CheckCircle size={15} /> Attended
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); markAttendedInline(b.id); }}
                                                                            disabled={marking}
                                                                            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                                        >
                                                                            {marking ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />} Mark Attended
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </>
                            )}
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

                                        {paymentDetail && (paymentDetail.payment_method || paymentDetail.amount != null || paymentDetail.status) && (
                                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Wallet size={11} /> Payment Summary
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500 font-medium">Method</span>
                                                    <span className="text-sm font-bold text-gray-900 capitalize">{paymentDetail.payment_method?.replace(/_/g, ' ') || '—'}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500 font-medium">Amount</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {paymentDetail.amount != null ? formatAmount(paymentDetail.amount, detail.currency) : '—'}
                                                    </span>
                                                </div>
                                                {paymentDetail.status && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-500 font-medium">Status</span>
                                                        <span className="text-sm font-bold text-gray-900 capitalize">{paymentDetail.status.replace(/_/g, ' ')}</span>
                                                    </div>
                                                )}
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

                                {detail.status === 'confirmed' && (
                                    <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4">
                                        <button
                                            onClick={handleMarkAttended}
                                            disabled={markingAttended}
                                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-3 rounded-2xl transition-colors disabled:opacity-50"
                                        >
                                            {markingAttended
                                                ? <RefreshCw size={15} className="animate-spin" />
                                                : <CheckCircle size={15} />}
                                            Mark Attended
                                        </button>
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

const Attendees: React.FC<Props> = (props) => <BookingsBase {...props} variant="attendees" />;
export const Bookings: React.FC<Props> = (props) => <BookingsBase {...props} variant="bookings" />;

export default Attendees;
