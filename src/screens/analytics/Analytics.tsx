import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
    Menu, RefreshCw, Eye, Heart, Zap, Activity, TrendingUp, TrendingDown,
    Users, BookOpen, Target, ArrowRight, Repeat, Sparkles,
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import {
    getStatsOverview, getStatsEvents, getStatsEnquiries, getStatsVenues,
    StatsOverview, StatsEvents, StatsEnquiries, StatsVenues,
} from '../../api/stats';
import {
    InteractiveAreaChart, InteractiveBarChart, AnimatedDonut,
    CountUp, fmtCompact, AreaPoint,
} from '../statistics/StatCharts';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

// ── Helpers ──
const monthShort = (full: string): string => full?.split(' ')[0] ?? full ?? '';
const settledValue = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === 'fulfilled' ? r.value : null;

// ── Accent palette ──
const ACCENTS = {
    blue: { bg: '#EFF6FF', fg: '#3B82F6', solid: '#3B82F6' },
    purple: { bg: '#F5F3FF', fg: '#8B5CF6', solid: '#8B5CF6' },
    emerald: { bg: '#ECFDF5', fg: '#10B981', solid: '#10B981' },
    amber: { bg: '#FFFBEB', fg: '#F59E0B', solid: '#F59E0B' },
    rose: { bg: '#FFF1F2', fg: '#F43F5E', solid: '#F43F5E' },
    cyan: { bg: '#ECFEFF', fg: '#06B6D4', solid: '#06B6D4' },
} as const;
type AccentKey = keyof typeof ACCENTS;

// ── Category donut palette ──
const CAT_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#06B6D4'];

// ── Reusable audience tile ──
const StatTile: React.FC<{
    icon: React.ElementType; label: string; value: number | string;
    accent: AccentKey; format?: (n: number) => string; sub?: string; big?: boolean;
}> = ({ icon: Icon, label, value, accent, format, sub, big }) => {
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
                {sub && <p className="text-[10px] font-semibold text-gray-400 mt-1">{sub}</p>}
            </div>
        </motion.div>
    );
};

// ── Section card wrapper ──
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

const EmptyMini: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center justify-center h-40 text-[11px] font-bold text-gray-300 uppercase tracking-widest text-center px-4">{text}</div>
);

export const Analytics: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const { allowedEntities } = usePartner();

    const [overview, setOverview] = useState<StatsOverview | null>(null);
    const [events, setEvents] = useState<StatsEvents | null>(null);
    const [enquiries, setEnquiries] = useState<StatsEnquiries | null>(null);
    const [venues, setVenues] = useState<StatsVenues | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        const [oRes, eRes, enqRes, vRes] = await Promise.allSettled([
            getStatsOverview(), getStatsEvents(), getStatsEnquiries(), getStatsVenues(),
        ]);
        setOverview(settledValue(oRes));
        setEvents(settledValue(eRes));
        setEnquiries(settledValue(enqRes));
        setVenues(settledValue(vRes));
        if ([oRes, eRes, enqRes, vRes].every(r => r.status === 'rejected')) setError(true);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const hasVenues = allowedEntities.includes('Venues');

    // ── Reach trend (audience reached over recent months, from ticket activity) ──
    const reachTrend: AreaPoint[] = useMemo(() =>
        (events?.ticket_sales_trend ?? []).map(t => ({ label: monthShort(t.month), value: t.count })),
        [events],
    );
    // ── Weekly activity (audience actions in the last 7 days) ──
    const weeklyBars = useMemo(() =>
        (events?.weekly_ticket_sales ?? []).map(d => ({ label: d.day, value: d.count, note: d.date })),
        [events],
    );
    // ── Audience by category (share of engaged audience) ──
    const categorySegments = useMemo(() =>
        (events?.by_category ?? []).map((c, i) => ({
            value: c.count, color: CAT_COLORS[i % CAT_COLORS.length], label: c.category,
        })),
        [events],
    );

    const lastDelta = (arr: AreaPoint[]) => {
        if (arr.length < 2) return 0;
        const prev = arr[arr.length - 2].value;
        const curr = arr[arr.length - 1].value;
        return prev ? ((curr - prev) / prev) * 100 : 0;
    };

    const profileViews = overview?.profile_views ?? 0;
    const followers = overview?.followers ?? 0;
    const reach = events?.event_reach ?? 0;
    const engagementRate = events?.engagement_rate;
    const registrations = events?.registrations ?? 0;
    const newEnquiries = overview?.new_enquiries ?? 0;
    const retentionPct = Math.round(enquiries?.student_retention_pct ?? 0);
    const repeatClients = venues?.repeat_clients ?? 0;

    // Engagement = engaged actions (registrations + enquiries) ÷ reach
    const derivedEngagement = engagementRate != null
        ? `${engagementRate}%`
        : reach > 0
            ? `${Math.min(100, Math.round(((registrations + newEnquiries) / reach) * 100))}%`
            : '—';

    // ── Auto insights (plain-language highlights) ──
    const insights = useMemo(() => {
        const out: string[] = [];
        const reachDelta = lastDelta(reachTrend);
        if (reachDelta) {
            out.push(reachDelta > 0
                ? `Audience reach is up ${reachDelta.toFixed(0)}% vs last month — keep the momentum going.`
                : `Audience reach dipped ${Math.abs(reachDelta).toFixed(0)}% vs last month — try a fresh listing or promo.`);
        }
        if (followers > 0) out.push(`You have ${followers.toLocaleString('en-IN')} followers watching your brand.`);
        if (retentionPct >= 60) out.push(`Strong ${retentionPct}% audience retention — people keep coming back.`);
        if (repeatClients > 0 && hasVenues) out.push(`${repeatClients} repeat venue clients this period.`);
        if (out.length === 0) out.push('Publish and promote listings to start growing your audience.');
        return out.slice(0, 3);
    }, [reachTrend, followers, retentionPct, repeatClients, hasVenues]);

    const noData = !overview && !events && !enquiries && !venues;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-sm px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <Menu size={24} />
                    </button>
                    <div>
                        <h1 className="tlb-page-title">Analytics</h1>
                        <p className="tlb-page-sub">Audience reach, engagement &amp; growth</p>
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
                    ) : (
                        <>
                            {/* ── Audience hero KPIs ── */}
                            <motion.section
                                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                                initial="initial" animate="animate"
                                variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
                            >
                                {[
                                    { label: 'Profile Views', value: profileViews, icon: Eye, accent: 'blue' as AccentKey, format: fmtCompact },
                                    { label: 'Followers', value: followers, icon: Heart, accent: 'rose' as AccentKey, format: fmtCompact },
                                    { label: 'Audience Reach', value: reach, icon: Zap, accent: 'amber' as AccentKey, format: fmtCompact },
                                    { label: 'Engagement', value: derivedEngagement, icon: Activity, accent: 'emerald' as AccentKey },
                                ].map(s => (
                                    <motion.div key={s.label} variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}>
                                        <StatTile icon={s.icon} label={s.label} value={s.value} accent={s.accent} format={s.format} big />
                                    </motion.div>
                                ))}
                            </motion.section>

                            {/* ── Auto insights ── */}
                            <div className="tlb-card p-5 sm:p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={16} className="text-tlb-yellow" />
                                    <h3 className="font-black">Growth Insights</h3>
                                </div>
                                <div className="space-y-2.5">
                                    {insights.map((line, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + i * 0.08 }}
                                            className="flex items-start gap-2.5"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-tlb-yellow mt-1.5 shrink-0" />
                                            <p className="text-sm text-gray-200 leading-relaxed">{line}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Reach trend ── */}
                            <Panel
                                title="Audience Reach Trend"
                                subtitle="How many people you reached over recent months"
                                right={<DeltaPill pct={lastDelta(reachTrend)} />}
                            >
                                {reachTrend.length >= 2
                                    ? <InteractiveAreaChart points={reachTrend} color={ACCENTS.amber.solid} id="an-reach" formatValue={(n) => `${Math.round(n)} reached`} />
                                    : <EmptyMini text="Not enough reach history yet" />}
                            </Panel>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* ── Weekly activity ── */}
                                <Panel
                                    title="Weekly Activity"
                                    subtitle="Audience actions in the last 7 days"
                                    right={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total {weeklyBars.reduce((a, b) => a + b.value, 0)}</span>}
                                >
                                    {weeklyBars.length
                                        ? <InteractiveBarChart points={weeklyBars} color={ACCENTS.blue.solid} formatValue={(n) => `${Math.round(n)} actions`} />
                                        : <EmptyMini text="No activity this week" />}
                                </Panel>

                                {/* ── Audience by category ── */}
                                <Panel title="Audience by Category" subtitle="Where your engaged audience comes from">
                                    {categorySegments.length ? (
                                        <div className="flex items-center gap-5">
                                            <AnimatedDonut
                                                segments={categorySegments}
                                                centerLabel={fmtCompact(categorySegments.reduce((a, b) => a + b.value, 0))}
                                                centerSub="Reached"
                                            />
                                            <div className="flex-1 space-y-2.5 min-w-0">
                                                {categorySegments.slice(0, 5).map(seg => (
                                                    <div key={seg.label} className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                                                        <span className="text-xs text-gray-500 flex-1 truncate">{seg.label}</span>
                                                        <span className="text-sm font-black text-gray-900">{seg.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : <EmptyMini text="No category data yet" />}
                                </Panel>
                            </div>

                            {/* ── Engagement & loyalty tiles ── */}
                            <div>
                                <h3 className="font-black text-gray-900 mb-4">Engagement &amp; Loyalty</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <StatTile icon={Users} label="Registrations" value={registrations} accent="purple" format={fmtCompact} />
                                    <StatTile icon={BookOpen} label="New Enquiries" value={newEnquiries} accent="cyan" format={fmtCompact} />
                                    <StatTile icon={Target} label="Retention" value={`${retentionPct}%`} accent="emerald" sub="Audience who return" />
                                    <StatTile icon={Repeat} label={hasVenues ? 'Repeat Clients' : 'Active Batches'} value={hasVenues ? repeatClients : (overview?.active_batches ?? 0)} accent="amber" format={fmtCompact} />
                                </div>
                            </div>

                            {/* ── CTA to detailed statistics ── */}
                            <button
                                onClick={() => onNavigate('STATISTICS')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                See detailed statistics &amp; revenue <ArrowRight size={15} />
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Analytics;
