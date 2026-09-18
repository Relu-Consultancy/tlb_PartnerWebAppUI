import React from 'react';
import { Pill } from '../../../components/portal';

/** No payout-transaction history endpoint exists yet — keeps the mock's table shape with a Coming soon body. */
export const PayoutHistoryPanel: React.FC = () => (
    <div className="pt-card p-[16px_20px]">
        <p className="pt-h-sec mb-2.5">Payout history</p>
        <div className="grid grid-cols-4 gap-2.5 pb-2 border-b border-tlb-divider">
            {['Date', 'Bank', 'Amount', 'Status'].map(h => <span key={h} className="pt-eyebrow">{h}</span>)}
        </div>
        <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
            <Pill tone="neutral">Coming soon</Pill>
            <p className="text-[12px] text-tlb-muted max-w-xs">A per-payout transaction history isn't exposed by the API yet.</p>
        </div>
    </div>
);
