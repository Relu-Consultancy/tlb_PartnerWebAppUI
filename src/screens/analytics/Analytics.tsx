import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { EntityType, Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { loadPartnerListings, PartnerListing } from '../../api/portalSummary';
import { getDateRangeOption } from '../../constants/dateRange';
import { Pill, SegBar } from '../../components/portal';
import { Skeleton } from '../../components/ui';
import { downloadTextFile } from '../../utils/download';
import { useEnquiriesData } from '../bookings-enquiries/useEnquiriesData';
import { useBookingsData } from '../bookings-enquiries/useBookingsData';
import { useAnalyticsData } from './useAnalyticsData';
import {
    funnelStages, listingPerformance, retentionMetric, revenueTypeSlices, trendPoints, uncontactedLeadValue,
} from './model';
import { buildEarningsStatementCsv } from './csv';
import { AnalyticsTab } from './types';
import { MetricsStrip } from './components/MetricsStrip';
import { RevenueChart } from './components/RevenueChart';
import { RevenueByService } from './components/RevenueByService';
import { DemandFunnel } from './components/DemandFunnel';
import { ListingsPerformanceTable } from './components/ListingsPerformanceTable';
import { CustomersPanel } from './components/CustomersPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { TrafficSourcesCard } from './components/TrafficSourcesCard';
import { formatRupees, toNumber } from '../../utils/format';

interface Props {
    onNavigate: (screen: Screen) => void;
}

const TABS: { key: AnalyticsTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'funnel', label: 'Demand funnel' },
    { key: 'listings', label: 'Listings' },
    { key: 'customers', label: 'Customers' },
    { key: 'reports', label: 'Reports' },
];

const SkeletonBody: React.FC = () => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4" aria-busy="true" aria-label="Loading analytics">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-72 rounded-[14px]" />
    </div>
);

export const Analytics: React.FC<Props> = ({ onNavigate }) => {
    const { allowedEntities, dateRange } = usePartner();
    const [tab, setTab] = useState<AnalyticsTab>('overview');
    const [scope, setScope] = useState<EntityType | 'all'>('all');
    const [listings, setListings] = useState<PartnerListing[]>([]);

    const stats = useAnalyticsData(dateRange);
    const enquiries = useEnquiriesData(allowedEntities);
    const bookings = useBookingsData(allowedEntities);

    useEffect(() => {
        loadPartnerListings(allowedEntities).then(setListings).catch(() => setListings([]));
    }, [allowedEntities.join(',')]);

    if (stats.loading) return <SkeletonBody />;

    if (stats.error) {
        return (
            <div className="px-4 sm:px-[26px] pt-5 pb-9">
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">Could not load analytics data.</div>
            </div>
        );
    }

    const slices = revenueTypeSlices(stats.revenue?.revenue_by_type || []);
    const trend = trendPoints({ revenue_trend: stats.revenue?.revenue_trend || [] });
    const stages = funnelStages(stats.overview, stats.enquiries);
    const { uncontacted, value: uncontactedValue } = uncontactedLeadValue(stats.enquiries, stats.revenue);
    const retention = retentionMetric(allowedEntities, stats.venues, stats.enquiries);

    const scopedListings = scope === 'all' ? listings : listings.filter(l => l.entityType === scope);
    const performanceRows = listingPerformance(scopedListings, bookings.entries, enquiries.entries);

    const scopeOptions = [
        { key: 'all' as const, label: 'All services' },
        ...allowedEntities.map(e => ({ key: e, label: e })),
    ];

    const exportCsv = () => downloadTextFile(`tlb-analytics-${Date.now()}.csv`, buildEarningsStatementCsv(stats.revenue?.revenue_trend || []));

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                        <button type="button" onClick={() => onNavigate('HOME')} className="text-tlb-link hover:text-tlb-gold transition-colors">Dashboard</button>
                        {' · '}Analytics
                    </nav>
                    <h1 className="pt-h1 text-[24px]">Analytics &amp; reports</h1>
                    <p className="text-[13.5px] text-tlb-sub mt-[3px]">
                        {getDateRangeOption(dateRange).phrase.charAt(0).toUpperCase() + getDateRangeOption(dateRange).phrase.slice(1)}
                        {stats.revenue ? ` · ${formatRupees(toNumber(stats.revenue.gross_revenue))} gross` : ''}
                    </p>
                </div>
                <button type="button" onClick={exportCsv} className="pt-btn pt-btn-d flex-none">
                    <Download size={14} strokeWidth={2.75} /> Export CSV
                </button>
            </div>

            <SegBar options={TABS} value={tab} onChange={setTab} />

            {tab === 'overview' && (
                <div className="flex flex-col gap-4">
                    <MetricsStrip revenue={stats.revenue} enquiries={stats.enquiries} retention={retention} />
                    <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-[18px] items-stretch">
                        <div className="pt-card p-5">
                            <div className="flex items-start justify-between mb-1">
                                <div>
                                    <p className="pt-h-sec">Revenue &amp; bookings</p>
                                    <p className="text-[12.5px] text-tlb-muted mt-0.5">Monthly · {getDateRangeOption(dateRange).phrase}</p>
                                </div>
                                <div className="flex gap-3.5 text-[12px] text-tlb-body">
                                    <span className="flex items-center gap-1.5"><span className="w-[9px] h-[9px] rounded-[3px] bg-tlb-amber" />Revenue</span>
                                    <span className="flex items-center gap-1.5"><span className="w-[9px] h-[9px] rounded-[3px] bg-tlb-ink" />Bookings</span>
                                </div>
                            </div>
                            <RevenueChart points={trend} />
                        </div>
                        <div className="pt-card p-5">
                            <p className="pt-h-sec mb-1">Revenue by service</p>
                            <RevenueByService slices={slices} grossLabel={stats.revenue ? formatRupees(toNumber(stats.revenue.gross_revenue)) : '—'} />
                        </div>
                    </div>
                </div>
            )}

            {tab === 'revenue' && (
                <div className="flex flex-col gap-4">
                    <div className="pt-card grid grid-cols-2 sm:grid-cols-4 overflow-hidden">
                        <div className="pt-stat"><p className="pt-eyebrow">Gross revenue</p><p className="pt-stat-n">{stats.revenue ? formatRupees(toNumber(stats.revenue.gross_revenue)) : '—'}</p></div>
                        <div className="pt-stat"><p className="pt-eyebrow">Platform fees</p><p className="pt-stat-n text-tlb-red-deep">{stats.revenue ? formatRupees(toNumber(stats.revenue.platform_fees)) : '—'}</p></div>
                        <div className="pt-stat"><p className="pt-eyebrow">Refunds</p><p className="pt-stat-n text-tlb-red-deep">{stats.revenue ? formatRupees(toNumber(stats.revenue.refunds)) : '—'}</p></div>
                        <div className="pt-stat"><p className="pt-eyebrow">Net earnings</p><p className="pt-stat-n text-tlb-gold">{stats.revenue ? formatRupees(toNumber(stats.revenue.net_earnings)) : '—'}</p></div>
                    </div>
                    <div className="pt-card p-5">
                        <p className="pt-h-sec mb-1">Revenue trend</p>
                        <p className="text-[12.5px] text-tlb-muted mb-2">Monthly · {getDateRangeOption(dateRange).phrase}</p>
                        <RevenueChart points={trend} />
                    </div>
                    <div className="pt-card p-5">
                        <p className="pt-h-sec mb-1">Revenue by service</p>
                        <RevenueByService slices={slices} grossLabel={stats.revenue ? formatRupees(toNumber(stats.revenue.gross_revenue)) : '—'} />
                    </div>
                </div>
            )}

            {tab === 'funnel' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px] items-start">
                    <div className="pt-card p-5">
                        <p className="pt-h-sec">Demand funnel</p>
                        <p className="text-[12.5px] text-tlb-muted mb-5">Where customers drop off · {getDateRangeOption(dateRange).phrase}</p>
                        <DemandFunnel stages={stages} uncontacted={uncontacted} uncontactedValue={uncontactedValue} avgResponseHours={stats.enquiries?.avg_response_hours ?? null} />
                    </div>
                    <TrafficSourcesCard traffic={stats.traffic} onViewDetail={() => onNavigate('TRAFFIC_ANALYTICS')} />
                </div>
            )}

            {tab === 'listings' && (
                <div className="pt-card p-5">
                    <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                        <div>
                            <p className="pt-h-sec">Listing performance</p>
                            <p className="text-[12.5px] text-tlb-muted mt-0.5">{scopedListings.length} listing{scopedListings.length === 1 ? '' : 's'} · sorted by revenue</p>
                        </div>
                        <SegBar options={scopeOptions} value={scope} onChange={setScope} />
                    </div>
                    <ListingsPerformanceTable rows={performanceRows} />
                </div>
            )}

            {tab === 'customers' && (
                <div className="pt-card p-5">
                    <p className="pt-h-sec mb-4">Customers</p>
                    <CustomersPanel allowedEntities={allowedEntities} overview={stats.overview} events={stats.events} venues={stats.venues} enquiries={stats.enquiries} />
                </div>
            )}

            {tab === 'reports' && (
                <div className="pt-card p-5">
                    <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                        <div>
                            <p className="pt-h-sec">Reports</p>
                            <p className="text-[12.5px] text-tlb-muted mt-0.5">Download or schedule · CSV and PDF</p>
                        </div>
                        <button type="button" disabled className="pt-btn pt-btn-o opacity-60 cursor-not-allowed flex items-center gap-1.5">
                            Schedule a report <Pill tone="neutral">Coming soon</Pill>
                        </button>
                    </div>
                    <ReportsPanel revenue={stats.revenue} />
                </div>
            )}
        </div>
    );
};

export default Analytics;
