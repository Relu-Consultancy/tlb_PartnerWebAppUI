import React from 'react';
import { TrendPoint } from '../types';

interface RevenueChartProps {
    points: TrendPoint[];
}

const W = 620;
const H = 240;
const PAD_TOP = 16;
const PAD_BOTTOM = 32;

/** Bar (revenue) + line (bookings) combo, scaled to the real data range — no hardcoded mock coordinates. */
export const RevenueChart: React.FC<RevenueChartProps> = ({ points }) => {
    if (points.length === 0) {
        return <div className="h-[240px] flex items-center justify-center text-[12.5px] text-tlb-muted">No revenue history yet for this window.</div>;
    }

    const plotH = H - PAD_TOP - PAD_BOTTOM;
    const maxRevenue = Math.max(...points.map(p => p.revenue), 1);
    const maxBookings = Math.max(...points.map(p => p.bookings), 1);
    const slot = W / points.length;
    const barW = Math.min(34, slot * 0.55);

    const barY = (v: number) => PAD_TOP + plotH * (1 - v / maxRevenue);
    const lineY = (v: number) => PAD_TOP + plotH * (1 - v / maxBookings);
    const cx = (i: number) => slot * i + slot / 2;

    const linePoints = points.map((p, i) => `${cx(i)},${lineY(p.bookings)}`).join(' ');
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => PAD_TOP + plotH * f);

    return (
        <div>
            <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <g stroke="var(--color-tlb-divider)" strokeWidth={1}>
                    {gridLines.map((y, i) => <line key={i} x1={0} y1={y} x2={W} y2={y} />)}
                </g>
                <g fill="var(--color-tlb-amber)">
                    {points.map((p, i) => {
                        const y = barY(p.revenue);
                        return <rect key={i} x={cx(i) - barW / 2} y={y} width={barW} height={PAD_TOP + plotH - y} rx={6} />;
                    })}
                </g>
                <polyline points={linePoints} fill="none" stroke="var(--color-tlb-ink)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <g fill="#fff" stroke="var(--color-tlb-ink)" strokeWidth={2.5}>
                    {points.map((p, i) => <circle key={i} cx={cx(i)} cy={lineY(p.bookings)} r={3.5} />)}
                </g>
            </svg>
            <div className="grid text-[11.5px] text-tlb-muted text-center mt-1.5" style={{ gridTemplateColumns: `repeat(${points.length}, 1fr)` }}>
                {points.map((p, i) => <span key={i}>{p.label}</span>)}
            </div>
        </div>
    );
};
