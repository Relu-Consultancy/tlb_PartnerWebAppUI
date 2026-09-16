import React from 'react';
import { TrendBar } from '../types';

const W = 620;
const H = 200;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

/** Views-per-day bar chart, scaled to the real data range — no charting library, matches RevenueChart's hand-rolled SVG idiom. */
export const TrafficTrendChart: React.FC<{ bars: TrendBar[] }> = ({ bars }) => {
    if (bars.length === 0) {
        return <div className="h-[200px] flex items-center justify-center text-[12.5px] text-tlb-muted">No traffic recorded for this window.</div>;
    }

    const plotH = H - PAD_TOP - PAD_BOTTOM;
    const maxViews = Math.max(...bars.map(b => b.views), 1);
    const slot = W / bars.length;
    const barW = Math.min(34, slot * 0.55);
    const barY = (v: number) => PAD_TOP + plotH * (1 - v / maxViews);
    const cx = (i: number) => slot * i + slot / 2;
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => PAD_TOP + plotH * f);

    // Thin out labels so they don't overlap on wide windows (e.g. "this_month").
    const labelEvery = Math.max(1, Math.ceil(bars.length / 12));

    return (
        <div>
            <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <g stroke="var(--color-tlb-divider)" strokeWidth={1}>
                    {gridLines.map((y, i) => <line key={i} x1={0} y1={y} x2={W} y2={y} />)}
                </g>
                <g fill="var(--color-tlb-link)">
                    {bars.map((b, i) => {
                        const y = barY(b.views);
                        return <rect key={i} x={cx(i) - barW / 2} y={y} width={barW} height={PAD_TOP + plotH - y} rx={5} />;
                    })}
                </g>
            </svg>
            <div className="grid text-[11px] text-tlb-muted text-center mt-1.5" style={{ gridTemplateColumns: `repeat(${bars.length}, 1fr)` }}>
                {bars.map((b, i) => <span key={i}>{i % labelEvery === 0 ? b.label : ''}</span>)}
            </div>
        </div>
    );
};
