import { RevenueByType } from '../../api/stats';
import { toNumber } from '../../utils/format';
import { VerticalAmount } from './types';

// ---------------------------------------------------------------------------
// Pure derivations for Revenue & payouts. No React, no I/O, unit-tested
// directly. See implementation_graph.md for the full list of mock elements
// that have no backing API (ledger, payout history, available balance) and
// render as "Coming soon" design placeholders instead of being dropped.
// ---------------------------------------------------------------------------

const TYPE_LABEL: Record<string, string> = {
    event: 'Events', class: 'Classes', program: 'Programs', venue: 'Venues',
};

const labelOf = (type: string): string => TYPE_LABEL[type.toLowerCase()] || (type.charAt(0).toUpperCase() + type.slice(1));

/** Real "revenue by vertical" row per type — the mock's own figures, just sourced from `revenue_by_type`. */
export const verticalAmounts = (types: RevenueByType[]): VerticalAmount[] =>
    types.map(t => ({ label: labelOf(t.type), amount: toNumber(t.amount) })).sort((a, b) => b.amount - a.amount);

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_REGEX = /^\d{9,18}$/;
