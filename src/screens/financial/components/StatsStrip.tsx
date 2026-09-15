import React from 'react';
import { Pill } from '../../../components/portal';
import { StatsRevenue } from '../../../api/stats';
import { formatRupees, toNumber } from '../../../utils/format';

interface StatsStripProps {
    revenue: StatsRevenue | null;
    periodPhrase: string;
}

export const StatsStrip: React.FC<StatsStripProps> = ({ revenue, periodPhrase }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="pt-card p-[16px_18px]">
            <div className="flex items-center justify-between">
                <span className="pt-eyebrow">Available balance</span>
                <Pill tone="neutral">Coming soon</Pill>
            </div>
            <p className="text-[11.5px] text-tlb-muted mt-2">No live wallet balance is exposed by the API yet.</p>
        </div>
        <div className="pt-card p-[16px_18px]">
            <div className="flex items-center justify-between">
                <span className="pt-eyebrow">In processing</span>
                <Pill tone="neutral">Coming soon</Pill>
            </div>
            <p className="text-[11.5px] text-tlb-muted mt-2">No per-booking settlement pipeline is exposed yet.</p>
        </div>
        <div className="pt-card p-[16px_18px]">
            <div className="pt-eyebrow">Paid out — {periodPhrase}</div>
            <div className="pt-num text-[24px] mt-[5px] text-tlb-gold">{revenue ? formatRupees(toNumber(revenue.net_earnings)) : '—'}</div>
            <div className="text-[11.5px] text-tlb-muted mt-0.5">{revenue ? `${revenue.confirmed_bookings} confirmed bookings` : 'no data yet'}</div>
        </div>
        <div className="pt-card p-[16px_18px] bg-tlb-red-soft" style={{ borderColor: '#F7C9C9' }}>
            <div className="pt-eyebrow text-tlb-red-deep">Refunds — {periodPhrase}</div>
            <div className="pt-num text-[24px] mt-[5px] text-tlb-red-deep">{revenue ? formatRupees(toNumber(revenue.refunds)) : '—'}</div>
            <div className="text-[11.5px] text-tlb-red-deep mt-0.5 opacity-80">Returned to customers this period</div>
        </div>
    </div>
);
