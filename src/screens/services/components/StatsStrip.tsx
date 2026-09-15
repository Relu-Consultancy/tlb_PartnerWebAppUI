import React from 'react';
import { ListingState } from '../../../api/portalSummary';
import { LISTING_STATUS_META, TONE_CLASSES } from '../../../components/portal';
import { formatCount, formatRupees } from '../../../utils/format';
import { ListingStateCounts } from '../model';

// Five real states (Archived stays filterable, not a headline tile) + one
// money tile — the mock's six-stat strip, on real listing states + real
// period revenue instead of a fabricated "Scheduled"/"Expired"/payout ledger.
const STRIP_STATES: { state: ListingState; sub: string }[] = [
    { state: 'live', sub: 'listings taking bookings' },
    { state: 'pending', sub: 'awaiting review' },
    { state: 'paused', sub: 'paused by you' },
    { state: 'rejected', sub: 'need changes' },
    { state: 'draft', sub: 'not submitted yet' },
];

interface StatsStripProps {
    counts: ListingStateCounts;
    settled: number | null;
    settledLabel: string;
}

export const StatsStrip: React.FC<StatsStripProps> = ({ counts, settled, settledLabel }) => (
    <div className="pt-card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 overflow-hidden">
        {STRIP_STATES.map(({ state, sub }) => (
            <div key={state} className="pt-stat">
                <p className="pt-eyebrow">{LISTING_STATUS_META[state].label}</p>
                <p className={`pt-stat-n ${TONE_CLASSES[LISTING_STATUS_META[state].tone].split(' ').find(c => c.startsWith('text-'))}`}>
                    {formatCount(counts[state])}
                </p>
                <p className="text-[11.5px] text-tlb-muted mt-0.5">{sub}</p>
            </div>
        ))}
        <div className="pt-stat">
            <p className="pt-eyebrow">Settled</p>
            <p className="pt-stat-n text-tlb-gold">{settled != null ? formatRupees(settled) : '—'}</p>
            <p className="text-[11.5px] text-tlb-muted mt-0.5">{settledLabel}</p>
        </div>
    </div>
);
