import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ArrowRight, Activity, Users, Target, Star, TrendingUp, TrendingDown,
    Clock, BookOpen, CalendarDays, Ticket, Zap, Eye, Heart,
    DollarSign, MapPin, Percent, RefreshCw, LayoutGrid, Award,
    GraduationCap, Layers, Wallet, MessageSquare,
    Lightbulb, Trophy, Flame, ShieldCheck, AlertTriangle, ThumbsUp,
    BarChart3, PieChart, ArrowUpRight,
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

// ── Reusable stat tile (count-up + gradient icon + hover lift + optional delta) ──
const StatTile: React.FC<{
    icon: React.ElementType;
    label: string;
    value: number | string;
    accent: AccentKey;
    format?: (n: number) => string;
    big?: boolean;
    delta?: number | null;
    subtitle?: string;
}> = ({ icon: Icon, label, value, accent, format, big, delta, subtitle }) => {
    const a = ACCENTS[accent];
    return (
        <motion.div
            className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full"
            whileHover={{ y: -3, boxShadow: "0 12px 24px -8px rgba(0,0,0,0.06)" }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
            <div className="absolute -right-4 -top-4 opacity-[0.03] text-gray-900 transform rotate-12">
                <Icon size={100} />
            </div>
            <div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: a.bg, color: a.fg, border: `1px solid ${a.fg}20` }}>
                        <Icon size={18} />
                    </div>
                    {delta != null && delta !== 0 && <DeltaPill pct={delta} />}
                </div>
                <div className="relative z-10 mt-auto">
                    <p className={`${big ? 'text-4xl' : 'text-3xl'} font-black leading-none tracking-tight text-gray-900`}>
                        {typeof value === 'number' ? <CountUp value={value} format={format} /> : value}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{label}</p>
                    {subtitle && <p className="text-[11px] font-medium text-gray-500 mt-1">{subtitle}</p>}
                </div>
            </div>
        </motion.div>
    );
};

// ── Section card wrapper with title ──
const Panel: React.FC<{
    title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; className?: string;
}> = ({ title, subtitle, right, children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-gray-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] p-6 flex flex-col ${className}`}>
        <div className="flex items-start justify-between mb-6 gap-3 shrink-0">
            <div>
                <h3 className="font-black text-gray-900 text-lg tracking-tight">{title}</h3>
                {subtitle && <p className="text-[13px] text-gray-500 mt-0.5 leading-relaxed">{subtitle}</p>}
            </div>
            {right && <div className="shrink-0">{right}</div>}
        </div>
        <div className="flex-1 min-h-0">
            {children}
        </div>
    </div>
);

// ── Trend delta pill ──
const DeltaPill: React.FC<{ pct: number }> = ({ pct }) => {
    if (!pct) return <span className="text-[10px] font-bold text-gray-300">—</span>;
    const up = pct > 0;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border ${up ? 'text-emerald-700 bg-emerald-50 border-emerald-200/50' : 'text-rose-600 bg-rose-50 border-rose-200/50'}`}>
            {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(pct).toFixed(1)}%
        </span>
    );
};

// ── Performance Score ring ──
const PerformanceScore: React.FC<{ score: number; label: string; factors: { name: string; value: number; max: number }[] }> = ({ score, label, factors }) => {
    const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#F43F5E';
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (score / 100) * circumference;
    return (
        <div className="flex flex-col sm:flex-row items-center gap-8 bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden h-full shadow-lg border border-slate-800">
            {/* Subtle glow effect behind ring */}
            <div className="absolute top-1/2 left-12 w-24 h-24 rounded-full blur-3xl opacity-20 -translate-y-1/2 pointer-events-none" style={{ background: color }} />
            
            <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-md">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <motion.circle
                        cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
                        strokeLinecap="round" strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-3xl font-black tracking-tighter drop-shadow-sm" style={{ color }}><CountUp value={score} /></p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
                </div>
            </div>
            <div className="flex-1 w-full space-y-4">
                {factors.map((f, i) => {
                    const pct = f.max > 0 ? Math.round((f.value / f.max) * 100) : 0;
                    const barColor = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#F43F5E';
                    return (
                        <div key={f.name}>
                            <div className="flex justify-between items-end text-xs mb-1.5">
                                <span className="text-gray-300 font-medium">{f.name}</span>
                                <span className="font-bold text-white">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <motion.div className="h-full rounded-full" style={{ background: barColor }}
                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + (i * 0.1) }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Smart insight bullet ──
interface Insight { icon: React.ElementType; text: string; type: 'positive' | 'warning' | 'neutral' }
const InsightBullet: React.FC<Insight> = ({ icon: Icon, text, type }) => {
    const colors = {
        positive: 'bg-emerald-50 text-emerald-700 border-emerald-100/50',
        warning: 'bg-amber-50 text-amber-700 border-amber-100/50',
        neutral: 'bg-blue-50 text-blue-700 border-blue-100/50',
    };
    return (
        <div className="flex items-start gap-4 py-3.5 group">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${colors[type]} transition-transform group-hover:scale-110`}>
                <Icon size={15} />
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed font-medium">{text}</p>
        </div>
    );
};

// ── Generate insights from data ──
const generateInsights = (
    overview: StatsOverview | null, events: StatsEvents | null, venues: StatsVenues | null,
    enquiries: StatsEnquiries | null, revenue: StatsRevenue | null, reviews: StatsReviews | null,
): Insight[] => {
    const insights: Insight[] = [];
    if (events) {
        const growthPct = events.ticket_growth_pct ?? 0;
        if (growthPct > 10) insights.push({ icon: TrendingUp, text: `Ticket sales are up ${growthPct.toFixed(0)}% this month — your marketing is paying off.`, type: 'positive' });
        else if (growthPct < -10) insights.push({ icon: TrendingDown, text: `Ticket sales dropped ${Math.abs(growthPct).toFixed(0)}% — consider running a promotion or adjusting pricing.`, type: 'warning' });
        const convRate = events.booking_conv_rate ?? 0;
        if (convRate > 0 && convRate < 5) insights.push({ icon: AlertTriangle, text: `Your booking conversion rate is ${convRate.toFixed(1)}% — improving your listing descriptions or adding more photos could help.`, type: 'warning' });
        else if (convRate >= 20) insights.push({ icon: Trophy, text: `Conversion rate of ${convRate.toFixed(1)}% is excellent — your listings are highly compelling.`, type: 'positive' });
        const peakDay = events.weekly_ticket_sales?.reduce((best, d) => d.count > (best?.count ?? 0) ? d : best, events.weekly_ticket_sales[0]);
        if (peakDay && peakDay.count > 0) insights.push({ icon: Flame, text: `${peakDay.day} was your best-selling day this week with ${peakDay.count} ticket${peakDay.count > 1 ? 's' : ''}.`, type: 'neutral' });
    }
    if (venues) {
        const occ = venues.occupancy_rate ?? 0;
        if (occ >= 80) insights.push({ icon: ShieldCheck, text: `Occupancy rate is at ${Math.round(occ)}% — your venues are in high demand. Consider adding more availability slots.`, type: 'positive' });
        else if (occ > 0 && occ < 30) insights.push({ icon: AlertTriangle, text: `Occupancy rate is ${Math.round(occ)}% — try adjusting pricing or promoting off-peak slots.`, type: 'warning' });
        if (venues.repeat_clients > 0) insights.push({ icon: Heart, text: `You have ${venues.repeat_clients} repeat client${venues.repeat_clients > 1 ? 's' : ''} — loyalty is building.`, type: 'positive' });
    }
    if (enquiries) {
        const respH = enquiries.avg_response_hours;
        if (respH != null && respH > 24) insights.push({ icon: Clock, text: `Average response time is ${respH.toFixed(0)}h — responding within 4 hours can increase conversion by 2×.`, type: 'warning' });
        else if (respH != null && respH <= 4) insights.push({ icon: Zap, text: `Average response time of ${respH.toFixed(1)}h is outstanding — fast replies drive more conversions.`, type: 'positive' });
        const retention = enquiries.student_retention_pct ?? 0;
        if (retention >= 70) insights.push({ icon: ThumbsUp, text: `Student retention at ${Math.round(retention)}% shows strong class quality and engagement.`, type: 'positive' });
    }
    if (revenue) {
        const growth = revenue.revenue_growth_pct ?? 0;
        if (growth > 15) insights.push({ icon: DollarSign, text: `Revenue grew ${growth.toFixed(0)}% month-over-month — strong financial trajectory.`, type: 'positive' });
        const aov = moneyToNumber(revenue.avg_order_value);
        if (aov > 0) insights.push({ icon: BarChart3, text: `Average order value is ${fmtCurrency(aov)} — upselling packages or add-ons could increase this.`, type: 'neutral' });
    }
    if (reviews) {
        const avg = reviews.avg_rating;
        if (avg != null && avg >= 4.5) insights.push({ icon: Star, text: `Your average rating of ${avg.toFixed(1)}★ puts you in the top tier — keep up the quality.`, type: 'positive' });
        else if (avg != null && avg < 3.5 && avg > 0) insights.push({ icon: AlertTriangle, text: `Average rating is ${avg.toFixed(1)}★ — review recent feedback and address recurring complaints.`, type: 'warning' });
        if (reviews.reviews_this_month > reviews.reviews_prev_month && reviews.reviews_prev_month > 0) {
            const reviewGrowth = Math.round(((reviews.reviews_this_month - reviews.reviews_prev_month) / reviews.reviews_prev_month) * 100);
            insights.push({ icon: MessageSquare, text: `Reviews are up ${reviewGrowth}% this month — more customer feedback means more social proof.`, type: 'positive' });
        }
    }
    if (overview && overview.profile_views > 0 && overview.followers > 0) {
        const followRate = ((overview.followers / overview.profile_views) * 100);
        if (followRate > 5) insights.push({ icon: Users, text: `${followRate.toFixed(1)}% of viewers follow your profile — strong brand appeal.`, type: 'positive' });
    }
    return insights.slice(0, 6);
};

// ── Highlight card (best performer / peak) ──
const HighlightCard: React.FC<{
    icon: React.ElementType; title: string; value: string; subtitle: string; accent: AccentKey;
}> = ({ icon: Icon, title, value, subtitle, accent }) => {
    const a = ACCENTS[accent];
    return (
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: a.solid }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: a.bg, color: a.fg, borderColor: `${a.fg}20` }}>
                <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{title}</p>
                <p className="text-xl font-black tracking-tight text-gray-900 truncate leading-none mb-1">{value}</p>
                <p className="text-[11px] font-medium text-gray-500 truncate">{subtitle}</p>
            </div>
        </div>
    );
};

const fadeUp = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25 },
};

type TabKey = 'overview' | 'events' | 'venues' | 'classes' | 'programs' | 'revenue' | 'reviews';

export const Analytics: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
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
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-30 border-b border-gray-200/60 shadow-sm">
                <div className="flex items-center gap-4">
                    
                    <div>
                        <h1 className="tlb-page-title">Analytics</h1>
                        <p className="tlb-page-sub text-gray-500 mt-0.5">Performance, revenue & detailed insights</p>
                    </div>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200/60 hover:bg-gray-100 hover:border-gray-300 transition-all text-gray-600 hover:text-gray-900 disabled:opacity-40 text-xs font-bold shadow-sm"
                    title="Refresh"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh Data</span>
                </button>
            </header>

            <main className="p-5 sm:p-6 lg:p-8">
                <div className="max-w-[1440px] mx-auto space-y-6">

                    {loading && noData ? (
                        <div className="flex items-center justify-center py-32">
                            <RefreshCw size={32} className="text-gray-300 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-4 py-32 text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-2">
                                <AlertTriangle size={32} />
                            </div>
                            <p className="text-sm font-bold text-gray-600">Could not load analytics data.</p>
                            <button onClick={load} className="tlb-button text-sm px-6">Try again</button>
                        </div>
                    ) : noEntities ? (
                        <div className="flex flex-col items-center gap-4 py-24 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-yellow-50 flex items-center justify-center text-tlb-yellow shadow-sm border border-yellow-100">
                                <Activity size={36} />
                            </div>
                            <div>
                                <p className="text-base font-black text-gray-900">No analytics yet</p>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">Create your first listing to start tracking views, bookings, and revenue across your business.</p>
                            </div>
                            <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="mt-2 tlb-button text-sm px-6">
                                Go to My Listings <ArrowRight size={15} />
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ── Overview KPI hero strip (always) ── */}
                            {overview && (
                                <motion.section
                                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
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

                            {/* ── Tab switcher (Linear/Vercel style) ── */}
                            {tabs.length > 1 && (
                                <div className="border-b border-gray-200/80 mb-6">
                                    <div className="flex gap-6 overflow-x-auto no-scrollbar px-1">
                                        {tabs.map(t => {
                                            const active = activeTab === t.key;
                                            return (
                                                <button
                                                    key={t.key}
                                                    onClick={() => setActiveTab(t.key)}
                                                    className={`relative flex items-center gap-2 py-4 text-sm font-bold whitespace-nowrap transition-colors ${active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    <t.icon size={16} />
                                                    <span>{t.label}</span>
                                                    {active && (
                                                        <motion.div
                                                            layoutId="stat-tab-line"
                                                            className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gray-900 rounded-t-full"
                                                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
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
                                                    <StatTile icon={Ticket} label="Tickets Sold" value={events.tickets_sold} accent="purple" format={fmtCompact}
                                                        delta={events.ticket_growth_pct} subtitle={`${events.this_month_tickets} this month`} />
                                                    <StatTile icon={Target} label="Booking Conv." value={`${(events.booking_conv_rate ?? 0).toFixed(1)}%`} accent="emerald"
                                                        subtitle={`${events.registrations} registrations`} />
                                                </>
                                            )}
                                            {hasVenues && venues && (
                                                <>
                                                    <StatTile icon={DollarSign} label="Monthly Earnings" value={moneyToNumber(venues.monthly_earnings)} accent="amber" format={fmtCurrency}
                                                        delta={lastDelta(revenueTrend)} subtitle={`${venues.total_bookings} bookings`} />
                                                    <StatTile icon={Percent} label="Occupancy" value={`${occupancyRate}%`} accent="blue"
                                                        subtitle={`Avg. ${avgDurationLabel} per booking`} />
                                                </>
                                            )}
                                            {hasClassOrProgram && enquiries && (
                                                <>
                                                    <StatTile icon={Award} label="Conversion" value={`${convRate}%`} accent="emerald"
                                                        subtitle={`${enquiries.monthly_enrolments} enrolments/mo`} />
                                                    <StatTile icon={Users} label="Retention" value={`${Math.round(enquiries.student_retention_pct ?? 0)}%`} accent="blue"
                                                        subtitle={avgResponseHours != null ? `${avgResponseHours.toFixed(1)}h avg response` : undefined} />
                                                </>
                                            )}
                                        </div>

                                        {/* Performance Score + Smart Insights */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <Panel title="Performance Score" subtitle="Composite health score based on your key metrics"
                                                right={<ShieldCheck size={16} className="text-gray-300" />}>
                                                {(() => {
                                                    const factors: { name: string; value: number; max: number }[] = [];
                                                    if (hasEvents && events) {
                                                        factors.push({ name: 'Ticket Growth', value: Math.max(0, Math.min(100, 50 + (events.ticket_growth_pct ?? 0))), max: 100 });
                                                        factors.push({ name: 'Booking Conv.', value: Math.min(events.booking_conv_rate ?? 0, 50), max: 50 });
                                                    }
                                                    if (hasVenues && venues) {
                                                        factors.push({ name: 'Occupancy', value: occupancyRate, max: 100 });
                                                        factors.push({ name: 'Repeat Clients', value: Math.min(venues.repeat_clients * 10, 100), max: 100 });
                                                    }
                                                    if (hasClassOrProgram && enquiries) {
                                                        factors.push({ name: 'Funnel Conv.', value: convRate, max: 100 });
                                                        factors.push({ name: 'Student Retention', value: Math.round(enquiries.student_retention_pct ?? 0), max: 100 });
                                                    }
                                                    if (reviews && reviews.avg_rating != null) {
                                                        factors.push({ name: 'Rating', value: Math.round((reviews.avg_rating / 5) * 100), max: 100 });
                                                    }
                                                    const composite = factors.length > 0
                                                        ? Math.round(factors.reduce((s, f) => s + (f.max > 0 ? f.value / f.max : 0), 0) / factors.length * 100)
                                                        : 0;
                                                    return <PerformanceScore score={Math.min(composite, 100)} label="Score" factors={factors.slice(0, 5)} />;
                                                })()}
                                            </Panel>

                                            <Panel title="Smart Insights" subtitle="AI-powered tips based on your data"
                                                right={<Lightbulb size={16} className="text-amber-400" />}>
                                                {(() => {
                                                    const insights = generateInsights(overview, events, venues, enquiries, revenue, reviews);
                                                    return insights.length > 0
                                                        ? <div className="divide-y divide-gray-50">{insights.map((ins, i) => <InsightBullet key={i} {...ins} />)}</div>
                                                        : <EmptyMini text="Add more listings to unlock insights" />;
                                                })()}
                                            </Panel>
                                        </div>

                                        {/* Peak highlights */}
                                        {(() => {
                                            const highlights: React.ReactNode[] = [];
                                            if (events && events.weekly_ticket_sales?.length) {
                                                const peak = events.weekly_ticket_sales.reduce((a, b) => b.count > a.count ? b : a, events.weekly_ticket_sales[0]);
                                                if (peak.count > 0) highlights.push(
                                                    <HighlightCard key="peak-day" icon={Flame} title="Best Day" value={peak.day}
                                                        subtitle={`${peak.count} ticket${peak.count > 1 ? 's' : ''} sold`} accent="amber" />
                                                );
                                            }
                                            if (events?.by_category?.length) {
                                                const top = [...events.by_category].sort((a, b) => b.count - a.count)[0];
                                                if (top.count > 0) highlights.push(
                                                    <HighlightCard key="top-cat" icon={Trophy} title="Top Category" value={top.category}
                                                        subtitle={`${top.count} bookings · ${fmtCurrency(moneyToNumber(top.amount))}`} accent="purple" />
                                                );
                                            }
                                            if (revenue) {
                                                const rpb = revenue.confirmed_bookings > 0 ? moneyToNumber(revenue.gross_revenue) / revenue.confirmed_bookings : 0;
                                                if (rpb > 0) highlights.push(
                                                    <HighlightCard key="rpb" icon={DollarSign} title="Revenue / Booking" value={fmtCurrency(rpb)}
                                                        subtitle={`${revenue.confirmed_bookings} confirmed bookings`} accent="emerald" />
                                                );
                                                const gross = moneyToNumber(revenue.gross_revenue);
                                                const net = moneyToNumber(revenue.net_earnings);
                                                if (gross > 0) highlights.push(
                                                    <HighlightCard key="margin" icon={PieChart} title="Net Margin" value={`${((net / gross) * 100).toFixed(1)}%`}
                                                        subtitle={`${fmtCurrency(net)} of ${fmtCurrency(gross)}`} accent="blue" />
                                                );
                                            }
                                            return highlights.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{highlights}</div>
                                            ) : null;
                                        })()}

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
                                            <StatTile icon={Ticket} label="Tickets Sold" value={events.tickets_sold} accent="purple" format={fmtCompact}
                                                delta={events.ticket_growth_pct} subtitle={`${events.this_month_tickets} this month`} />
                                            <StatTile icon={Users} label="Registrations" value={events.registrations} accent="emerald" format={fmtCompact} />
                                            <StatTile icon={Zap} label="Event Reach" value={events.event_reach} accent="amber" format={fmtCompact} />
                                        </div>

                                        {/* Peak highlights */}
                                        {(() => {
                                            const cards: React.ReactNode[] = [];
                                            if (events.weekly_ticket_sales?.length) {
                                                const peak = events.weekly_ticket_sales.reduce((a, b) => b.count > a.count ? b : a, events.weekly_ticket_sales[0]);
                                                if (peak.count > 0) cards.push(
                                                    <HighlightCard key="pd" icon={Flame} title="Peak Day" value={peak.day}
                                                        subtitle={`${peak.count} tickets · ${peak.date ?? ''}`} accent="amber" />
                                                );
                                            }
                                            if (events.by_category?.length) {
                                                const top = [...events.by_category].sort((a, b) => b.count - a.count)[0];
                                                if (top.count > 0) cards.push(
                                                    <HighlightCard key="tc" icon={Trophy} title="Top Category" value={top.category}
                                                        subtitle={`${top.count} bookings · ${fmtCurrency(moneyToNumber(top.amount))}`} accent="purple" />
                                                );
                                            }
                                            if (events.registrations > 0) cards.push(
                                                <HighlightCard key="reach" icon={Eye} title="Event Reach" value={fmtCompact(events.event_reach)}
                                                    subtitle={`${events.registrations} registrations`} accent="blue" />
                                            );
                                            return cards.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">{cards}</div>
                                            ) : null;
                                        })()}

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <Panel title="Weekly Ticket Sales" subtitle="Last 7 days"
                                                right={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total {weeklyBars.reduce((a, b) => a + b.value, 0)}</span>}>
                                                {weeklyBars.length ? (
                                                    <InteractiveBarChart points={weeklyBars} color={ACCENTS.purple.solid} formatValue={(n) => `${Math.round(n)} sold`} />
                                                ) : <EmptyMini text="No sales this week" />}
                                            </Panel>

                                            <div className="grid grid-cols-2 gap-3 sm:gap-4 content-start">
                                                <StatTile icon={Activity} label="Engagement Rate" value={engagementRate != null ? `${engagementRate}%` : '—'} accent="blue" />
                                                <StatTile icon={Target} label="Booking Conv." value={`${(events.booking_conv_rate ?? 0).toFixed(1)}%`} accent="emerald"
                                                    subtitle={events.registrations > 0 ? `${events.registrations} views → ${events.tickets_sold} sold` : undefined} />
                                                <StatTile icon={TrendingUp} label="This Month" value={events.this_month_tickets} accent="amber" format={fmtCompact}
                                                    delta={events.ticket_growth_pct} />
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
                                                <StatTile icon={MapPin} label="Bookings" value={venues.total_bookings} accent="blue" format={fmtCompact}
                                                    subtitle={venues.upcoming > 0 ? `${venues.upcoming} upcoming` : undefined} />
                                                <StatTile icon={DollarSign} label="Rev / Booking" value={venues.total_bookings > 0 ? fmtCurrency(moneyToNumber(venues.monthly_earnings) / venues.total_bookings) : '—'} accent="amber"
                                                    subtitle="Avg. revenue per booking" />
                                                <StatTile icon={Clock} label="Avg. Duration" value={avgDurationLabel} accent="purple"
                                                    subtitle="Per booking session" />
                                                <StatTile icon={Heart} label="Repeat Clients" value={venues.repeat_clients} accent="emerald" format={fmtCompact}
                                                    subtitle={venues.total_bookings > 0 ? `${((venues.repeat_clients / venues.total_bookings) * 100).toFixed(0)}% repeat rate` : undefined} />
                                            </div>
                                        </div>

                                        {/* Venue highlight cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                            <HighlightCard icon={Percent} title="Occupancy" value={`${occupancyRate}%`}
                                                subtitle={occupancyRate >= 70 ? 'High demand — consider adding slots' : occupancyRate >= 40 ? 'Moderate — room to grow' : 'Low — try promotions'}
                                                accent={occupancyRate >= 70 ? 'emerald' : occupancyRate >= 40 ? 'amber' : 'rose'} />
                                            {venueEnquiryCount > 0 && (
                                                <HighlightCard icon={ArrowUpRight} title="Enquiry Conversion" value={`${bookingStats.venueBookings > 0 ? ((bookingStats.venueBookings / venueEnquiryCount) * 100).toFixed(0) : 0}%`}
                                                    subtitle={`${venueEnquiryCount} enquiries → ${bookingStats.venueBookings} booked`} accent="blue" />
                                            )}
                                            {avgDuration > 0 && (
                                                <HighlightCard icon={Clock} title="Avg Session" value={avgDurationLabel}
                                                    subtitle={`Across ${venues.total_bookings} bookings`} accent="purple" />
                                            )}
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
                                                <StatTile icon={Clock} label="Avg. Response" value={avgResponseHours != null ? `${avgResponseHours.toFixed(1)}h` : '—'} accent="blue"
                                                    subtitle={avgResponseHours != null ? (avgResponseHours <= 4 ? 'Excellent speed' : avgResponseHours <= 12 ? 'Good' : 'Needs improvement') : undefined} />
                                                <StatTile icon={Users} label="Retention" value={`${Math.round(enquiries.student_retention_pct ?? 0)}%`} accent="emerald"
                                                    delta={lastDelta(enquiryTrend)} subtitle="Student retention rate" />
                                                <StatTile icon={Target} label="Enrolments" value={enquiries.monthly_enrolments} accent="amber" format={fmtCompact}
                                                    subtitle="Monthly enrolments" />
                                            </div>
                                        </div>

                                        {/* Engagement highlight cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                            {avgResponseHours != null && (
                                                <HighlightCard icon={Zap} title="Response Speed"
                                                    value={avgResponseHours <= 1 ? 'Lightning' : avgResponseHours <= 4 ? 'Fast' : avgResponseHours <= 12 ? 'Moderate' : 'Slow'}
                                                    subtitle={`${avgResponseHours.toFixed(1)}h average response time`}
                                                    accent={avgResponseHours <= 4 ? 'emerald' : avgResponseHours <= 12 ? 'amber' : 'rose'} />
                                            )}
                                            <HighlightCard icon={Award} title="Lead Quality" value={`${convRate}%`}
                                                subtitle={`${funnel?.new_leads ?? 0} leads → ${funnel?.converted ?? 0} converted`} accent="purple" />
                                            {enquiries.student_retention_pct != null && (
                                                <HighlightCard icon={Heart} title="Student Loyalty"
                                                    value={`${Math.round(enquiries.student_retention_pct)}%`}
                                                    subtitle={enquiries.student_retention_pct >= 70 ? 'Strong retention' : 'Room for improvement'}
                                                    accent={enquiries.student_retention_pct >= 70 ? 'emerald' : 'amber'} />
                                            )}
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
                                            <StatTile icon={DollarSign} label="Gross Revenue" value={moneyToNumber(revenue.gross_revenue)} accent="emerald" format={fmtCurrency} big
                                                delta={revenue.revenue_growth_pct} />
                                            <StatTile icon={Wallet} label="Net Earnings" value={moneyToNumber(revenue.net_earnings)} accent="blue" format={fmtCurrency} big
                                                subtitle={moneyToNumber(revenue.gross_revenue) > 0 ? `${((moneyToNumber(revenue.net_earnings) / moneyToNumber(revenue.gross_revenue)) * 100).toFixed(1)}% net margin` : undefined} />
                                            <StatTile icon={Percent} label="Platform Fees" value={moneyToNumber(revenue.platform_fees)} accent="amber" format={fmtCurrency}
                                                subtitle={moneyToNumber(revenue.gross_revenue) > 0 ? `${((moneyToNumber(revenue.platform_fees) / moneyToNumber(revenue.gross_revenue)) * 100).toFixed(1)}% of gross` : undefined} />
                                            <StatTile icon={TrendingDown} label="Refunds" value={moneyToNumber(revenue.refunds)} accent="rose" format={fmtCurrency}
                                                subtitle={moneyToNumber(revenue.gross_revenue) > 0 ? `${((moneyToNumber(revenue.refunds) / moneyToNumber(revenue.gross_revenue)) * 100).toFixed(1)}% refund rate` : undefined} />
                                            <StatTile icon={Ticket} label="Confirmed Bookings" value={revenue.confirmed_bookings} accent="purple" format={fmtCompact}
                                                subtitle={revenue.confirmed_bookings > 0 ? `${fmtCurrency(moneyToNumber(revenue.gross_revenue) / revenue.confirmed_bookings)} per booking` : undefined} />
                                            <StatTile icon={Target} label="Avg. Order Value" value={moneyToNumber(revenue.avg_order_value)} accent="amber" format={fmtCurrency} />
                                        </div>

                                        {/* Revenue highlights */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                            {moneyToNumber(revenue.gross_revenue) > 0 && (
                                                <HighlightCard icon={PieChart} title="Net Margin" value={`${((moneyToNumber(revenue.net_earnings) / moneyToNumber(revenue.gross_revenue)) * 100).toFixed(1)}%`}
                                                    subtitle={`${fmtCurrency(moneyToNumber(revenue.net_earnings))} net of ${fmtCurrency(moneyToNumber(revenue.gross_revenue))}`} accent="emerald" />
                                            )}
                                            {revenue.confirmed_bookings > 0 && (
                                                <HighlightCard icon={BarChart3} title="Rev / Booking" value={fmtCurrency(moneyToNumber(revenue.gross_revenue) / revenue.confirmed_bookings)}
                                                    subtitle={`${revenue.confirmed_bookings} confirmed`} accent="blue" />
                                            )}
                                            {moneyToNumber(revenue.refunds) > 0 && (
                                                <HighlightCard icon={AlertTriangle} title="Refund Rate" value={`${((moneyToNumber(revenue.refunds) / moneyToNumber(revenue.gross_revenue)) * 100).toFixed(1)}%`}
                                                    subtitle={`${fmtCurrency(moneyToNumber(revenue.refunds))} refunded`} accent="rose" />
                                            )}
                                            {revenue.revenue_growth_pct !== 0 && (
                                                <HighlightCard icon={revenue.revenue_growth_pct > 0 ? TrendingUp : TrendingDown}
                                                    title="MoM Growth" value={`${revenue.revenue_growth_pct > 0 ? '+' : ''}${revenue.revenue_growth_pct.toFixed(1)}%`}
                                                    subtitle={`${fmtCurrency(moneyToNumber(revenue.this_month))} this month`}
                                                    accent={revenue.revenue_growth_pct > 0 ? 'emerald' : 'rose'} />
                                            )}
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
                                            <StatTile icon={TrendingUp} label="This Month" value={reviews.reviews_this_month} accent="emerald" format={fmtCompact}
                                                delta={reviews.reviews_prev_month > 0 ? ((reviews.reviews_this_month - reviews.reviews_prev_month) / reviews.reviews_prev_month) * 100 : null}
                                                subtitle={`vs ${reviews.reviews_prev_month} last month`} />
                                            <StatTile icon={Clock} label="Prev Month" value={reviews.reviews_prev_month} accent="amber" format={fmtCompact} />
                                        </div>

                                        {/* Sentiment gauge + highlights */}
                                        {(() => {
                                            const dist = reviews.rating_distribution;
                                            const total = reviews.total_reviews || 1;
                                            const positive = dist.filter(d => d.rating >= 4).reduce((s, d) => s + d.count, 0);
                                            const neutral = dist.filter(d => d.rating === 3).reduce((s, d) => s + d.count, 0);
                                            const negative = dist.filter(d => d.rating <= 2).reduce((s, d) => s + d.count, 0);
                                            const posPct = Math.round((positive / total) * 100);
                                            const neuPct = Math.round((neutral / total) * 100);
                                            const negPct = Math.round((negative / total) * 100);
                                            return (
                                                <Panel title="Sentiment Breakdown" subtitle="Customer satisfaction at a glance">
                                                    <div className="space-y-4">
                                                        <div className="flex h-4 rounded-full overflow-hidden">
                                                            {posPct > 0 && <motion.div className="bg-emerald-400" initial={{ width: 0 }} animate={{ width: `${posPct}%` }} transition={{ duration: 0.8 }} />}
                                                            {neuPct > 0 && <motion.div className="bg-amber-300" initial={{ width: 0 }} animate={{ width: `${neuPct}%` }} transition={{ duration: 0.8, delay: 0.1 }} />}
                                                            {negPct > 0 && <motion.div className="bg-rose-400" initial={{ width: 0 }} animate={{ width: `${negPct}%` }} transition={{ duration: 0.8, delay: 0.2 }} />}
                                                        </div>
                                                        <div className="flex items-center gap-6 flex-wrap text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                                                                <span className="font-bold text-gray-700">Positive ({posPct}%)</span>
                                                                <span className="text-gray-400">{positive} reviews</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full bg-amber-300" />
                                                                <span className="font-bold text-gray-700">Neutral ({neuPct}%)</span>
                                                                <span className="text-gray-400">{neutral} reviews</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full bg-rose-400" />
                                                                <span className="font-bold text-gray-700">Negative ({negPct}%)</span>
                                                                <span className="text-gray-400">{negative} reviews</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Panel>
                                            );
                                        })()}

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

                                        {/* Review velocity highlight */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                            {reviews.avg_rating != null && (
                                                <HighlightCard icon={Star} title="Rating Quality"
                                                    value={reviews.avg_rating >= 4.5 ? 'Excellent' : reviews.avg_rating >= 3.5 ? 'Good' : reviews.avg_rating >= 2.5 ? 'Average' : 'Needs Work'}
                                                    subtitle={`${reviews.avg_rating.toFixed(1)} out of 5 stars`}
                                                    accent={reviews.avg_rating >= 4.5 ? 'emerald' : reviews.avg_rating >= 3.5 ? 'amber' : 'rose'} />
                                            )}
                                            <HighlightCard icon={BarChart3} title="Review Velocity"
                                                value={`${reviews.reviews_this_month}/mo`}
                                                subtitle={reviews.reviews_this_month > reviews.reviews_prev_month ? 'Trending up' : reviews.reviews_this_month === reviews.reviews_prev_month ? 'Steady' : 'Trending down'}
                                                accent={reviews.reviews_this_month >= reviews.reviews_prev_month ? 'blue' : 'amber'} />
                                            {reviews.total_reviews > 0 && (
                                                <HighlightCard icon={ThumbsUp} title="Satisfaction"
                                                    value={`${Math.round((reviews.rating_distribution.filter(d => d.rating >= 4).reduce((s, d) => s + d.count, 0) / reviews.total_reviews) * 100)}%`}
                                                    subtitle="4+ star ratings" accent="emerald" />
                                            )}
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
            <div className="flex items-center gap-6 mt-2">
                <AnimatedDonut
                    segments={[
                        { value: pct, color: a.solid, label: toLabel },
                        { value: Math.max(0, 100 - pct), color: '#F8FAFC', label: 'Rest' },
                    ]}
                    centerLabel={`${pct}%`}
                    centerSub="conv. rate"
                />
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-200" />
                        <span className="text-sm font-medium text-gray-500 flex-1">{fromLabel}</span>
                        <span className="text-base font-black text-gray-900"><CountUp value={fromValue} /></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.15)]" style={{ background: a.solid, shadowColor: a.solid }} />
                        <span className="text-sm font-medium text-gray-900 flex-1">{toLabel}</span>
                        <span className="text-base font-black text-gray-900"><CountUp value={toValue} /></span>
                    </div>
                    <div className="pt-3 mt-1 border-t border-gray-100 text-[11px] font-bold text-gray-400">
                        {toValue} of {fromValue} {fromLabel.toLowerCase()} &rarr; {toLabel.toLowerCase()}
                    </div>
                </div>
            </div>
        </Panel>
    );
};

export default Analytics;
