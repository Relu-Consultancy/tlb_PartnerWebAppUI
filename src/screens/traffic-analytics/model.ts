import { DailyTrafficPoint, TrafficSourceSlice } from '../../api/stats';
import { parseDate } from '../../utils/format';
import { sourceLabel } from './presentation';
import { SourceSlice, TrendBar } from './types';

// ---------------------------------------------------------------------------
// Pure derivations for the traffic-analytics screen — chart bars and source
// percentages. No React, no I/O, unit-tested directly.
// ---------------------------------------------------------------------------

const shortDateLabel = (iso: string): string => {
    const d = parseDate(iso);
    return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : iso;
};

/** Daily trend, chart-ready — the API already fills every day in the window, zero-view included. */
export const trendBars = (points: DailyTrafficPoint[]): TrendBar[] =>
    points.map(p => ({ date: p.date, label: shortDateLabel(p.date), views: p.views }));

/** Source breakdown with percent-of-total — API already sorts by views descending. */
export const sourceSlices = (bySource: TrafficSourceSlice[]): SourceSlice[] => {
    const total = bySource.reduce((sum, s) => sum + s.views, 0);
    return bySource.map(s => ({
        source: s.source,
        label: sourceLabel(s.source),
        views: s.views,
        pct: total > 0 ? Math.round((s.views / total) * 100) : 0,
    }));
};

/** A custom range only becomes a real query once both dates are chosen. */
export const isCustomRangeReady = (dateFrom: string, dateTo: string): boolean =>
    dateFrom.length > 0 && dateTo.length > 0 && dateFrom <= dateTo;
