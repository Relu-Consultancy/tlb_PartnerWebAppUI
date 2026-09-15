import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { StatsEnquiries, StatsRevenue } from '../../../api/stats';
import { formatCount, formatRupees, toNumber } from '../../../utils/format';

interface MetricsStripProps {
    revenue: StatsRevenue | null;
    enquiries: StatsEnquiries | null;
    retention: { label: string; value: string };
}

const DeltaPill: React.FC<{ pct: number }> = ({ pct }) => {
    if (!pct) return null;
    const up = pct > 0;
    return (
        <span
            className="pt-pill inline-flex items-center gap-1"
            style={up ? { background: 'var(--color-tlb-green-soft)', color: 'var(--color-tlb-green)' } : { background: 'var(--color-tlb-red-soft)', color: 'var(--color-tlb-red-deep)' }}
        >
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {Math.abs(pct).toFixed(0)}%
        </span>
    );
};

const Tile: React.FC<{ label: string; value: string; delta?: number | null; sub: string }> = ({ label, value, delta, sub }) => (
    <div className="pt-card p-[17px_19px] flex flex-col gap-[7px]">
        <span className="pt-eyebrow">{label}</span>
        <div className="flex items-baseline gap-[9px]">
            <span className="pt-num text-[25px]">{value}</span>
            {delta != null && <DeltaPill pct={delta} />}
        </div>
        <div className="text-[12px] text-tlb-muted">{sub}</div>
    </div>
);

export const MetricsStrip: React.FC<MetricsStripProps> = ({ revenue, enquiries, retention }) => {
    const convRate = enquiries?.conversion_funnel?.conversion_rate;
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Tile
                label="Gross revenue"
                value={revenue ? formatRupees(toNumber(revenue.gross_revenue)) : '—'}
                delta={revenue?.revenue_growth_pct ?? null}
                sub={revenue ? `${formatRupees(toNumber(revenue.prev_month))} previous month` : 'no data yet'}
            />
            <Tile
                label="Net payout"
                value={revenue ? formatRupees(toNumber(revenue.net_earnings)) : '—'}
                sub="after platform fee"
            />
            <Tile
                label="Bookings"
                value={revenue ? formatCount(revenue.confirmed_bookings) : '—'}
                sub={revenue ? `${formatRupees(toNumber(revenue.avg_order_value))} average value` : 'no data yet'}
            />
            <Tile
                label="Conversion"
                value={convRate != null ? `${Math.round(convRate)}%` : '—'}
                sub="enquiry → booking"
            />
            <Tile
                label="Retention"
                value={retention.value}
                sub={retention.label}
            />
        </div>
    );
};
