import React from 'react';
import { formatCount } from '../../../utils/format';
import { SourceSlice } from '../types';

export const SourceBreakdown: React.FC<{ slices: SourceSlice[] }> = ({ slices }) => {
    if (slices.length === 0) {
        return <p className="text-[12.5px] text-tlb-muted">No source data for this window yet.</p>;
    }
    return (
        <div className="flex flex-col gap-4">
            {slices.map(s => (
                <div key={s.source}>
                    <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-[13px] font-semibold text-tlb-ink">{s.label}</span>
                        <span className="pt-num text-[13px] text-tlb-sub">{formatCount(s.views)} · {s.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-tlb-hover overflow-hidden">
                        <div className="h-full rounded-full bg-tlb-amber" style={{ width: `${s.pct}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
};
