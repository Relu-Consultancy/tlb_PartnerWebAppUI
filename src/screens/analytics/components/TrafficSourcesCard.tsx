import React from 'react';
import { Pill } from '../../../components/portal';
import { StatsTraffic } from '../../../api/stats';
import { sourceSlices } from '../../traffic-analytics/model';

// ---------------------------------------------------------------------------
// The mock's "Where customers come from" card, now backed by the real
// GET /stats/traffic/ endpoint. by_source only reflects views (enquiries
// aren't source-attributed yet), so the per-city/day/hour highlights stay
// "Coming soon" — that breakdown isn't in the traffic API's response at all.
// ---------------------------------------------------------------------------

const HIGHLIGHTS = ['Top city', 'Peak day', 'Peak hour'];

interface Props {
    traffic: StatsTraffic | null;
    onViewDetail: () => void;
}

export const TrafficSourcesCard: React.FC<Props> = ({ traffic, onViewDetail }) => {
    const slices = sourceSlices(traffic?.by_source || []).slice(0, 5);

    return (
        <div className="pt-card p-5">
            <div className="flex items-center justify-between gap-3 mb-1">
                <p className="pt-h-sec">Where customers come from</p>
                <button type="button" onClick={onViewDetail} className="pt-link text-[12.5px]">Full report →</button>
            </div>
            <p className="text-[12.5px] text-tlb-muted mb-5">
                {traffic ? `Views by source · ${traffic.period.label}` : 'Views by source'}
            </p>
            {slices.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {slices.map(s => (
                        <div key={s.source}>
                            <div className="flex items-baseline justify-between mb-1.5">
                                <span className="text-[13px] font-semibold text-tlb-ink">{s.label}</span>
                                <span className="pt-num text-[13px] text-tlb-sub">{s.pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-tlb-hover overflow-hidden">
                                <div className="h-full rounded-full bg-tlb-amber" style={{ width: `${s.pct}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[12.5px] text-tlb-muted">No views recorded for this window yet.</p>
            )}
            <div className="border-t border-tlb-divider mt-5 pt-4 grid grid-cols-3 gap-4">
                {HIGHLIGHTS.map(label => (
                    <div key={label}>
                        <p className="pt-eyebrow">{label}</p>
                        <p className="pt-num text-[15px] mt-1 text-tlb-muted">—</p>
                        <Pill tone="neutral">Coming soon</Pill>
                    </div>
                ))}
            </div>
        </div>
    );
};
