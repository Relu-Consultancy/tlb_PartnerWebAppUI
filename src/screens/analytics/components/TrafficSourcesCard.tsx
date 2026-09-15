import React from 'react';
import { Pill } from '../../../components/portal';

// ---------------------------------------------------------------------------
// The mock's "Where customers come from" card — no referrer/session tracking
// exists anywhere in this app, so every figure here is a placeholder. The
// layout matches the mock; only the numbers are replaced with "Coming soon".
// ---------------------------------------------------------------------------

const CHANNELS = ['TLB search & browse', 'TLB category pages', 'Your shared links', 'TLB campaigns', 'Direct / other'];
const HIGHLIGHTS = [
    { label: 'Top city', eyebrow: 'Top city' },
    { label: 'Peak day', eyebrow: 'Peak day' },
    { label: 'Peak hour', eyebrow: 'Peak hour' },
];

export const TrafficSourcesCard: React.FC = () => (
    <div className="pt-card p-5">
        <div className="flex items-center justify-between gap-3 mb-1">
            <p className="pt-h-sec">Where customers come from</p>
            <Pill tone="neutral">Coming soon</Pill>
        </div>
        <p className="text-[12.5px] text-tlb-muted mb-5">Traffic source tracking isn't available from the API yet.</p>
        <div className="flex flex-col gap-4 opacity-50">
            {CHANNELS.map(label => (
                <div key={label}>
                    <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-[13px] font-semibold text-tlb-ink">{label}</span>
                        <span className="pt-num text-[13px] text-tlb-muted">—</span>
                    </div>
                    <div className="h-2 rounded-full bg-tlb-hover overflow-hidden">
                        <div className="h-full w-0 rounded-full bg-tlb-edge" />
                    </div>
                </div>
            ))}
        </div>
        <div className="border-t border-tlb-divider mt-5 pt-4 grid grid-cols-3 gap-4">
            {HIGHLIGHTS.map(h => (
                <div key={h.label}>
                    <p className="pt-eyebrow">{h.eyebrow}</p>
                    <p className="pt-num text-[15px] mt-1 text-tlb-muted">—</p>
                    <p className="text-[11.5px] text-tlb-muted">Coming soon</p>
                </div>
            ))}
        </div>
    </div>
);
