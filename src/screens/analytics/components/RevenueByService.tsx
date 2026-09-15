import React from 'react';
import { Pill } from '../../../components/portal';
import { formatRupees } from '../../../utils/format';
import { RevenueTypeSlice } from '../types';

interface RevenueByServiceProps {
    slices: RevenueTypeSlice[];
    grossLabel: string;
}

export const RevenueByService: React.FC<RevenueByServiceProps> = ({ slices, grossLabel }) => {
    if (slices.length === 0) {
        return <p className="text-[12.5px] text-tlb-muted">No revenue recorded for this window yet.</p>;
    }
    return (
        <div className="flex flex-col h-full">
            <p className="text-[12.5px] text-tlb-muted mb-4">{grossLabel} gross</p>
            <div className="flex h-3 rounded-full overflow-hidden gap-[2px]">
                {slices.map(s => (
                    <div key={s.type} style={{ flex: Math.max(s.pct, 1), background: s.color }} />
                ))}
            </div>
            <div className="flex flex-col gap-3.5 mt-[18px]">
                {slices.map(s => (
                    <div key={s.type} className="flex items-center gap-2.5">
                        <span className="w-[9px] h-[9px] rounded-[3px] flex-none" style={{ background: s.color }} />
                        <span className="flex-1 text-[13px] text-tlb-ink">{s.label}</span>
                        <span className="pt-num text-[13.5px]">{formatRupees(s.amount)}</span>
                        <span className="text-[12px] text-tlb-muted w-[34px] text-right">{s.pct}%</span>
                    </div>
                ))}
            </div>
            <div className="flex-1 min-h-[14px]" />
            <div className="border-t border-tlb-divider pt-3.5">
                <p className="pt-eyebrow mb-2.5">Fastest growing</p>
                <div className="flex items-center justify-between text-[13px]">
                    <span className="text-tlb-muted">Month-over-month, per service</span>
                    <Pill tone="neutral">Coming soon</Pill>
                </div>
            </div>
        </div>
    );
};
