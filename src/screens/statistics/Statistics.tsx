import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Menu, ArrowRight, Activity, Users, Target, Star, TrendingUp, TrendingDown,
    Clock, BookOpen, CalendarDays, Ticket, Zap, Eye, Heart,
    DollarSign, MapPin, Percent, RefreshCw, LayoutGrid, Award,
    GraduationCap, Layers, Wallet, MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import {
    getStatsOverview, getStatsEvents, getStatsVenues, getStatsEnquiries,
    getStatsRevenue, getStatsReviews,
    StatsOverview, StatsEvents, StatsVenues, StatsEnquiries,
    StatsRevenue, StatsReviews, RevenuePeriod,
} from '../../api/stats';
import { getBookings, getVenueEnquiries } from '../../api/listings';
import {
    InteractiveAreaChart, InteractiveBarChart, AnimatedDonut, FunnelBars,
    CountUp, fmtCurrency, fmtCompact, AreaPoint,
} from './StatCharts';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

// ── Helpers ──
const moneyToNumber = (s: string | number | null | undefined): number => {
    if (s == null) return 0;
    const n = typeof s === 'string' ? parseFloat(s) : s;
    return Number.isFinite(n) ? n : 0;
};
const monthShort = (full: string): string => full?.split(' ')[0] ?? full ?? '';
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const settledValue = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === 'fulfilled' ? r.value : null;

// ── Accent palette ──
const ACCENTS = {
    blue: { bg: '#EFF6FF', fg: '#3B82F6', solid: '#3B82F6' },
    purple: { bg: '#F5F3FF', fg: '#8B5CF6', solid: '#8B5CF6' },
    emerald: { bg: '#ECFDF5', fg: '#10B981', solid: '#10B981' },
    amber: { bg: '#FFFBEB', fg: '#F59E0B', solid: '#F59E0B' },
    yellow: { bg: '#FEFCE8', fg: '#CA8A04', solid: '#FACC15' },
    rose: { bg: '#FFF1F2', fg: '#F43F5E', solid: '#F43F5E' },
} as const;
type AccentKey = keyof typeof ACCENTS;

// ── Reusable stat tile (count-up + gradient icon + hover lift) ──
const StatTile: React.FC<{
    icon: React.ElementType;
    label: string;
    value: number | string;
    accent: AccentKey;
    format?: (n: number) => string;
    big?: boolean;
}> = ({ icon: Icon, label, value, accent, format, big }) => {
    const a = ACCENTS[accent];
    return (
        <motion.div
            className="tlb-card p-4 sm:p-5 flex flex-col gap-3"
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: a.bg, color: a.fg }}>
                <Icon size={17} />
            </div>
            <div>
                <p className={`${big ? 'text-3xl' : 'text-2xl'} font-black leading-none text-gray-900`}>
                    {typeof value === 'number' ? <CountUp value={value} format={format} /> : value}
                </p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{label}</p>
            </div>
        </motion.div>
    );
};

// ── Section card wrapper with title ──
const Panel: React.FC<{
    title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; className?: string;
}> = ({ title, subtitle, right, children, className = '' }) => (
    <div className={`tlb-card p-5 sm:p-6 ${className}`}>
        <div className="flex items-start justify-between mb-5 gap-3">
            <div>
                <h3 className="font-black text-gray-900">{title}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            {right}
        </div>
        {children}
    </div>
);

// ── Trend delta pill ──
const DeltaPill: React.FC<{ pct: number }> = ({ pct }) => {
    if (!pct) return <span className="text-[10px] font-bold text-gray-300">—</span>;
    const up = pct > 0;
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full ${up ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(pct).toFixed(1)}%
        </span>
    );
};

const fadeUp = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25 },
};

type TabKey = 'overview' | 'events' | 'venues' | 'classes' | 'programs' | 'revenue' | 'reviews';

export const Statistics: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const { allowedEntities } = usePartner();

    const [overview, setOverview] = useState<StatsOverview | null>(null);
    const [events, setEvents] = useState<StatsEvents | null>(null);
    const [venues, setVenues] = useState<StatsVenues | null>(null);
    const [enquiries, setEnquiries] = useState<StatsEnquiries | null>(null);
    const [revenue, setRevenue] = useState<StatsRevenue | null>(null);
    const [reviews, setReviews] = useState<StatsReviews | null>(null);
    const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('30d');
    // Derived from raw bookings + venue enquiries (computed client-side for the ratios)
    const [bookingStats, setBookingStats] = useState({ total: 0, attended: 0, venueBookings: 0 });
    const [venueEnquiryCount, setVenueEnquiryCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const fetchAllBookings = async (): Promise<any[]> => {
                const all: any[] = [];
                let page = 1;
                for (let guard = 0; guard < 30; guard++) {
                    const res: any = await getBookings({ page });
                    const d = res?.data || res;
                    all.push(...((d?.results || []) as any[]));
                    if (!d?.next) break;
                    page++;
                }
                return all;
            };
            const [oRes, eRes, vRes, enqRes, revRes, rwRes, bRes, veRes] = await Promise.allSettled([
                getStatsOverview(), getStatsEvents(), getStatsVenues(), getStatsEnquiries(),
                getStatsRevenue(revenuePeriod), getStatsReviews(),
                fetchAllBookings(), getVenueEnquiries(),
            ]);
            setOverview(settledValue(oRes));
            setEvents(settledValue(eRes));
            setVenues(settledValue(vRes));
            setEnquiries(settledValue(enqRes));
            setRevenue(settledValue(revRes));
            setReviews(settledValue(rwRes));

            const bookings = settledValue(bRes) || [];
            setBookingStats({
                total: bookings.length,
                attended: bookings.filter((b: any) => b.status === 'attended').length,
                venueBookings: bookings.filter((b: any) => b.booking_type === 'venue').length,
            });
            const ve: any = settledValue(veRes);
            const veArr = Array.isArray(ve) ? ve : (ve?.data || ve?.results || []);
            setVenueEnquiryCount(veArr.length);

            if ([oRes, eRes, vRes, enqRes, revRes, rwRes].every(r => r.status === 'rejected')) setError(true);
        } finally {
            setLoading(false);
        }
    }, [revenuePeriod]);

    useEffect(() => { load(); }, [load]);

    const changeRevenuePeriod = useCallback(async (p: RevenuePeriod) => {
        setRevenuePeriod(p);
        try {
            setRevenue(await getStatsRevenue(p));
        } catch { /* will show existing data */ }
    }, []);

    const hasEvents = allowedEntities.includes('Events');
    const hasVenues = allowedEntities.includes('Venues');
    const hasClasses = allowedEntities.includes('Classes');
    const hasPrograms = allowedEntities.includes('Programs');
    const hasClassOrProgram = hasClasses || hasPrograms;

    // ── Tabs available to this partner ──
    const tabs = useMemo(() => {
        const t: { key: TabKey; label: string; icon: React.ElementType }[] = [
            { key: 'overview', label: 'Overview', icon: LayoutGrid },
        ];
        if (hasEvents) t.push({ key: 'events', label: 'Events', icon: Ticket });
        if (hasVenues) t.push({ key: 'venues', label: 'Venues', icon: MapPin });
        if (hasClasses) t.push({ key: 'classes', label: 'Classes', icon: GraduationCap });
        if (hasPrograms) t.push({ key: 'programs', label: 'Programs', icon: Layers });
        t.push({ key: 'revenue', label: 'Revenue', icon: Wallet });
        t.push({ key: 'reviews', label: 'Reviews', icon: Star });
        return t;
    }, [hasEvents, hasVenues, hasClasses, hasPrograms]);

    // keep activeTab valid if entities change
    useEffect(() => {
        if (!tabs.some(t => t.key === activeTab)) setActiveTab('overview');
    }, [tabs, activeTab]);

    // ── Derived chart series ──
    const ticketTrend: AreaPoint[] = (events?.ticket_sales_trend ?? []).map(t => ({
        label: monthShort(t.month), value: t.count,
        note: t.earnings ? fmtCurrency(moneyToNumber(t.earnings)) : undefined,
    }));
    const weeklyBars = (events?.weekly_ticket_sales ?? []).map(d => ({
        label: d.day, value: d.count, note: d.date,
    }));
    const revenueTrend: AreaPoint[] = (venues?.revenue_trend ?? []).map(r => ({
        label: monthShort(r.month), value: moneyToNumber(r.earnings),
        note: r.count != null ? `${r.count} bookings` : undefined,
    }));
    const enquiryTrend: AreaPoint[] = (enquiries?.monthly_trend ?? []).map(t => ({
        label: monthShort(t.month), value: t.count,
        note: t.earnings ? fmtCurrency(moneyToNumber(t.earnings)) : undefined,
    }));

    const globalRevenueTrend: AreaPoint[] = (revenue?.revenue_trend ?? []).map(r => ({
        label: monthShort(r.month), value: moneyToNumber(r.earnings),
    }));
    const ratingTrend: AreaPoint[] = (reviews?.avg_rating_trend ?? [])
        .filter(r => r.avg_rating != null)
        .map(r => ({
            label: monthShort(r.month), value: r.avg_rating!,
            note: `${r.count} review${r.count === 1 ? '' : 's'}`,
        }));

    const lastDelta = (arr: AreaPoint[]) => {
        if (arr.length < 2) return 0;
        const prev = arr[arr.length - 2].value;
        const curr = arr[arr.length - 1].value;
        return prev ? ((curr - prev) / prev) * 100 : 0;
    };

    // ── Funnel + occupancy ──
    const funnel = enquiries?.conversion_funnel;
    const convRate = Math.round(funnel?.conversion_rate ?? 0);
    const occupancyRate = Math.round(venues?.occupancy_rate ?? 0);

    const avgDuration = venues?.avg_duration_minutes ?? 0;
    const avgDurationLabel = avgDuration > 0
        ? (avgDuration >= 60 ? `${(avgDuration / 60).toFixed(1)}h` : `${Math.round(avgDuration)}m`)
        : '—';
    const avgResponseHours = enquiries?.avg_response_hours;
    const engagementRate = events?.engagement_rate;

    const noEntities = !hasEvents && !hasVenues && !hasClassOrProgram;
    const noData = !overview && !events && !venues && !enquiries;

    // ── Primary trend for the Overview tab ──
    const primaryTrend = hasEvents
        ? { points: ticketTrend, color: ACCENTS.purple.solid, id: 'ov-evt', title: 'Ticket Sales', subtitle: 'Tickets sold over recent months', fmt: (n: number) => fmtCompact(n) }
        : hasVenues
        ? { points: revenueTrend, color: ACCENTS.amber.solid, id: 'ov-vnu', title: 'Revenue', subtitle: 'Monthly venue earnings', fmt: (n: number) => fmtCurrency(n) }
        : { points: enquiryTrend, color: ACCENTS.blue.solid, id: 'ov-enq', title: 'Enquiries', subtitle: 'Monthly enquiry volume', fmt: (n: number) => fmtCompact(n) };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-sm px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <Menu size={24} />
                    </button>
                    <div>
                        <h1 className="tlb-page-title">Statistics</h1>
                        <p className="tlb-page-sub">Analytics, trends &amp; performance</p>
                    </div>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800 disabled:opacity-40 text-xs font-bold"
                    title="Refresh"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </header>

            <main className="p-5 sm:p-6">
                <div className="max-w-6xl mx-auto space-y-6">

                    {loading && noData ? (
                        <div className="flex items-center justify-center py-28">
                            <RefreshCw size={28} className="text-gray-300 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-4 py-28 text-center">
                            <p className="text-sm font-bold text-gray-400">Could not load analytics data.</p>
                            <button onClick={load} className="tlb-button text-sm">Try again</button>
                        </div>
                    ) : noEntities ? (
                        <div className="flex flex-col items-center gap-3 py-20 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center text-tlb-yellow">
                                <Activity size={26} />
                            </div>
                            <p className="text-sm font-bold text-gray-500">No analytics yet</p>
                            <p className="text-xs text-gray-400 max-w-xs">Create your first listing to start tracking views, bookings, and revenue.</p>
                            <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="mt-2 tlb-button text-sm">
                                Go to My Listings <ArrowRight size={15} />
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ── Overview KPI hero strip (always) ── */}
                            {overview && (
                                <motion.section
                                    className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                                    initial="initial" animate="animate"
                                    variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
                                >
                                    {[
                                        { label: 'Profile Views', value: overview.profile_views, icon: Eye, accent: 'blue' as AccentKey },
                                        { label: 'Followers', value: overview.followers, icon: Heart, accent: 'rose' as AccentKey },
                                        { label: 'New Enquiries', value: overview.new_enquiries, icon: BookOpen, accent: 'purple' as AccentKey },
                                        { label: 'Active Batches', value: overview.active_batches, icon: Target, accent: 'emerald' as AccentKey },
                                    ].map(s => (
                                        <motion.div key={s.label} variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}>
                                            <StatTile icon={s.icon} label={s.label} value={s.value} accent={s.accent} format={fmtCompact} big />
                                        </motion.div>
                                    ))}
                                </motion.section>
                            )}

                            {/* ── Tab switcher (sliding pill) ── */}
                            {tabs.length > 1 && (
                                <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-full sm:w-fit overflow-x-auto">
                                    {tabs.map(t => {
                                        const active = activeTab === t.key;
                                        return (
                                            <button
                                                key={t.key}
                                                onClick={() => setActiveTab(t.key)}
                                                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {active && (
                                                    <motion.div layoutId="stat-tab-pill" className="absolute inset-0 bg-white rounded-xl shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                                                )}
                                                <t.icon size={15} className="relative z-10" />
                                                <span className="relative z-10">{t.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Tab content ── */}
                            <AnimatePresence mode="wait">
                                {/* ════════ OVERVIEW ════════ */}
                                {activeTab === 'overview' && (
                                    <motion.div key="overview" {...fadeUp} className="space-y-6">
                                        {/* Highlight cards across entities */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                            {hasEvents && events && (
                                                <>
                                                    <StatTile icon={Ticket} label="Tickets Sold" value={events.tickets_sold} accent="purple" format={fmtCompact} />
                                                    <StatTile icon={Target} label="Booking Conv." value={`${(events.booking_conv_rate ?? 0).toFixed(1)}%`} accent="emerald" />
                                                </>
                                            )}
                                            {hasVenues && venues && (
                                                <>
                                                    <StatTile icon={DollarSign} label="Monthly Earnings" value={moneyToNumber(venues.monthly_earnings)} accent="amber" format={fmtCurrency} />
                                                    <StatTile icon={Percent} label="Occupancy" value={`${occupancyRate}%`} accent="blue" />
                                                </>
                                            )}
                                            {hasClassOrProgram && enquiries && (
                                                <>
                                                    <StatTile icon={Award} label="Conversion" value={`${convRate}%`} accent="emerald" />
                                                    <StatTile icon={Users} label="Retention" value={`${Math.round(enquiries.student_retention_pct ?? 0)}%`} accent="blue" />
                                                </>
                                            )}
                                        </div>

                                        {/* Primary interactive trend */}
                                        <Panel
                                            title={`${primaryTrend.title} Trend`}
                                            subtitle={primaryTrend.subtitle}
                                            right={<DeltaPill pct={lastDelta(primaryTrend.points)} />}
                                        >
                                            <InteractiveAreaChart
                                                points={primaryTrend.points}
                                                color={primaryTrend.color}
                                                id={primaryTrend.id}
                                                formatValue={primaryTrend.fmt}
                                            />
                                        </Panel>

                                        {/* Conversion ratios */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <RatioCard
                                                title="Bookings → Attendees"
                                                subtitle="Booked guests who actually attended"
                                                fromLabel="Bookings" fromValue={bookingStats.total}
                                                toLabel="Attended" toValue={bookingStats.attended}
                                                accent="emerald"
                                            />
                                            {hasVenues && (
                                                <RatioCard
                                                    title="Enquiries → Bookings"
                                                    subtitle="Venue enquiries converted to bookings"
                                                    fromLabel="Enquiries" fromValue={venueEnquiryCount}
                                                    toLabel="Bookings" toValue={bookingStats.venueBookings}
                                                    accent="amber"
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ════════ EVENTS ════════ */}
                                {activeTab === 'events' && events && (
                                    <motion.div key="events" {...fadeUp} className="space-y-6">
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                            <StatTile icon={CalendarDays} label="Upcoming" value={events.upcoming} accent="blue" format={fmtCompact} />
                                            <StatTile icon={Ticket} label="Tickets Sold" value={events.tickets_sold} accent="purple" format={fmtCompact} />
                                            <StatTile icon={Users} label="Registrations" value={events.registrations} accent="emerald" format={fmtCompact} />
                                            <StatTile icon={Zap} label="Event Reach" value={events.event_reach} accent="amber" format={fmtCompact} />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <Panel title="Weekly Ticket Sales" subtitle="Last 7 days"
                                                right={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total {weeklyBars.reduce((a, b) => a + b.value, 0)}</span>}>
                                                {weeklyBars.length ? (
                                                    <InteractiveBarChart points={weeklyBars} color={ACCENTS.purple.solid} formatValue={(n) => `${Math.round(n)} sold`} />
                                                ) : <EmptyMini text="No sales this week" />}
                                            </Panel>

                                            <div className="grid grid-cols-2 gap-3 sm:gap-4 content-start">
                                                <StatTile icon={Activity} label="Engagement Rate" value={engagementRate != null ? `${engagementRate}%` : '—'} accent="blue" />
                                                <StatTile icon={Target} label="Booking Conv." value={`${(events.booking_conv_rate ?? 0).toFixed(1)}%`} accent="emerald" />
                                                <StatTile icon={TrendingUp} label="This Month" value={events.this_month_tickets} accent="amber" format={fmtCompact} />
                                                <StatTile icon={Clock} label="Prev Month" value={events.prev_month_tickets} accent="purple" format={fmtCompact} />
                                            </div>
                                        </div>

                                        <Panel title="Ticket Sales Trend" subtitle="Monthly performance"
                                            right={<DeltaPill pct={events.ticket_growth_pct ?? lastDelta(ticketTrend)} />}>
                                            <InteractiveAreaChart points={ticketTrend} color={ACCENTS.purple.solid} id="evt-trend" formatValue={(n) => `${Math.round(n)} tickets`} />
                                        </Panel>

                                        {!!events.by_category?.length && (
                                            <Panel title="Bookings by Category" subtitle="Where your audience is converting">
                                                <CategoryBars
                                                    items={events.by_category.map(c => ({ label: c.category, count: c.count, amount: moneyToNumber(c.amount) }))}
                                                    color={ACCENTS.purple.solid}
                                                />
                                            </Panel>
                                        )}
                                    </motion.div>
                                )}

                                {/* ════════ VENUES ════════ */}
                                {activeTab === 'venues' && venues && (
                                    <motion.div key="venues" {...fadeUp} className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <Panel title="Occupancy Rate" subtitle="Booked vs available capacity">
                                                <div className="flex items-center gap-5">
                                                    <AnimatedDonut
                                                        segments={[
                                                            { value: occupancyRate, color: ACCENTS.emerald.solid, label: 'Occupied' },
                                                            { value: Math.max(0, 100 - occupancyRate), color: '#F3F4F6', label: 'Available' },
                                                        ]}
                                                        centerLabel={`${occupancyRate}%`}
                                                        centerSub="Occupied"
                                                    />
                                                    <div className="flex-1 space-y-3">
                                                        {[
                                                            { label: 'Total Bookings', value: `${venues.total_bookings}`, color: ACCENTS.blue.solid },
                                                            { label: 'Upcoming', value: `${venues.upcoming}`, color: ACCENTS.amber.solid },
                                                            { label: 'Monthly Earnings', value: fmtCurrency(moneyToNumber(venues.monthly_earnings)), color: ACCENTS.emerald.solid },
                                                        ].map(r => (
                                                            <div key={r.label} className="flex items-center gap-2">
                                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                                                                <span className="text-xs text-gray-500 flex-1">{r.label}</span>
                                                                <span className="text-sm font-black text-gray-900">{r.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Panel>

                                            <div className="grid grid-cols-2 gap-3 sm:gap-4 content-start">
                                                <StatTile icon={MapPin} label="Bookings" value={venues.total_bookings} accent="blue" format={fmtCompact} />
                                                <StatTile icon={CalendarDays} label="Upcoming" value={venues.upcoming} accent="amber" format={fmtCompact} />
                                                <StatTile icon={Clock} label="Avg. Duration" value={avgDurationLabel} accent="purple" />
                                                <StatTile icon={Star} label="Repeat Clients" value={venues.repeat_clients} accent="emerald" format={fmtCompact} />
                                            </div>
                                        </div>

                                        <Panel title="Revenue Trend" subtitle="Monthly venue earnings"
                                            right={<DeltaPill pct={lastDelta(revenueTrend)} />}>
                                            <InteractiveAreaChart points={revenueTrend} color={ACCENTS.amber.solid} id="vnu-trend" formatValue={fmtCurrency} />
                                        </Panel>

                                        <RatioCard
                                            title="Enquiries → Bookings"
                                            subtitle="Venue enquiries converted to bookings"
                                            fromLabel="Enquiries" fromValue={venueEnquiryCount}
                                            toLabel="Bookings" toValue={bookingStats.venueBookings}
                                            accent="amber"
                                        />
                                    </motion.div>
                                )}

                                {/* ════════ CLASSES / PROGRAMS (enrolment & enquiry analytics) ════════ */}
                                {(activeTab === 'classes' || activeTab === 'programs') && enquiries && (
                                    <motion.div key={activeTab} {...fadeUp} className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <Panel title="Conversion Funnel" subtitle={`${activeTab === 'programs' ? 'Program' : 'Class'} lead journey`}
                                                right={
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black" style={{ color: ACCENTS.emerald.solid }}>
                                                            <CountUp value={convRate} suffix="%" />
                                                        </p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Conv. Rate</p>
                                                    </div>
                                                }>
                                                <FunnelBars
                                                    stages={[
                                                        { label: 'New Leads', value: funnel?.new_leads ?? 0, color: ACCENTS.blue.solid },
                                                        { label: 'Contacted', value: funnel?.contacted ?? 0, color: ACCENTS.yellow.solid },
                                                        { label: 'Converted', value: funnel?.converted ?? 0, color: ACCENTS.emerald.solid },
                                                    ]}
                                                />
                                            </Panel>

                                            <div className="grid grid-cols-2 gap-3 sm:gap-4 content-start">
                                                <StatTile icon={BookOpen} label="Trial Requests" value={enquiries.trial_requests} accent="purple" format={fmtCompact} />
                                                <StatTile icon={Clock} label="Avg. Response" value={avgResponseHours != null ? `${avgResponseHours.toFixed(1)}h` : '—'} accent="blue" />
                                                <StatTile icon={Users} label="Retention" value={`${Math.round(enquiries.student_retention_pct ?? 0)}%`} accent="emerald" />
                                                <StatTile icon={Target} label="Enrolments" value={enquiries.monthly_enrolments} accent="amber" format={fmtCompact} />
                                            </div>
                                        </div>

                                        <Panel title="Monthly Trend" subtitle={`${activeTab === 'programs' ? 'Program' : 'Class'} enquiries over recent months`}
                                            right={<DeltaPill pct={lastDelta(enquiryTrend)} />}>
                                            <InteractiveAreaChart points={enquiryTrend} color={ACCENTS.blue.solid} id="enq-trend" formatValue={(n) => `${Math.round(n)} enquiries`} />
                                        </Panel>

                                        <button
                                            onClick={() => onNavigate(activeTab === 'programs' ? 'PROGRAM_ENQUIRIES' : 'ENQUIRIES')}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                                        >
                                            View all {activeTab === 'programs' ? 'program' : 'class'} enquiries <ArrowRight size={15} />
                                        </button>
                                    </motion.div>
                                )}
                                {/* ════════ REVENUE ════════ */}
                                {activeTab === 'revenue' && revenue && (
                                    <motion.div key="revenue" {...fadeUp} className="space-y-6">
                                        {/* Period selector */}
                                        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
                                            {(['7d', '30d', '90d', '1y', 'all'] as RevenuePeriod[]).map(p => {
                                                const active = revenuePeriod === p;
                                                const label = p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : p === '1y' ? '1 Year' : 'All Time';
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => changeRevenuePeriod(p)}
                                                        className={`relative px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >
                                                        {active && (
                                                            <motion.div layoutId="rev-period-pill" className="absolute inset-0 bg-white rounded-xl shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                                                        )}
                                                        <span className="relative z-10">{label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Revenue KPI tiles */}
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                            <StatTile icon={DollarSign} label="Gross Revenue" value={moneyToNumber(revenue.gross_revenue)} accent="emerald" format={fmtCurrency} big />
                                            <StatTile icon={Wallet} label="Net Earnings" value={moneyToNumber(revenue.net_earnings)} accent="blue" format={fmtCurrency} big />
                                            <StatTile icon={Percent} label="Platform Fees" value={moneyToNumber(revenue.platform_fees)} accent="amber" format={fmtCurrency} />
                                            <StatTile icon={TrendingDown} label="Refunds" value={moneyToNumber(revenue.refunds)} accent="rose" format={fmtCurrency} />
                                            <StatTile icon={Ticket} label="Confirmed Bookings" value={revenue.confirmed_bookings} accent="purple" format={fmtCompact} />
                                            <StatTile icon={Target} label="Avg. Order Value" value={moneyToNumber(revenue.avg_order_value)} accent="amber" format={fmtCurrency} />
                                        </div>

                                        {/* MoM growth */}
                                        <Panel title="Month-on-Month" subtitle="Calendar month comparison (independent of period filter)">
                                            <div className="flex items-center gap-6 flex-wrap">
                                                <div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">This Month</p>
                                                    <p className="text-2xl font-black text-gray-900">{fmtCurrency(moneyToNumber(revenue.this_month))}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prev Month</p>
                                                    <p className="text-2xl font-black text-gray-400">{fmtCurrency(moneyToNumber(revenue.prev_month))}</p>
                                                </div>
                                                <div>
                                                    {moneyToNumber(revenue.prev_month) === 0
                                                        ? <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-blue-50 text-blue-600">New</span>
                                                        : <DeltaPill pct={revenue.revenue_growth_pct} />
                                                    }
                                                </div>
                                            </div>
                                        </Panel>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Revenue by type */}
                                            {revenue.revenue_by_type.length > 0 && (
                                                <Panel title="Revenue by Type" subtitle="Gross revenue split by listing type">
                                                    <div className="flex items-center gap-5">
                                                        <AnimatedDonut
                                                            segments={revenue.revenue_by_type.map((r, i) => ({
                                                                value: moneyToNumber(r.amount),
                                                                color: [ACCENTS.amber.solid, ACCENTS.purple.solid, ACCENTS.emerald.solid, ACCENTS.blue.solid][i % 4],
                                                                label: r.type,
                                                            }))}
                                                            centerLabel={fmtCurrency(moneyToNumber(revenue.gross_revenue))}
                                                            centerSub="Total"
                                                        />
                                                        <div className="flex-1 space-y-3">
                                                            {revenue.revenue_by_type.map((r, i) => (
                                                                <div key={r.type} className="flex items-center gap-2">
                                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{
                                                                        background: [ACCENTS.amber.solid, ACCENTS.purple.solid, ACCENTS.emerald.solid, ACCENTS.blue.solid][i % 4],
                                                                    }} />
                                                                    <span className="text-xs text-gray-500 flex-1 capitalize">{r.type}</span>
                                                                    <span className="text-xs font-bold text-gray-400">{r.count} bookings</span>
                                                                    <span className="text-sm font-black text-gray-900">{fmtCurrency(moneyToNumber(r.amount))}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Panel>
                                            )}

                                            {/* Revenue trend */}
                                            <Panel title="Revenue Trend" subtitle="Last 6 months (always full context)"
                                                right={<DeltaPill pct={lastDelta(globalRevenueTrend)} />}>
                                                <InteractiveAreaChart
                                                    points={globalRevenueTrend}
                                                    color={ACCENTS.emerald.solid}
                                                    id="rev-trend"
                                                    formatValue={fmtCurrency}
                                                />
                                            </Panel>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ════════ REVIEWS ════════ */}
                                {activeTab === 'reviews' && reviews && (
                                    <motion.div key="reviews" {...fadeUp} className="space-y-6">
                                        {/* Rating hero + tiles */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                            <motion.div
                                                className="tlb-card p-5 flex flex-col items-center justify-center text-center col-span-2 lg:col-span-1"
                                                whileHover={{ y: -3 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                            >
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} size={18} className={s <= Math.round(reviews.avg_rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                                                    ))}
                                                </div>
                                                <p className="text-3xl font-black text-gray-900 leading-none">
                                                    {reviews.avg_rating != null ? reviews.avg_rating.toFixed(1) : '—'}
                                                </p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">Avg Rating</p>
                                            </motion.div>
                                            <StatTile icon={MessageSquare} label="Total Reviews" value={reviews.total_reviews} accent="purple" format={fmtCompact} />
                                            <StatTile icon={TrendingUp} label="This Month" value={reviews.reviews_this_month} accent="emerald" format={fmtCompact} />
                                            <StatTile icon={Clock} label="Prev Month" value={reviews.reviews_prev_month} accent="amber" format={fmtCompact} />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Rating distribution */}
                                            <Panel title="Rating Distribution" subtitle="All-time breakdown by star rating">
                                                <RatingDistribution distribution={reviews.rating_distribution} total={reviews.total_reviews} />
                                            </Panel>

                                            {/* Rating trend */}
                                            <Panel title="Avg. Rating Trend" subtitle="Monthly average (months with no reviews are skipped)"
                                                right={<DeltaPill pct={lastDelta(ratingTrend)} />}>
                                                {ratingTrend.length >= 2 ? (
                                                    <InteractiveAreaChart
                                                        points={ratingTrend}
                                                        color={ACCENTS.amber.solid}
                                                        id="rev-rating-trend"
                                                        formatValue={n => n.toFixed(1)}
                                                    />
                                                ) : <EmptyMini text="Not enough rating data yet" />}
                                            </Panel>
                                        </div>

                                        {/* Recent reviews */}
                                        {reviews.recent_reviews.length > 0 && (
                                            <Panel title="Recent Reviews" subtitle="Latest feedback from your customers">
                                                <div className="space-y-4">
                                                    {reviews.recent_reviews.map((r, i) => (
                                                        <motion.div
                                                            key={i}
                                                            className="bg-gray-50 rounded-2xl p-4"
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.2, delay: i * 0.06 }}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-1">
                                                                    {[1, 2, 3, 4, 5].map(s => (
                                                                        <Star key={s} size={13} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                                                                    ))}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-gray-400">{fmtDate(r.created_at)}</span>
                                                            </div>
                                                            {r.comment && <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>}
                                                            {r.listing_title && (
                                                                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{r.listing_title}</p>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </Panel>
                                        )}
                                    </motion.div>
                                )}

                                {/* No data fallback for revenue/reviews when null */}
                                {activeTab === 'revenue' && !revenue && !loading && (
                                    <motion.div key="revenue-empty" {...fadeUp}>
                                        <EmptyMini text="Revenue data unavailable" />
                                    </motion.div>
                                )}
                                {activeTab === 'reviews' && !reviews && !loading && (
                                    <motion.div key="reviews-empty" {...fadeUp}>
                                        <EmptyMini text="Reviews data unavailable" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

// ── Empty mini placeholder ──
const EmptyMini: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center justify-center h-32 text-[11px] font-bold text-gray-300 uppercase tracking-widest">{text}</div>
);

// ── Category bars with count + revenue ──
const CategoryBars: React.FC<{ items: { label: string; count: number; amount: number }[]; color: string }> = ({ items, color }) => {
    const max = Math.max(...items.map(i => i.count), 1);
    return (
        <div className="space-y-4">
            {items.map((c, i) => (
                <div key={c.label}>
                    <div className="flex justify-between items-baseline text-xs mb-1.5">
                        <span className="font-bold text-gray-700">{c.label}</span>
                        <span className="flex items-center gap-2">
                            {c.amount > 0 && <span className="font-bold text-gray-400">{fmtCurrency(c.amount)}</span>}
                            <span className="font-black text-gray-900">{c.count}</span>
                        </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.count / max) * 100}%` }}
                            transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

// ── Rating distribution — horizontal bars 5★→1★ ──
const RatingDistribution: React.FC<{
    distribution: { rating: number; count: number }[];
    total: number;
}> = ({ distribution, total }) => {
    const sorted = [...distribution].sort((a, b) => b.rating - a.rating);
    const max = Math.max(...sorted.map(d => d.count), 1);
    return (
        <div className="space-y-3">
            {sorted.map((d, i) => {
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                return (
                    <div key={d.rating} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-5 text-right">{d.rating}★</span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-amber-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${(d.count / max) * 100}%` }}
                                transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                            />
                        </div>
                        <span className="text-xs font-black text-gray-700 w-8 text-right">{d.count}</span>
                        <span className="text-[10px] font-bold text-gray-400 w-9 text-right">{pct}%</span>
                    </div>
                );
            })}
        </div>
    );
};

// ── Ratio card: from → to with a donut + counts ──
const RatioCard: React.FC<{
    title: string; subtitle?: string;
    fromLabel: string; fromValue: number;
    toLabel: string; toValue: number;
    accent: AccentKey;
}> = ({ title, subtitle, fromLabel, fromValue, toLabel, toValue, accent }) => {
    const a = ACCENTS[accent];
    const pct = fromValue > 0 ? Math.round((toValue / fromValue) * 100) : 0;
    return (
        <Panel title={title} subtitle={subtitle}>
            <div className="flex items-center gap-5">
                <AnimatedDonut
                    segments={[
                        { value: pct, color: a.solid, label: toLabel },
                        { value: Math.max(0, 100 - pct), color: '#F3F4F6', label: 'Rest' },
                    ]}
                    centerLabel={`${pct}%`}
                    centerSub="rate"
                />
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300" />
                        <span className="text-xs text-gray-500 flex-1">{fromLabel}</span>
                        <span className="text-sm font-black text-gray-900"><CountUp value={fromValue} /></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.solid }} />
                        <span className="text-xs text-gray-500 flex-1">{toLabel}</span>
                        <span className="text-sm font-black text-gray-900"><CountUp value={toValue} /></span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 text-[11px] font-bold text-gray-400">
                        {toValue} of {fromValue} {fromLabel.toLowerCase()} &rarr; {toLabel.toLowerCase()}
                    </div>
                </div>
            </div>
        </Panel>
    );
};

export default Statistics;
