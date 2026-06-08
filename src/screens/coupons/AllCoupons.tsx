import React, { useEffect, useMemo, useState } from 'react';
import {
    Menu, Ticket, Plus, Search, Sparkles, CalendarClock, Users,
    Copy, Check, Percent, IndianRupee, RefreshCw, AlertCircle, Power,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../../types';
import { getCoupons, deactivateCoupon } from '../../api/coupons';
import { toast } from '../../components/ui';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

// Display model — superset of the list-endpoint fields plus a few optional
// detail fields used by the demo fallback.
interface DisplayCoupon {
    id: string;
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    is_active: boolean;
    usage_count: number;
    usage_limit: number | null;
    expires_at: string | null;
    description?: string;
    starts_at?: string | null;
    max_discount?: number | null;
}

// ---------------------------------------------------------------------------
// Sample data — shown only when the live coupons service can't be reached
// (e.g. partner not yet approved / endpoint unavailable).
// ---------------------------------------------------------------------------
const MOCK_COUPONS: DisplayCoupon[] = [
    { id: 'c1', code: 'WELCOME20', description: 'New customer welcome offer', discount_type: 'percent', discount_value: 20, max_discount: 500, usage_limit: 100, usage_count: 37, starts_at: '2026-05-01', expires_at: '2026-12-31', is_active: true },
    { id: 'c2', code: 'FLAT500', description: 'Flat ₹500 off on bookings', discount_type: 'fixed', discount_value: 500, usage_limit: null, usage_count: 12, starts_at: null, expires_at: null, is_active: true },
    { id: 'c3', code: 'SUMMERCAMP10', description: 'Early-bird discount', discount_type: 'percent', discount_value: 10, usage_limit: 50, usage_count: 50, starts_at: '2026-03-01', expires_at: '2026-05-31', is_active: true },
    { id: 'c4', code: 'DANCE15', description: 'Dance classes promo', discount_type: 'percent', discount_value: 15, max_discount: 300, usage_limit: 200, usage_count: 84, starts_at: '2026-06-01', expires_at: '2026-08-31', is_active: true },
    { id: 'c6', code: 'NEWYEAR25', description: 'New Year flash sale', discount_type: 'percent', discount_value: 25, max_discount: 750, usage_limit: 150, usage_count: 150, starts_at: '2025-12-25', expires_at: '2026-01-05', is_active: false },
];

// ---------------------------------------------------------------------------
// Status derivation
// ---------------------------------------------------------------------------
type CouponStatus = 'active' | 'scheduled' | 'expired' | 'exhausted' | 'inactive';

const TODAY = '2026-06-05'; // currentDate

const dayPart = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : null);

const deriveStatus = (c: DisplayCoupon): CouponStatus => {
    if (!c.is_active) return 'inactive';
    const exp = dayPart(c.expires_at);
    const start = dayPart(c.starts_at);
    if (exp && exp < TODAY) return 'expired';
    if (c.usage_limit !== null && c.usage_count >= c.usage_limit) return 'exhausted';
    if (start && start > TODAY) return 'scheduled';
    return 'active';
};

const STATUS_STYLE: Record<CouponStatus, { label: string; cls: string; dot: string }> = {
    active:    { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500' },
    expired:   { label: 'Expired',   cls: 'bg-gray-100 text-gray-500 border-gray-200',         dot: 'bg-gray-400' },
    exhausted: { label: 'Used up',   cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
    inactive:  { label: 'Inactive',  cls: 'bg-red-50 text-red-600 border-red-200',             dot: 'bg-red-400' },
};

const fmtDiscount = (c: DisplayCoupon) =>
    c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`;

const fmtDate = (iso: string | null) => {
    const d = dayPart(iso);
    if (!d) return null;
    const [y, m, day] = d.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[Number(m) - 1]} ${y}`;
};

// ---------------------------------------------------------------------------
// Coupon card
// ---------------------------------------------------------------------------
const CouponCard: React.FC<{
    coupon: DisplayCoupon;
    index: number;
    deactivating: boolean;
    onDeactivate: (id: string) => void;
}> = ({ coupon, index, deactivating, onDeactivate }) => {
    const [copied, setCopied] = useState(false);
    const status = deriveStatus(coupon);
    const st = STATUS_STYLE[status];
    const faded = status === 'expired' || status === 'inactive';
    const usagePct = coupon.usage_limit
        ? Math.min(100, Math.round((coupon.usage_count / coupon.usage_limit) * 100))
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
                            {coupon.discount_type === 'percent'
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
                                {fmtDiscount(coupon)} {coupon.discount_type === 'percent' ? 'off' : 'flat off'}
                                {coupon.discount_type === 'percent' && coupon.max_discount ? ` · up to ₹${coupon.max_discount}` : ''}
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
                        <CalendarClock size={13} className="text-gray-400" />
                        {coupon.expires_at ? `Until ${fmtDate(coupon.expires_at)}` : 'No expiry'}
                    </span>
                </div>

                {/* Usage */}
                <div className="mt-auto pt-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1.5"><Users size={12} /> Redemptions</span>
                        <span>{coupon.usage_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' · unlimited'}</span>
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

                {/* Deactivate */}
                {coupon.is_active && (
                    <div className="pt-1">
                        <button
                            onClick={() => onDeactivate(coupon.id)}
                            disabled={deactivating}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            {deactivating ? <RefreshCw size={12} className="animate-spin" /> : <Power size={12} />}
                            Deactivate
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
type FilterKey = 'all' | 'active' | 'scheduled' | 'expired' | 'inactive';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'expired', label: 'Expired' },
    { key: 'inactive', label: 'Inactive' },
];

export const AllCoupons: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [coupons, setCoupons] = useState<DisplayCoupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [usingSample, setUsingSample] = useState(false);
    const [filter, setFilter] = useState<FilterKey>('all');
    const [query, setQuery] = useState('');
    const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await getCoupons();
            setCoupons(list as DisplayCoupon[]);
            setUsingSample(false);
        } catch {
            // Coupons service unreachable / partner not approved — show sample data
            setCoupons(MOCK_COUPONS);
            setUsingSample(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDeactivate = async (id: string) => {
        if (usingSample) {
            // Demo mode — just flip locally
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
            toast.success('Coupon deactivated.');
            return;
        }
        setDeactivatingId(id);
        try {
            await deactivateCoupon(id);
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
            toast.success('Coupon deactivated.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to deactivate coupon.');
        } finally {
            setDeactivatingId(null);
        }
    };

    const stats = useMemo(() => {
        const active = coupons.filter(c => deriveStatus(c) === 'active').length;
        const redemptions = coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0);
        const inactive = coupons.filter(c => !c.is_active).length;
        return { total: coupons.length, active, redemptions, inactive };
    }, [coupons]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return coupons.filter((c) => {
            if (filter !== 'all' && deriveStatus(c) !== filter) return false;
            if (q && !c.code.toLowerCase().includes(q) && !(c.description || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [coupons, filter, query]);

    const statCards = [
        { label: 'Total Coupons', value: stats.total, icon: Ticket },
        { label: 'Active Now', value: stats.active, icon: Check },
        { label: 'Total Redemptions', value: stats.redemptions, icon: Users },
        { label: 'Inactive', value: stats.inactive, icon: Power },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white/90 backdrop-blur-sm px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
                <div className="flex-1">
                    <h1 className="tlb-page-title">Coupons</h1>
                    <p className="tlb-page-sub">Discount codes for your listings</p>
                </div>
                <button onClick={() => onNavigate('CREATE_COUPON')} className="tlb-button hidden sm:inline-flex">
                    <Plus size={18} /> Create Coupon
                </button>
            </header>

            <main className="p-5 md:p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {usingSample && !loading && (
                        <div className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium border bg-amber-50 text-amber-700 border-amber-200">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>Showing sample data — the live coupons service is unavailable (your partner account may not be approved yet).</span>
                        </div>
                    )}

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

                    {/* Grid / states */}
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <RefreshCw size={26} className="text-gray-300 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="tlb-card flex flex-col items-center justify-center text-center py-16">
                            <AlertCircle size={32} className="text-red-300 mb-3" />
                            <p className="text-sm font-bold text-gray-500">{error}</p>
                            <button onClick={load} className="text-xs font-black text-blue-500 hover:underline mt-3">Try again</button>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                            {filtered.map((c, i) => (
                                <CouponCard
                                    key={c.id}
                                    coupon={c}
                                    index={i}
                                    deactivating={deactivatingId === c.id}
                                    onDeactivate={handleDeactivate}
                                />
                            ))}
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
