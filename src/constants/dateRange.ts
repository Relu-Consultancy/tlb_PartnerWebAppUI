import type { RevenuePeriod } from '../api/stats';

// ---------------------------------------------------------------------------
// Reporting window picked in the portal top bar. Keys mirror the stats API's
// revenue `period` so a selection can be passed straight through.
// ---------------------------------------------------------------------------

export type DateRangeKey = RevenuePeriod;

export interface DateRangeOption {
    key: DateRangeKey;
    /** Short label for the picker. */
    label: string;
    /** Phrase for sentences — "Everything … · last 30 days". */
    phrase: string;
}

// Only windows the stats API can honour are offered. The mock's "Today",
// "This month" and "Custom" need backend period support before they can ship.
export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
    { key: 'all', label: 'Till date', phrase: 'all time' },
    { key: '7d', label: '7 days', phrase: 'last 7 days' },
    { key: '30d', label: '30 days', phrase: 'last 30 days' },
    { key: '90d', label: '90 days', phrase: 'last 90 days' },
    { key: '1y', label: '1 year', phrase: 'last 12 months' },
];

export const DEFAULT_DATE_RANGE: DateRangeKey = '30d';

const DAY_MS = 86_400_000;
const RANGE_DAYS: Record<Exclude<DateRangeKey, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

export const isDateRangeKey = (value: unknown): value is DateRangeKey =>
    DATE_RANGE_OPTIONS.some(o => o.key === value);

export const getDateRangeOption = (key: DateRangeKey): DateRangeOption =>
    DATE_RANGE_OPTIONS.find(o => o.key === key) ?? DATE_RANGE_OPTIONS.find(o => o.key === DEFAULT_DATE_RANGE)!;

/** Start of the window, or null for "Till date". */
export const rangeStart = (key: DateRangeKey, now: Date = new Date()): Date | null =>
    key === 'all' ? null : new Date(now.getTime() - RANGE_DAYS[key] * DAY_MS);

/** Undated records count as in range so they're never silently dropped. */
export const isWithinRange = (date: Date | null, key: DateRangeKey, now: Date = new Date()): boolean => {
    const start = rangeStart(key, now);
    return !start || !date || date >= start;
};
