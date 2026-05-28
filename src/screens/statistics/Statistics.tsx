import React, { useState, useEffect } from 'react';
import {
    Menu, ArrowRight, Activity, Users, Target, Star,
    Clock, BookOpen, CalendarDays, Ticket, Zap,
    DollarSign, MapPin, Percent, RefreshCw,
} from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { getPartnerDashboard } from '../../api/onboarding';
import {
    WeeklyBarChart, TrendAreaChart, DonutChart,
    fmtCurrency, trendPct,
    MONTH_LABELS_6, WEEK_LABELS,
} from '../../components/ui/DashboardCharts';

interface Props {
    onNavigate: (screen: Screen) => void;
    onOpenSidebar: () => void;
}

export const Statistics: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const { allowedEntities } = usePartner();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        getPartnerDashboard()
            .then(res => setDashboardData(res?.data || res))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const hasClassOrProgram = allowedEntities.includes('Classes') || allowedEntities.includes('Programs');
    const hasEvents = allowedEntities.includes('Events');
    const hasVenues = allowedEntities.includes('Venues');

    const d = dashboardData || {};

    const weeklyActivity: number[] = d.weekly_activity || [0, 0, 0, 0, 0, 0, 0];
    const monthlyEnquiries: number[] = d.monthly_enquiries || [0, 0, 0, 0, 0, 0];
    const monthlyRevenue: number[] = d.monthly_revenue || [0, 0, 0, 0, 0, 0];
    const monthlyTickets: number[] = d.monthly_tickets || [0, 0, 0, 0, 0, 0];

    const funnelNew = d.funnel_new ?? d.new_enquiries ?? 0;
    const funnelContacted = d.funnel_contacted ?? 0;
    const funnelConverted = d.funnel_converted ?? 0;
    const convRate = funnelNew > 0 ? Math.round((funnelConverted / funnelNew) * 100) : 0;

    const ticketsSold = d.tickets_sold ?? 0;
    const totalRegistrations = d.total_registrations ?? 0;
    const upcomingEvents = d.upcoming_events ?? 0;
    const eventReach = d.event_reach ?? 0;

    const venueBookings = d.venue_bookings ?? 0;
    const occupancyRate = d.occupancy_rate ?? 0;
    const upcomingReservations = d.upcoming_reservations ?? 0;
    const monthlyEarnings = d.monthly_earnings ?? 0;

    const topListings: any[] = d.top_listings || [];
    const recentActivity: any[] = d.recent_activity || [];

    const weeklyLabel = hasEvents ? 'Weekly Ticket Sales' :
        hasVenues ? 'Weekly Bookings' : 'Weekly Enquiries';

    const trendLabel = hasEvents ? 'Ticket Sales Trend' :
        hasVenues ? 'Booking Revenue Trend' : 'Enquiry & Enrolment Trend';

    const trendData = hasEvents ? monthlyTickets :
        hasVenues ? monthlyRevenue : monthlyEnquiries;

    const trendColor = hasEvents ? '#8B5CF6' : hasVenues ? '#F59E0B' : '#3B82F6';
    const trendId = hasEvents ? 'st-evtkt' : hasVenues ? 'st-vnrev' : 'st-clsenq';

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

                    {loading && !dashboardData ? (
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
                            {/* ── Weekly Activity ── */}
                            <section className="tlb-card p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="font-black text-gray-900">{weeklyLabel}</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                                        <Activity size={13} className="text-gray-400" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            Total: {weeklyActivity.reduce((a, b) => a + b, 0)}
                                        </span>
                                    </div>
                                </div>
                                <WeeklyBarChart
                                    data={weeklyActivity}
                                    labels={WEEK_LABELS}
                                    color={hasEvents ? '#8B5CF6' : hasVenues ? '#F59E0B' : '#3B82F6'}
                                />
                            </section>

                            {/* ── Classes / Programs: Enquiry Insights ── */}
                            {hasClassOrProgram && (
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
                                            {funnelNew === 0 && (
                                                <p className="text-center text-[10px] font-bold text-gray-300 mt-3 uppercase tracking-widest">No enquiries yet</p>
                                            )}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: 'Trial Requests', value: d.trial_requests ?? 0, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
                                                { label: 'Avg. Response', value: d.avg_response_time ? `${d.avg_response_time}h` : '—', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
                                                { label: 'Student Retention', value: d.retention_rate ? `${d.retention_rate}%` : '—', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                                { label: 'Monthly Enrolments', value: d.monthly_enrolments?.toString() ?? '0', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                                    <div className="tlb-card p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="font-black text-gray-900">Monthly Trend</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Enquiries over last 6 months</p>
                                            </div>
                                            <span className="text-lg font-black text-blue-500">
                                                {monthlyEnquiries[monthlyEnquiries.length - 1]}
                                            </span>
                                        </div>
                                        <TrendAreaChart data={monthlyEnquiries} labels={MONTH_LABELS_6} color="#3B82F6" id="st-moenq" />
                                    </div>
                                </section>
                            )}

                            {/* ── Events Analytics ── */}
                            {hasEvents && (
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
                                            { label: 'Registrations', value: totalRegistrations, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
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

                                    <div className="tlb-card p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="font-black text-gray-900">Ticket Sales Trend</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Monthly over last 6 months</p>
                                            </div>
                                            <span className="text-lg font-black text-purple-500">
                                                {monthlyTickets[monthlyTickets.length - 1]}
                                            </span>
                                        </div>
                                        <TrendAreaChart data={monthlyTickets} labels={MONTH_LABELS_6} color="#8B5CF6" id="st-evtkt" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="tlb-card p-5">
                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-3">
                                                <Activity size={16} />
                                            </div>
                                            <p className="text-2xl font-black">{d.engagement_rate ? `${d.engagement_rate}%` : '—'}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Engagement Rate</p>
                                        </div>
                                        <div className="tlb-card p-5">
                                            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-3">
                                                <Target size={16} />
                                            </div>
                                            <p className="text-2xl font-black">{d.booking_conversion ? `${d.booking_conversion}%` : '—'}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Booking Conv. Rate</p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ── Venue Analytics ── */}
                            {hasVenues && (
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
                                                            { value: 100 - occupancyRate, color: '#F3F4F6', label: 'Available' },
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
                                                { label: 'Avg. Duration', value: d.avg_booking_hours ? `${d.avg_booking_hours}h` : '—', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
                                                { label: 'Repeat Clients', value: d.repeat_clients ?? '—', icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50' },
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

                                    <div className="tlb-card p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="font-black text-gray-900">Revenue Trend</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Monthly earnings over last 6 months</p>
                                            </div>
                                            <span className="text-lg font-black text-amber-500">
                                                {fmtCurrency(monthlyRevenue[monthlyRevenue.length - 1])}
                                            </span>
                                        </div>
                                        <TrendAreaChart data={monthlyRevenue} labels={MONTH_LABELS_6} color="#F59E0B" id="st-vnrev" />
                                    </div>
                                </section>
                            )}

                            {/* ── Venue / Events extra stats ── */}
                            {hasVenues && (
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
                            )}

                            {/* ── Universal 6-Month Trend ── */}
                            <section className="tlb-card p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="font-black text-gray-900">{trendLabel}</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">6-month overview</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: trendColor }} />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            {hasEvents ? 'Tickets' : hasVenues ? 'Revenue' : 'Enquiries'}
                                        </span>
                                    </div>
                                </div>
                                <TrendAreaChart data={trendData} labels={MONTH_LABELS_6} color={trendColor} id={trendId} />

                                {hasClassOrProgram && (
                                    <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                                        {[
                                            { label: 'This Month', value: monthlyEnquiries[monthlyEnquiries.length - 1] },
                                            { label: 'Prev Month', value: monthlyEnquiries[monthlyEnquiries.length - 2] },
                                            { label: 'Growth', value: `${trendPct(monthlyEnquiries) > 0 ? '+' : ''}${trendPct(monthlyEnquiries)}%` },
                                        ].map(item => (
                                            <div key={item.label} className="text-center">
                                                <p className="text-xl font-black text-gray-900">{item.value}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* ── Top Performing Listings ── */}
                            {topListings.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-black text-gray-900">Top Performing Listings</h3>
                                        <button onClick={() => onNavigate('SERVICE_LISTINGS')} className="text-xs font-bold text-tlb-yellow flex items-center gap-1 hover:underline">
                                            All Listings <ArrowRight size={12} />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {topListings.slice(0, 5).map((listing: any, i: number) => (
                                            <div key={listing.id || i} className="tlb-card p-4 flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                                                    i === 0 ? 'bg-tlb-yellow text-tlb-dark' :
                                                    i === 1 ? 'bg-gray-200 text-gray-600' :
                                                    'bg-orange-100 text-orange-600'
                                                }`}>
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{listing.title || 'Untitled'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{listing.listing_type || ''}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-black text-gray-900">{listing.views ?? 0}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">views</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* ── Recent Activity ── */}
                            {recentActivity.length > 0 && (
                                <section>
                                    <h3 className="font-black text-gray-900 mb-4">Recent Activity</h3>
                                    <div className="tlb-card overflow-hidden">
                                        {recentActivity.slice(0, 8).map((item: any, i: number) => (
                                            <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                <div className="w-8 h-8 bg-tlb-yellow/10 text-tlb-yellow rounded-xl flex items-center justify-center shrink-0">
                                                    <Activity size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900">{item.title || item.text}</p>
                                                    {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold shrink-0 mt-0.5">{item.time || item.created_at || ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Empty state when there's no analytics data at all */}
                            {!hasClassOrProgram && !hasEvents && !hasVenues &&
                                topListings.length === 0 && recentActivity.length === 0 && (
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
                                )
                            }
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Statistics;
