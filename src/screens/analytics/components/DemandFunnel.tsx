import React from 'react';
import { CircleAlert } from 'lucide-react';
import { Pill } from '../../../components/portal';
import { formatCount, formatRupees } from '../../../utils/format';
import { FunnelStage } from '../types';

interface DemandFunnelProps {
    stages: FunnelStage[];
    uncontacted: number;
    uncontactedValue: number;
    avgResponseHours: number | null;
}

export const DemandFunnel: React.FC<DemandFunnelProps> = ({ stages, uncontacted, uncontactedValue, avgResponseHours }) => (
    <div className="flex flex-col gap-3.5">
        {stages.map(s => (
            <div key={s.key}>
                <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[13px] font-semibold text-tlb-ink">{s.label}</span>
                    {s.available ? (
                        <span className="pt-num text-[13.5px]">
                            {formatCount(s.count)}
                            {s.key !== 'views' && <span className="font-medium text-tlb-muted text-[12px] ml-1.5">{s.pctOfFirst}%</span>}
                        </span>
                    ) : (
                        <Pill tone="neutral">Coming soon</Pill>
                    )}
                </div>
                <div className="h-[26px] rounded-lg bg-tlb-hover overflow-hidden">
                    {s.available ? (
                        <div className="h-full rounded-lg transition-all" style={{ width: `${Math.max(s.pctOfFirst, 2)}%`, background: s.color }} />
                    ) : (
                        <div className="h-full w-full rounded-lg" style={{ background: 'repeating-linear-gradient(135deg, var(--color-tlb-hover), var(--color-tlb-hover) 8px, var(--color-tlb-divider) 8px, var(--color-tlb-divider) 16px)' }} />
                    )}
                </div>
            </div>
        ))}

        {uncontacted > 0 && (
            <div className="pt-note bg-tlb-cream text-tlb-body mt-1">
                <CircleAlert size={14} strokeWidth={2.75} className="flex-none text-tlb-gold" />
                <span>
                    <strong className="font-bold">{formatCount(uncontacted)} enquir{uncontacted === 1 ? 'y has' : 'ies have'} not been contacted yet.</strong>{' '}
                    {uncontactedValue > 0 && <>At your average order value, that's roughly <strong className="font-bold">{formatRupees(uncontactedValue)}</strong> still on the table. </>}
                    {avgResponseHours != null && <>Average reply time is currently {avgResponseHours.toFixed(1)}h.</>}
                </span>
            </div>
        )}
    </div>
);
