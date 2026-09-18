import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { StatsOverviewAll } from '../../../api/stats';
import { formatCount, formatRupees, toNumber } from '../../../utils/format';

interface OverviewAllMetricsProps {
    overview: StatsOverviewAll | null;
    /** Events has no enquiry flow — conversion_rate is always 0, which would read as a false "0% converted" if shown literally. */
    isEventsScope: boolean;
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

/** KPI strip for the Overview tab's All services/Events/Classes/Venues scope — driven entirely by stats/overview-all/.
 * Deliberately has no "Net payout" tile: the design mock's "after 15% platform fee" framing doesn't match how
 * settlement actually works (platform fee is charged to the customer, partner commission is 0% in Phase 1) — that
 * needs its own product resolution before a tile gets built against it. */
export const OverviewAllMetrics: React.FC<OverviewAllMetricsProps> = ({ overview, isEventsScope }) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Tile
            label="Gross revenue"
            value={overview ? formatRupees(toNumber(overview.gross_revenue)) : '—'}
            delta={overview?.revenue_growth_pct ?? null}
            sub={overview ? `${formatCount(overview.confirmed_bookings)} bookings this period` : 'no data yet'}
        />
        <Tile
            label="Bookings"
            value={overview ? formatCount(overview.confirmed_bookings) : '—'}
            delta={overview?.bookings_growth_pct ?? null}
            sub={overview ? `${formatRupees(toNumber(overview.avg_order_value))} average order value` : 'no data yet'}
        />
        {isEventsScope ? (
            <Tile label="Conversion" value="—" sub="No enquiry data for Events" />
        ) : (
            <Tile
                label="Conversion"
                value={overview ? `${Math.round(overview.conversion_rate)}%` : '—'}
                sub="Enquiry-to-booking activity"
            />
        )}
        <Tile
            label="Repeat customers"
            value={overview ? `${Math.round(overview.repeat_customers_pct)}%` : '—'}
            sub="made 2+ bookings this period"
        />
    </div>
);
