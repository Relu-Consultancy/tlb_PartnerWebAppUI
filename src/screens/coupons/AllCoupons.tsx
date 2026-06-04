import React, { useMemo, useState } from 'react';
import {
    Menu, Ticket, Plus, Search, Sparkles, CalendarClock, Users, Tag,
    Copy, Check, Layers, Percent, IndianRupee,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../../types';
import type { Coupon } from '../../api/coupons';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

// ---------------------------------------------------------------------------
// Mock data
// `source` distinguishes coupons created from the standalone Create Coupon
// screen vs. those generated inline while creating a listing.
// ---------------------------------------------------------------------------
type CouponSource = 'standalone' | 'listing';

interface MockCoupon extends Coupon {
    source: CouponSource;
    /** Listing this coupon was created alongside (source = 'listing'). */
    listingTitle?: string;
}

const MOCK_COUPONS: MockCoupon[] = [
    {
        id: 'c1', code: 'WELCOME20', description: 'New customer welcome offer',
        discount_type: 'percentage', discount_value: 20, max_discount: 500,
        min_order_value: 1000, usage_limit: 100, used_count: 37,
        applies_to: 'all_listings', target_id: null,
        starts_at: '2026-05-01', expires_at: '2026-12-31', is_active: true,
        created_at: '2026-05-01T10:00:00Z', source: 'standalone',
    },
    {
        id: 'c2', code: 'FLAT500', description: 'Flat ₹500 off on bookings',
        discount_type: 'fixed', discount_value: 500, max_discount: null,
        min_order_value: 2500, usage_limit: null, used_count: 12,
        applies_to: 'all_listings', target_id: null,
        starts_at: null, expires_at: null, is_active: true,
        created_at: '2026-04-18T10:00:00Z', source: 'standalone',
    },
    {
        id: 'c3', code: 'SUMMERCAMP10', description: 'Early-bird discount',
        discount_type: 'percentage', discount_value: 10, max_discount: null,
        min_order_value: null, usage_limit: 50, used_count: 50,
        applies_to: 'specific_listing', target_id: 'Summer Art Camp 2026',
        starts_at: '2026-03-01', expires_at: '2026-05-31', is_active: true,
        created_at: '2026-03-01T10:00:00Z', source: 'listing',
        listingTitle: 'Summer Art Camp 2026',
    },
    {
        id: 'c4', code: 'DANCE15', description: 'Dance classes promo',
        discount_type: 'percentage', discount_value: 15, max_discount: 300,
        min_order_value: null, usage_limit: 200, used_count: 84,
        applies_to: 'category', target_id: 'Dance',
        starts_at: '2026-06-01', expires_at: '2026-08-31', is_active: true,
        created_at: '2026-05-20T10:00:00Z', source: 'standalone',
    },
    {
        id: 'c5', code: 'YOGAEARLY', description: 'Pre-launch offer for Morning Yoga batch',
        discount_type: 'fixed', discount_value: 250, max_discount: null,
        min_order_value: 1500, usage_limit: 30, used_count: 8,
        applies_to: 'specific_listing', target_id: 'Morning Yoga Batch',
        starts_at: '2026-07-01', expires_at: '2026-09-30', is_active: true,
        created_at: '2026-06-02T10:00:00Z', source: 'listing',
        listingTitle: 'Morning Yoga Batch',
    },
    {
        id: 'c6', code: 'NEWYEAR25', description: 'New Year flash sale',
        discount_type: 'percentage', discount_value: 25, max_discount: 750,
        min_order_value: 2000, usage_limit: 150, used_count: 150,
        applies_to: 'all_listings', target_id: null,
        starts_at: '2025-12-25', expires_at: '2026-01-05', is_active: false,
        created_at: '2025-12-20T10:00:00Z', source: 'standalone',
    },
    {
        id: 'c7', code: 'MUSICFEST', description: 'Music workshop intro offer',
        discount_type: 'fixed', discount_value: 200, max_discount: null,
        min_order_value: null, usage_limit: 40, used_count: 5,
        applies_to: 'specific_listing', target_id: 'Guitar Workshop',
        starts_at: '2026-02-01', expires_at: '2026-04-01', is_active: false,
        created_at: '2026-01-15T10:00:00Z', source: 'listing',
        listingTitle: 'Guitar Workshop',
    },
];

// ---------------------------------------------------------------------------
// Status derivation
// ---------------------------------------------------------------------------
type CouponStatus = 'active' | 'scheduled' | 'expired' | 'exhausted' | 'paused';

const TODAY = '2026-06-04'; // currentDate

const deriveStatus = (c: MockCoupon): CouponStatus => {
    if (!c.is_active) return 'paused';
    if (c.expires_at && c.expires_at < TODAY) return 'expired';
    if (c.usage_limit !== null && c.used_count >= c.usage_limit) return 'exhausted';
    if (c.starts_at && c.starts_at > TODAY) return 'scheduled';
    return 'active';
};

const STATUS_STYLE: Record<CouponStatus, { label: string; cls: string; dot: string }> = {
    active:    { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500' },
    expired:   { label: 'Expired',   cls: 'bg-gray-100 text-gray-500 border-gray-200',         dot: 'bg-gray-400' },
    exhausted: { label: 'Used up',   cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
    paused:    { label: 'Paused',    cls: 'bg-red-50 text-red-600 border-red-200',             dot: 'bg-red-400' },
};

const fmtDiscount = (c: MockCoupon) =>
    c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`;

const fmtDate = (iso: string | null) => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[Number(m) - 1]} ${y}`;
};

const appliesLabel = (c: MockCoupon) =>
    c.applies_to === 'all_listings' ? 'All listings'
        : c.applies_to === 'category' ? `${c.target_id} category`
            : c.target_id || 'Specific listing';

// ---------------------------------------------------------------------------
// Coupon card
// ---------------------------------------------------------------------------
const CouponCard: React.FC<{ coupon: MockCoupon; index: number }> = ({ coupon, index }) => {
    const [copied, setCopied] = useState(false);
    const status = deriveStatus(coupon);
    const st = STATUS_STYLE[status];
    const faded = status === 'expired' || status === 'paused';
    const usagePct = coupon.usage_limit
        ? Math.min(100, Math.round((coupon.used_count / coupon.usage_limit) * 100))
        : null;

    const copyCode = () => {
        navigator.clipboard?.writeText(coupon.code).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
            className="tlb-card !p-0 overflow-hidden flex flex-col"
        >
            {/* Ticket header */}
            <div className={`relative bg-gradient-to-br from-tlb-dark to-gray-900 p-5 text-white overflow-hidden ${faded ? 'opacity-80' : ''}`}>
                <Sparkles size={64} className="absolute -right-3 -top-3 text-tlb-yellow/15" />
                <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 shrink-0 bg-tlb-yellow/15 border border-tlb-yellow/30 rounded-xl flex items-center justify-center">
                            {coupon.discount_type === 'percentage'
                                ? <Percent size={18} className="text-tlb-yellow" />
                                : <IndianRupee size={18} className="text-tlb-yellow" />}
                        </div>
                        <div className="min-w-0">
                            <button
                                onClick={copyCode}
                                className="group flex items-center gap-1.5 font-mono font-bold tracking-wider text-base hover:text-tlb-yellow transition-colors"
                                title="Copy code"
                            >
                                <span className="truncate">{coupon.code}</span>
                                {copied
                                    ? <Check size={13} className="text-emerald-400 shrink-0" />
                                    : <Copy size={13} className="text-gray-400 group-hover:text-tlb-yellow shrink-0" />}
                            </button>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                                {fmtDiscount(coupon)} {coupon.discount_type === 'percentage' ? 'off' : 'flat off'}
                            </p>
                        </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                    </span>
                </div>
                {/* perforation */}
                <div className="absolute -left-2 bottom-0 w-4 h-4 rounded-full bg-gray-50 translate-y-1/2" />
                <div className="absolute -right-2 bottom-0 w-4 h-4 rounded-full bg-gray-50 translate-y-1/2" />
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col flex-1 gap-3">
                {coupon.description && (
                    <p className="text-sm text-gray-600 leading-snug">{coupon.description}</p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Tag size={13} className="text-gray-400" /> {appliesLabel(coupon)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CalendarClock size={13} className="text-gray-400" />
                        {coupon.expires_at ? `Until ${fmtDate(coupon.expires_at)}` : 'No expiry'}
                    </span>
                </div>

                {/* Usage */}
                <div className="mt-auto pt-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1.5"><Users size={12} /> Redemptions</span>
                        <span>{coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' · unlimited'}</span>
                    </div>
                    {usagePct !== null && (
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${usagePct >= 100 ? 'bg-amber-400' : 'bg-tlb-yellow'}`}
                                style={{ width: `${usagePct}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Source chip */}
                <div className="pt-1">
                    {coupon.source === 'listing' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
                            <Layers size={11} /> From listing · {coupon.listingTitle}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 text-[10px] font-bold border border-gray-200">
                            <Ticket size={11} /> Standalone coupon
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
type FilterKey = 'all' | 'standalone' | 'listing' | 'active' | 'expired';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'standalone', label: 'Standalone' },
    { key: 'listing', label: 'From Listings' },
    { key: 'active', label: 'Active' },
    { key: 'expired', label: 'Expired' },
];

export const AllCoupons: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [filter, setFilter] = useState<FilterKey>('all');
    const [query, setQuery] = useState('');

    const stats = useMemo(() => {
        const active = MOCK_COUPONS.filter(c => deriveStatus(c) === 'active').length;
        const redemptions = MOCK_COUPONS.reduce((sum, c) => sum + c.used_count, 0);
        const fromListings = MOCK_COUPONS.filter(c => c.source === 'listing').length;
        return { total: MOCK_COUPONS.length, active, redemptions, fromListings };
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return MOCK_COUPONS.filter((c) => {
            if (filter === 'standalone' && c.source !== 'standalone') return false;
            if (filter === 'listing' && c.source !== 'listing') return false;
            if (filter === 'active' && deriveStatus(c) !== 'active') return false;
            if (filter === 'expired' && deriveStatus(c) !== 'expired') return false;
            if (q && !c.code.toLowerCase().includes(q) && !(c.description || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [filter, query]);

    const statCards = [
        { label: 'Total Coupons', value: stats.total, icon: Ticket },
        { label: 'Active Now', value: stats.active, icon: Check },
        { label: 'Total Redemptions', value: stats.redemptions, icon: Users },
        { label: 'From Listings', value: stats.fromListings, icon: Layers },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white/90 backdrop-blur-sm px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
                <div className="flex-1">
                    <h1 className="tlb-page-title">Coupons</h1>
                    <p className="tlb-page-sub">All discount codes created by you and within your listings</p>
                </div>
                <button onClick={() => onNavigate('CREATE_COUPON')} className="tlb-button hidden sm:inline-flex">
                    <Plus size={18} /> Create Coupon
                </button>
            </header>

            <main className="p-5 md:p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {statCards.map(({ label, value, icon: Icon }) => (
                            <div key={label} className="tlb-card flex items-center gap-3 !p-4">
                                <div className="w-10 h-10 rounded-xl bg-tlb-yellow/15 flex items-center justify-center shrink-0">
                                    <Icon size={18} className="text-tlb-dark" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl font-black leading-none">{value}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div className="flex flex-wrap gap-2">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border transition-all ${
                                        filter === f.key
                                            ? 'bg-tlb-dark text-white border-tlb-dark'
                                            : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="relative md:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search code or description"
                                className="tlb-input !pl-9 !py-2.5"
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    {filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                            {filtered.map((c, i) => <CouponCard key={c.id} coupon={c} index={i} />)}
                        </div>
                    ) : (
                        <div className="tlb-card flex flex-col items-center justify-center text-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                <Ticket size={28} className="text-gray-400" />
                            </div>
                            <h3 className="tlb-h3">No coupons found</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-xs">
                                {query || filter !== 'all'
                                    ? 'Try a different filter or search term.'
                                    : 'You haven’t created any coupons yet.'}
                            </p>
                            <button onClick={() => onNavigate('CREATE_COUPON')} className="tlb-button mt-5">
                                <Plus size={18} /> Create your first coupon
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile FAB */}
            <button
                onClick={() => onNavigate('CREATE_COUPON')}
                className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-tlb-yellow text-tlb-dark shadow-xl flex items-center justify-center"
                aria-label="Create coupon"
            >
                <Plus size={26} />
            </button>
        </div>
    );
};

export default AllCoupons;
