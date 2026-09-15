import React from 'react';
import { Pill } from '../../../components/portal';
import { formatCount, formatRupees } from '../../../utils/format';
import { ListingPerformanceRow } from '../types';
import { SERVICE_LABEL, SERVICE_TONE } from '../../services/presentation';

const GRID_COLS = 'grid-cols-[minmax(0,1.6fr)_90px_90px_90px_90px_120px_110px]';

interface ListingsPerformanceTableProps {
    rows: ListingPerformanceRow[];
}

export const ListingsPerformanceTable: React.FC<ListingsPerformanceTableProps> = ({ rows }) => {
    if (rows.length === 0) {
        return <p className="text-[12.5px] text-tlb-muted py-6 text-center">No listings to compare yet.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <div className={`min-w-[820px] grid ${GRID_COLS} gap-3.5 pb-2 border-b border-tlb-divider`}>
                <span className="pt-eyebrow">Listing</span>
                <span className="pt-eyebrow text-right">Views</span>
                <span className="pt-eyebrow text-right">Enquiries</span>
                <span className="pt-eyebrow text-right">Booked</span>
                <span className="pt-eyebrow text-right">Conv.</span>
                <span className="pt-eyebrow text-right">Revenue</span>
                <span className="pt-eyebrow">Service</span>
            </div>
            {rows.map(row => (
                <div key={row.id} className={`min-w-[820px] grid ${GRID_COLS} gap-3.5 items-center py-2.5 border-b border-tlb-divider last:border-b-0 text-[13px]`}>
                    <span className="font-bold text-tlb-ink truncate">{row.title}</span>
                    <span className="text-right text-[11.5px] text-tlb-muted" title="Per-listing view tracking isn't available from the API yet">Coming soon</span>
                    <span className="pt-num text-right">{formatCount(row.enquiries)}</span>
                    <span className="pt-num text-right">{formatCount(row.bookings)}</span>
                    <span className="text-right text-[11.5px] text-tlb-muted" title="Needs per-listing view tracking, which isn't available yet">—</span>
                    <span className="pt-num text-right">{formatRupees(row.revenue)}</span>
                    <span><Pill tone={SERVICE_TONE[row.entityType]}>{SERVICE_LABEL[row.entityType]}</Pill></span>
                </div>
            ))}
        </div>
    );
};
