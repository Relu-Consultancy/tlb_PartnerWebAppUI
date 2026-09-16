import React from 'react';
import { TrafficDetailByDayRow, TrafficDetailByListingRow, TrafficGroupBy } from '../../../api/stats';
import { LoadMoreRow, SegBar } from '../../../components/portal';
import { formatCount } from '../../../utils/format';

interface Props {
    groupBy: TrafficGroupBy;
    onGroupByChange: (g: TrafficGroupBy) => void;
    rows: (TrafficDetailByDayRow | TrafficDetailByListingRow)[];
    total: number;
    loading: boolean;
    error: string | null;
    onLoadMore: () => void;
}

const fmtDate = (iso: string): string => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isListingRow = (row: TrafficDetailByDayRow | TrafficDetailByListingRow): row is TrafficDetailByListingRow =>
    'listing_id' in row;

export const TrafficDetailTable: React.FC<Props> = ({ groupBy, onGroupByChange, rows, total, loading, error, onLoadMore }) => (
    <div className="pt-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap px-[18px] pt-[15px]">
            <p className="pt-h-sec">Detailed metrics</p>
            <SegBar
                options={[{ key: 'day' as const, label: 'By day' }, { key: 'listing' as const, label: 'By listing' }]}
                value={groupBy}
                onChange={onGroupByChange}
            />
        </div>

        {error ? (
            <div className="pt-note m-[18px] bg-tlb-red-soft text-tlb-red-deep">{error}</div>
        ) : (
            <div className="overflow-x-auto mt-3">
                {groupBy === 'day' ? (
                    <div className="min-w-[560px]">
                        <div className="grid grid-cols-4 gap-3 px-[18px] py-[11px] bg-tlb-chrome border-y border-tlb-line">
                            {['Date', 'Views', 'Unique viewers', 'Enquiries'].map(h => <span key={h} className="pt-eyebrow">{h}</span>)}
                        </div>
                        {rows.filter((row): row is TrafficDetailByDayRow => !isListingRow(row)).map((row, i) => (
                            <div key={i} className="grid grid-cols-4 gap-3 items-center px-[18px] py-[11px] border-b border-tlb-divider last:border-b-0 text-[12.5px]">
                                <span className="font-medium text-tlb-ink">{fmtDate(row.date)}</span>
                                <span className="font-bold text-tlb-ink">{formatCount(row.views)}</span>
                                <span className="text-tlb-sub">{formatCount(row.unique_viewers)}</span>
                                <span className="text-tlb-sub">{formatCount(row.enquiries)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="min-w-[640px]">
                        <div className="grid grid-cols-[minmax(0,1.6fr)_92px_112px_92px_112px] gap-3 px-[18px] py-[11px] bg-tlb-chrome border-y border-tlb-line">
                            {['Listing', 'Views', 'Unique viewers', 'Enquiries', 'Conversion'].map(h => <span key={h} className="pt-eyebrow">{h}</span>)}
                        </div>
                        {rows.filter(isListingRow).map((row, i) => (
                            <div key={row.listing_id ?? i} className="grid grid-cols-[minmax(0,1.6fr)_92px_112px_92px_112px] gap-3 items-center px-[18px] py-[11px] border-b border-tlb-divider last:border-b-0 text-[12.5px]">
                                <span className="font-medium text-tlb-ink truncate">{row.listing_name}</span>
                                <span className="font-bold text-tlb-ink">{formatCount(row.views)}</span>
                                <span className="text-tlb-sub">{formatCount(row.unique_viewers)}</span>
                                <span className="text-tlb-sub">{formatCount(row.enquiries)}</span>
                                <span className="text-tlb-sub">{row.conversion_rate.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                )}
                {rows.length === 0 && !loading && (
                    <div className="px-[18px] py-8 text-center text-[12.5px] text-tlb-muted">No data for this window.</div>
                )}
            </div>
        )}

        <LoadMoreRow shown={rows.length} total={total} noun={groupBy === 'day' ? 'days' : 'listings'} onLoadMore={onLoadMore} />
    </div>
);
