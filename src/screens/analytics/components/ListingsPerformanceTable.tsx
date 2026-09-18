import React from 'react';
import { Star } from 'lucide-react';
import { LoadMoreRow, Pill } from '../../../components/portal';
import { formatCount, formatRupees, toNumber } from '../../../utils/format';
import { EntityType } from '../../../types';
import { ListingPerformanceRow, OverviewAllListingType } from '../../../api/stats';
import { SERVICE_LABEL, SERVICE_TONE } from '../../../constants/entityMeta';

const GRID_COLS = 'grid-cols-[minmax(0,1.7fr)_92px_84px_84px_84px_100px_112px]';

const API_TO_ENTITY: Record<OverviewAllListingType, EntityType> = {
    event: 'Events', venue: 'Venues', class: 'Classes', program: 'Programs',
};

// The API sends a raw price with no unit — these are generic, honest suffixes (not a specific
// listing's actual duration, which this endpoint doesn't send) rather than a fabricated "8 weeks".
const UNIT_SUFFIX: Record<OverviewAllListingType, string> = {
    event: '/ ticket', class: '/ course', program: '/ program', venue: '/ day',
};

const formatPrice = (price: string | null, type: OverviewAllListingType): string => {
    if (price == null) return '—';
    const n = toNumber(price);
    if (n === 0) return 'Free';
    return `${formatRupees(n)} ${UNIT_SUFFIX[type]}`;
};

interface ListingsPerformanceTableProps {
    rows: ListingPerformanceRow[];
    total: number;
    loading: boolean;
    error: string | null;
    onLoadMore: () => void;
}

export const ListingsPerformanceTable: React.FC<ListingsPerformanceTableProps> = ({ rows, total, loading, error, onLoadMore }) => {
    if (error) {
        return <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{error}</div>;
    }
    if (rows.length === 0 && !loading) {
        return <p className="text-[12.5px] text-tlb-muted py-6 text-center">No listings to compare yet.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <div className={`min-w-[900px] grid ${GRID_COLS} gap-3.5 pb-2 border-b border-tlb-divider`}>
                <span className="pt-eyebrow">Listing</span>
                <span className="pt-eyebrow text-right">Views</span>
                <span className="pt-eyebrow text-right">Enquiries</span>
                <span className="pt-eyebrow text-right">Booked</span>
                <span className="pt-eyebrow text-right" title="Enquiries ÷ views — not a booked-vs-views conversion rate">Enquiry rate</span>
                <span className="pt-eyebrow text-right">Revenue</span>
                <span className="pt-eyebrow">Service</span>
            </div>
            {rows.map(row => (
                <div key={row.listing_id} className={`min-w-[900px] grid ${GRID_COLS} gap-3.5 items-center py-2.5 border-b border-tlb-divider last:border-b-0 text-[13px]`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-[10px] bg-tlb-hover border border-tlb-line flex-none overflow-hidden">
                            {row.thumbnail_url && <img src={row.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-tlb-ink truncate">{row.listing_title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11.5px] text-tlb-muted">{formatPrice(row.price, row.listing_type)}</span>
                                {row.average_rating != null ? (
                                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-tlb-amber">
                                        <Star size={10} fill="currentColor" strokeWidth={0} /> {toNumber(row.average_rating).toFixed(1)}
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-tlb-faint">No reviews yet</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <span className="pt-num text-right">{formatCount(row.views)}</span>
                    <span className="pt-num text-right">{formatCount(row.enquiries)}</span>
                    <span className="pt-num text-right">{formatCount(row.booked)}</span>
                    <span className="pt-num text-right">{row.conversion_rate.toFixed(1)}%</span>
                    <span className="pt-num text-right">{formatRupees(toNumber(row.revenue))}</span>
                    <span><Pill tone={SERVICE_TONE[API_TO_ENTITY[row.listing_type]]}>{SERVICE_LABEL[API_TO_ENTITY[row.listing_type]]}</Pill></span>
                </div>
            ))}
            <LoadMoreRow shown={rows.length} total={total} noun="listings" onLoadMore={onLoadMore} />
        </div>
    );
};
