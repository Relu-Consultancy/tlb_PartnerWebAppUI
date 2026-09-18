import React from 'react';
import { formatRupees } from '../../../utils/format';
import { VerticalAmount } from '../types';

interface RevenueByVerticalProps {
    verticals: VerticalAmount[];
}

export const RevenueByVertical: React.FC<RevenueByVerticalProps> = ({ verticals }) => {
    if (verticals.length === 0) {
        return <p className="text-[12.5px] text-tlb-muted">No revenue recorded for this window yet.</p>;
    }
    return (
        <div className="flex flex-wrap gap-6">
            {verticals.map(v => (
                <div key={v.label} className="flex items-center justify-between gap-2 flex-1 min-w-[140px]">
                    <span className="text-[12.5px] text-tlb-body">{v.label}</span>
                    <span className="pt-num text-tlb-gold">{formatRupees(v.amount)}</span>
                </div>
            ))}
        </div>
    );
};
