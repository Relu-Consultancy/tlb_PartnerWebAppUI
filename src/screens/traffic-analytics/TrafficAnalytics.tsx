import React, { useState } from 'react';
import { Screen } from '../../types';
import { TrafficGroupBy } from '../../api/stats';
import { Skeleton } from '../../components/ui';
import { formatCount } from '../../utils/format';
import { sourceSlices, trendBars } from './model';
import { DEFAULT_TRAFFIC_PERIOD } from './presentation';
import { TrafficPeriodState } from './types';
import { useTrafficData } from './useTrafficData';
import { useTrafficDetail } from './useTrafficDetail';
import { TrafficPeriodPicker } from './components/TrafficPeriodPicker';
import { TrafficTrendChart } from './components/TrafficTrendChart';
import { SourceBreakdown } from './components/SourceBreakdown';
import { TrafficDetailTable } from './components/TrafficDetailTable';

interface Props {
    onNavigate: (screen: Screen) => void;
}

const SkeletonBody: React.FC = () => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4" aria-busy="true" aria-label="Loading traffic analytics">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-72 rounded-[14px]" />
    </div>
);

export const TrafficAnalytics: React.FC<Props> = ({ onNavigate }) => {
    const [period, setPeriod] = useState<TrafficPeriodState>({ key: DEFAULT_TRAFFIC_PERIOD, dateFrom: '', dateTo: '' });
    const [groupBy, setGroupBy] = useState<TrafficGroupBy>('day');

    const { loading, traffic, error, ready } = useTrafficData(period);
    const detail = useTrafficDetail(period, groupBy);

    const bars = trendBars(traffic?.daily_trend || []);
    const slices = sourceSlices(traffic?.by_source || []);

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                        <button type="button" onClick={() => onNavigate('HOME')} className="text-tlb-link hover:text-tlb-gold transition-colors">Dashboard</button>
                        {' · '}
                        <button type="button" onClick={() => onNavigate('ANALYTICS')} className="text-tlb-link hover:text-tlb-gold transition-colors">Analytics</button>
                        {' · '}Traffic
                    </nav>
                    <h1 className="pt-h1 text-[24px]">Traffic analytics</h1>
                    <p className="text-[13.5px] text-tlb-sub mt-[3px]">
                        {traffic ? traffic.period.label : 'Where your views come from, day by day'}
                    </p>
                </div>
                <TrafficPeriodPicker value={period} onChange={setPeriod} />
            </div>

            {!ready ? (
                <div className="pt-note">Pick both a start and end date to load a custom range.</div>
            ) : loading ? (
                <SkeletonBody />
            ) : error ? (
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{error}</div>
            ) : (
                <>
                    <div className="pt-card grid grid-cols-1 sm:grid-cols-3 overflow-hidden">
                        <div className="pt-stat"><p className="pt-eyebrow">Views</p><p className="pt-stat-n">{formatCount(traffic?.totals.views ?? 0)}</p></div>
                        <div className="pt-stat"><p className="pt-eyebrow">Unique viewers</p><p className="pt-stat-n">{formatCount(traffic?.totals.unique_viewers ?? 0)}</p></div>
                        <div className="pt-stat"><p className="pt-eyebrow">Enquiries</p><p className="pt-stat-n">{formatCount(traffic?.totals.enquiries ?? 0)}</p></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-[18px] items-stretch">
                        <div className="pt-card p-5">
                            <p className="pt-h-sec mb-1">Daily views</p>
                            <p className="text-[12.5px] text-tlb-muted mb-2">{traffic?.period.label}</p>
                            <TrafficTrendChart bars={bars} />
                        </div>
                        <div className="pt-card p-5">
                            <p className="pt-h-sec mb-1">Where views come from</p>
                            <p className="text-[12.5px] text-tlb-muted mb-4">Source data only exists from when this shipped — older days show as organic/direct.</p>
                            <SourceBreakdown slices={slices} />
                        </div>
                    </div>

                    <TrafficDetailTable
                        groupBy={groupBy}
                        onGroupByChange={setGroupBy}
                        rows={detail.rows}
                        total={detail.total}
                        loading={detail.loading}
                        error={detail.error}
                        onLoadMore={detail.loadMore}
                    />
                </>
            )}
        </div>
    );
};

export default TrafficAnalytics;
