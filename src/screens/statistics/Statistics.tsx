import React, { useState, useEffect, useCallback } from 'react';
import {
    Menu, ArrowRight, Activity, Users, Target, Star,
    Clock, BookOpen, CalendarDays, Ticket, Zap,
    DollarSign, MapPin, Percent, RefreshCw,
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import {
    getStatsOverview, getStatsEvents, getStatsVenues, getStatsEnquiries,
    StatsOverview, StatsEvents, StatsVenues, StatsEnquiries,
} from '../../api/stats';
import {
    WeeklyBarChart, TrendAreaChart, DonutChart,
    fmtCurrency, trendPct,
} from '../../components/ui/DashboardCharts';

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

const monthShort = (full: string): string => {
    // "Dec 2025" → "Dec" (already short by default, but defensive)
    return full?.split(' ')[0] ?? full ?? '';
};

const settledValue = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === 'fulfilled' ? r.value : null;

export const Statistics: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const { allowedEntities } = usePartner();

    const [overview, setOverview] = useState<StatsOverview | null>(null);
    const [events, setEvents] = useState<StatsEvents | null>(null);
    const [venues, setVenues] = useState<StatsVenues | null>(null);
    const [enquiries, setEnquiries] = useState<StatsEnquiries | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const [oRes, eRes, vRes, enqRes] = await Promise.allSettled([
                getStatsOverview(),
                getStatsEvents(),
                getStatsVenues(),
                getStatsEnquiries(),
            ]);
            setOverview(settledValue(oRes));
            setEvents(settledValue(eRes));
            setVenues(settledValue(vRes));
            setEnquiries(settledValue(enqRes));
            // Treat all-failed as error; any partial response is shown.
            if ([oRes, eRes, vRes, enqRes].every(r => r.status === 'rejected')) {
                setError(true);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const hasClassOrProgram = allowedEntities.includes('Classes') || allowedEntities.includes('Programs');
    const hasEvents = allowedEntities.includes('Events');
    const hasVenues = allowedEntities.includes('Venues');

    // ── Derive chart data from API arrays (label + value extracted together) ──
    const weeklyData = events?.weekly_ticket_sales ?? [];
    const weeklyValues = weeklyData.map(d => d.count);
    const weeklyLabels = weeklyData.map(d => d.day);
    const weeklyTotal = weeklyValues.reduce((a, b) => a + b, 0);

    const ticketTrend = events?.ticket_sales_trend ?? [];
    const ticketTrendValues = ticketTrend.map(t => t.count);
    const ticketTrendLabels = ticketTrend.map(t => monthShort(t.month));

    const revenueTrend = venues?.revenue_trend ?? [];
    const revenueTrendValues = revenueTrend.map(r => moneyToNumber(r.earnings));
    const revenueTrendLabels = revenueTrend.map(r => monthShort(r.month));

    const enquiryTrend = enquiries?.monthly_trend ?? [];
    const enquiryTrendValues = enquiryTrend.map(t => t.count);
    const enquiryTrendLabels = enquiryTrend.map(t => monthShort(t.month));

    // ── Funnel ──
    const funnel = enquiries?.conversion_funnel;
    const funnelNew = funnel?.new_leads ?? 0;
    const funnelContacted = funnel?.contacted ?? 0;
    const funnelConverted = funnel?.converted ?? 0;
    const convRate = Math.round(funnel?.conversion_rate ?? 0);

    // ── Events stats ──
    const upcomingEvents = events?.upcoming ?? 0;
    const ticketsSold = events?.tickets_sold ?? 0;
    const registrations = events?.registrations ?? 0;
    const eventReach = events?.event_reach ?? 0;
    const engagementRate = events?.engagement_rate; // always null per spec
    const bookingConvRate = events?.booking_conv_rate ?? 0;
    const thisMonthTickets = events?.this_month_tickets ?? 0;
    const prevMonthTickets = events?.prev_month_tickets ?? 0;
    const ticketGrowthPct = events?.ticket_growth_pct ?? 0;

    // ── Venues stats ──
    const venueBookings = venues?.total_bookings ?? 0;
    const upcomingReservations = venues?.upcoming ?? 0;
    const monthlyEarnings = moneyToNumber(venues?.monthly_earnings);
    const occupancyRate = Math.round(venues?.occupancy_rate ?? 0);
    const avgDurationMinutes = venues?.avg_duration_minutes ?? 0;
    const avgDurationLabel = avgDurationMinutes > 0
        ? avgDurationMinutes >= 60
            ? `${(avgDurationMinutes / 60).toFixed(1)}h`
            : `${Math.round(avgDurationMinutes)}m`
        : '—';
    const repeatClients = venues?.repeat_clients ?? 0;

    // ── Enquiry stats ──
    const trialRequests = enquiries?.trial_requests ?? 0;
    const avgResponseHours = enquiries?.avg_response_hours;
    const studentRetention = enquiries?.student_retention_pct ?? 0;
    const monthlyEnrolments = enquiries?.monthly_enrolments ?? 0;

    // ── Universal 6-month trend selection ──
    const weeklyLabel = hasEvents ? 'Weekly Ticket Sales' :
        hasVenues ? 'Weekly Activity' : 'Weekly Activity';
    const trendLabel = hasEvents ? 'Ticket Sales Trend' :
        hasVenues ? 'Booking Revenue Trend' : 'Enquiry Trend';
    const trendValues = hasEvents ? ticketTrendValues :
        hasVenues ? revenueTrendValues : enquiryTrendValues;
    const trendLabels = hasEvents ? ticketTrendLabels :
        hasVenues ? revenueTrendLabels : enquiryTrendLabels;
    const trendColor = hasEvents ? '#8B5CF6' : hasVenues ? '#F59E0B' : '#3B82F6';
    const trendId = hasEvents ? 'st-evtkt' : hasVenues ? 'st-vnrev' : 'st-clsenq';

    const noData = !overview && !events && !venues && !enquiries;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <Menu size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Statistics</h1>
                        <p className="text-sm font-bold text-gray-400 mt-0.5">Analytics, trends, and performance</p>
                    </div>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-700 disabled:opacity-40"
                    title="Refresh"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <main className="p-6">
                <div className="tlb-content space-y-8">

                    {loading && noData ? (
                        <div className="flex items-center justify-center py-24">
                            <RefreshCw size={28} className="text-gray-300 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-4 py-24 text-center">
                            <p className="text-sm font-bold text-gray-400">Could not load analytics data.</p>
                            <button onClick={load} className="text-xs font-black text-blue-500 hover:underline">Try again</button>
                        </div>
                    ) : (
                        <>
                            {/* ── Profile Overview Strip ── */}
                            {overview && (
                                <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Profile Views', value: overview.profile_views, icon: Activity, bg: 'bg-blue-50', color: 'text-blue-500' },
                                        { label: 'Followers', value: overview.followers, icon: Users, bg: 'bg-emerald-50', color: 'text-emerald-500' },
                                        { label: 'New Enquiries', value: overview.new_enquiries, icon: BookOpen, bg: 'bg-purple-50', color: 'text-purple-500' },
                                        { label: 'Active Batches', value: overview.active_batches, icon: Target, bg: 'bg-amber-50', color: 'text-amber-500' },
                                    ].map(stat => (
                                        <div key={stat.label} className="tlb-card p-4 flex flex-col gap-2">
                                            <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                                                <stat.icon size={16} />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black leading-none">{stat.value}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </section>
                            )}

                            {/* ── Weekly Ticket Sales ── */}
                            {hasEvents && events && (
                                <section className="tlb-card p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <h3 className="font-black text-gray-900">{weeklyLabel}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                                            <Activity size={13} className="text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                Total: {weeklyTotal}
                                            </span>
                                        </div>
                                    </div>
                                    <WeeklyBarChart
                                        data={weeklyValues.length ? weeklyValues : [0, 0, 0, 0, 0, 0, 0]}
                                        labels={weeklyLabels.length ? weeklyLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                                        color="#8B5CF6"
                                    />
                                    {weeklyTotal === 0 && (
                                        <p className="text-center text-[10px] font-bold text-gray-300 mt-3 uppercase tracking-widest">
                                            No activity yet this week
                                        </p>
                                    )}
                                </section>
                            )}

                            {/* ── Classes / Programs: Enquiry Insights ── */}
                            {hasClassOrProgram && enquiries && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-gray-900">Enquiry Insights</h3>
                                        <button onClick={() => onNavigate('ENQUIRIES')} className="text-xs font-bold text-tlb-yellow flex items-center gap-1 hover:underline">
                                            View All <ArrowRight size={12} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Funnel Donut */}
                                        <div className="tlb-card p-5">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Conversion Funnel</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-28 h-28 shrink-0">
                                                    <DonutChart
                                                        segments={[
                                                            { value: funnelNew, color: '#3B82F6', label: 'New' },
                                                            { value: funnelContacted, color: '#FACC15', label: 'Contacted' },
                                                            { value: funnelConverted, color: '#10B981', label: 'Converted' },
                                                        ]}
                                                        centerLabel={`${convRate}%`}
                                                        centerSub="CONV. RATE"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-2.5">
                                                    {[
                                                        { label: 'New Leads', value: funnelNew, color: 'bg-blue-500' },
                                                        { label: 'Contacted', value: funnelContacted, color: 'bg-tlb-yellow' },
                                                        { label: 'Converted', value: funnelConverted, color: 'bg-emerald-500' },
                                                    ].map(item => (
                                                        <div key={item.label} className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                                                            <span className="text-xs text-gray-500 flex-1">{item.label}</span>
                                                            <span className="text-xs font-black text-gray-900">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {funnelNew === 0 && funnelContacted === 0 && funnelConverted === 0 && (
                                                <p className="text-center text-[10px] font-bold text-gray-300 mt-3 uppercase tracking-widest">No enquiries yet</p>
                                            )}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: 'Trial Requests', value: trialRequests, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
                                                { label: 'Avg. Response', value: avgResponseHours != null ? `${avgResponseHours.toFixed(1)}h` : '—', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
                                                { label: 'Student Retention', value: `${Math.round(studentRetention)}%`, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                                { label: 'Monthly Enrolments', value: monthlyEnrolments.toString(), icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
                                            ].map(stat => (
                                                <div key={stat.label} className="tlb-card p-4 flex flex-col gap-2">
                                                    <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                                                        <stat.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-black leading-none">{stat.value}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Monthly Enquiry Trend */}
                                    {enquiryTrendValues.length > 0 && (
                                        <div className="tlb-card p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="font-black text-gray-900">Monthly Trend</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Enquiries over last 6 months</p>
                                                </div>
                                                <span className="text-lg font-black text-blue-500">
                                                    {enquiryTrendValues[enquiryTrendValues.length - 1]}
                                                </span>
                                            </div>
                                            <TrendAreaChart data={enquiryTrendValues} labels={enquiryTrendLabels} color="#3B82F6" id="st-moenq" />
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* ── Events Analytics ── */}
                            {hasEvents && events && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-gray-900">Event Analytics</h3>
                                        <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-xs font-bold text-tlb-yellow flex items-center gap-1 hover:underline">
                                            My Events <ArrowRight size={12} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Upcoming', value: upcomingEvents, icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
                                            { label: 'Tickets Sold', value: ticketsSold, icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50' },
                                            { label: 'Registrations', value: registrations, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                            { label: 'Event Reach', value: eventReach, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                                        ].map(stat => (
                                            <div key={stat.label} className="tlb-card p-4 flex flex-col gap-2">
                                                <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                                                    <stat.icon size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-black leading-none">{stat.value}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Engagement + Booking Conv */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="tlb-card p-5">
                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-3">
                                                <Activity size={16} />
                                            </div>
                                            <p className="text-2xl font-black">{engagementRate != null ? `${engagementRate}%` : '—'}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Engagement Rate</p>
                                        </div>
                                        <div className="tlb-card p-5">
                                            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-3">
                                                <Target size={16} />
                                            </div>
                                            <p className="text-2xl font-black">{`${bookingConvRate.toFixed(1)}%`}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Booking Conv. Rate</p>
                                        </div>
                                    </div>

                                    {/* Ticket Sales Trend */}
                                    {ticketTrendValues.length > 0 && (
                                        <div className="tlb-card p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="font-black text-gray-900">Ticket Sales Trend</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Monthly over last 6 months</p>
                                                </div>
                                                <span className="text-lg font-black text-purple-500">
                                                    {ticketTrendValues[ticketTrendValues.length - 1]}
                                                </span>
                                            </div>
                                            <TrendAreaChart data={ticketTrendValues} labels={ticketTrendLabels} color="#8B5CF6" id="st-evtkt" />

                                            <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                                                {[
                                                    { label: 'This Month', value: thisMonthTickets },
                                                    { label: 'Prev Month', value: prevMonthTickets },
                                                    {
                                                        label: 'Growth',
                                                        value: `${ticketGrowthPct > 0 ? '+' : ''}${ticketGrowthPct.toFixed(1)}%`,
                                                    },
                                                ].map(item => (
                                                    <div key={item.label} className="text-center">
                                                        <p className="text-xl font-black text-gray-900">{item.value}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* By Category */}
                                    {events.by_category?.length > 0 && (
                                        <div className="tlb-card p-5">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Bookings by Category</p>
                                            <div className="space-y-3">
                                                {events.by_category.map(cat => {
                                                    const max = Math.max(...events.by_category.map(c => c.count));
                                                    const pct = max > 0 ? (cat.count / max) * 100 : 0;
                                                    return (
                                                        <div key={cat.category}>
                                                            <div className="flex justify-between items-center text-xs mb-1">
                                                                <span className="font-bold text-gray-700">{cat.category}</span>
                                                                <span className="font-black text-gray-900">{cat.count}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-purple-500 rounded-full transition-all"
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* ── Venue Analytics ── */}
                            {hasVenues && venues && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-gray-900">Venue Analytics</h3>
                                        <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-xs font-bold text-tlb-yellow flex items-center gap-1 hover:underline">
                                            My Venues <ArrowRight size={12} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="tlb-card p-5">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Occupancy Rate</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-28 h-28 shrink-0">
                                                    <DonutChart
                                                        segments={[
                                                            { value: occupancyRate, color: '#10B981', label: 'Occupied' },
                                                            { value: Math.max(0, 100 - occupancyRate), color: '#F3F4F6', label: 'Available' },
                                                        ]}
                                                        centerLabel={`${occupancyRate}%`}
                                                        centerSub="OCCUPANCY"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    {[
                                                        { label: 'Total Bookings', value: venueBookings, color: 'bg-blue-500' },
                                                        { label: 'Upcoming', value: upcomingReservations, color: 'bg-amber-400' },
                                                        { label: 'Monthly Earnings', value: fmtCurrency(monthlyEarnings), color: 'bg-emerald-500' },
                                                    ].map(item => (
                                                        <div key={item.label} className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                                                            <span className="text-xs text-gray-500 flex-1">{item.label}</span>
                                                            <span className="text-xs font-black text-gray-900">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: 'Bookings', value: venueBookings, icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-50' },
                                                { label: 'Upcoming', value: upcomingReservations, icon: CalendarDays, color: 'text-amber-500', bg: 'bg-amber-50' },
                                                { label: 'Avg. Duration', value: avgDurationLabel, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
                                                { label: 'Repeat Clients', value: repeatClients, icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                            ].map(stat => (
                                                <div key={stat.label} className="tlb-card p-4 flex flex-col gap-2">
                                                    <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                                                        <stat.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-black leading-none">{stat.value}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Revenue Trend */}
                                    {revenueTrendValues.length > 0 && (
                                        <div className="tlb-card p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="font-black text-gray-900">Revenue Trend</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Monthly earnings over last 6 months</p>
                                                </div>
                                                <span className="text-lg font-black text-amber-500">
                                                    {fmtCurrency(revenueTrendValues[revenueTrendValues.length - 1])}
                                                </span>
                                            </div>
                                            <TrendAreaChart data={revenueTrendValues} labels={revenueTrendLabels} color="#F59E0B" id="st-vnrev" />
                                        </div>
                                    )}

                                    {/* Extra venue stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="tlb-card p-5">
                                            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-3">
                                                <DollarSign size={16} />
                                            </div>
                                            <p className="text-2xl font-black">{fmtCurrency(monthlyEarnings)}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Monthly Earnings</p>
                                        </div>
                                        <div className="tlb-card p-5">
                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-3">
                                                <Percent size={16} />
                                            </div>
                                            <p className="text-2xl font-black">{occupancyRate}%</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Occupancy Rate</p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ── Universal 6-Month Trend (only if no entity-specific trend block above already drew one) ── */}
                            {trendValues.length > 0 && !hasEvents && !hasVenues && hasClassOrProgram && (
                                <section className="tlb-card p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <h3 className="font-black text-gray-900">{trendLabel}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">6-month overview</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: trendColor }} />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                Enquiries
                                            </span>
                                        </div>
                                    </div>
                                    <TrendAreaChart data={trendValues} labels={trendLabels} color={trendColor} id={trendId} />

                                    <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                                        {[
                                            { label: 'This Month', value: trendValues[trendValues.length - 1] },
                                            { label: 'Prev Month', value: trendValues[trendValues.length - 2] ?? 0 },
                                            {
                                                label: 'Growth',
                                                value: `${trendPct(trendValues) > 0 ? '+' : ''}${trendPct(trendValues)}%`,
                                            },
                                        ].map(item => (
                                            <div key={item.label} className="text-center">
                                                <p className="text-xl font-black text-gray-900">{item.value}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Empty state */}
                            {!hasClassOrProgram && !hasEvents && !hasVenues && (
                                <div className="flex flex-col items-center gap-3 py-16 text-center">
                                    <p className="text-sm font-bold text-gray-400">No analytics data yet.</p>
                                    <p className="text-xs text-gray-300">Create your first listing to start tracking performance.</p>
                                    <button
                                        onClick={() => onNavigate('SERVICE_LISTINGS')}
                                        className="mt-2 text-xs font-black text-tlb-yellow hover:underline"
                                    >
                                        Go to My Listings →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Statistics;
