import React, { useState } from 'react';
import { Pill } from '../../../components/portal';
import { LedgerTab } from '../types';

const TABS: { key: LedgerTab; label: string; headers: string[]; note: string }[] = [
    {
        key: 'invoices', label: 'Invoices', headers: ['Invoice', 'Listing', 'Amount', 'Settlement'],
        note: "Each invoice is generated per booking as it's paid; settlement follows TLB's payout schedule.",
    },
    {
        key: 'refunds', label: 'Refunds', headers: ['Refund', 'Customer', 'Amount', 'Status'],
        note: 'Refunds are processed by TLB — this would be a read-only record.',
    },
];

/** Neither a per-booking invoice/settlement record nor a per-refund record exists in the API yet — both tabs render the mock's table shape with a Coming soon body. */
export const LedgerPanel: React.FC = () => {
    const [tab, setTab] = useState<LedgerTab>('invoices');
    const active = TABS.find(t => t.key === tab)!;

    return (
        <div className="pt-card p-[16px_20px]">
            <div className="flex items-center justify-between gap-4 mb-3">
                <p className="pt-h-sec">{active.label}</p>
                <div className="flex gap-2">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`pt-scope ${tab === t.key ? 'is-active' : ''}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-4 gap-2.5 pb-2 border-b border-tlb-divider">
                {active.headers.map(h => <span key={h} className="pt-eyebrow">{h}</span>)}
            </div>
            <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
                <Pill tone="neutral">Coming soon</Pill>
                <p className="text-[12px] text-tlb-muted max-w-xs">
                    {tab === 'invoices'
                        ? 'Per-booking invoices and settlement status are not exposed by the API yet.'
                        : 'A per-refund ledger is not exposed by the API yet.'}
                </p>
            </div>
            <p className="text-[11.5px] text-tlb-muted mt-2">{active.note}</p>
        </div>
    );
};
