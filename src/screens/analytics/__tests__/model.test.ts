import { describe, it, expect } from 'vitest';
import {
    funnelStages, overviewFunnelStages, revenueByListingSlices, revenueTypeSlices,
    trendPoints, uncontactedLeadValue, weeklyTrendPoints,
} from '../model';

describe('revenueTypeSlices', () => {
    it('labels known types, computes percentages, and sorts by amount desc', () => {
        const slices = revenueTypeSlices([
            { type: 'event', amount: '30000', count: 10 },
            { type: 'venue', amount: '70000', count: 5 },
        ]);
        expect(slices[0]).toMatchObject({ type: 'venue', label: 'Venues', amount: 70000, pct: 70 });
        expect(slices[1]).toMatchObject({ type: 'event', label: 'Events', amount: 30000, pct: 30 });
    });

    it('falls back to a capitalized label for an unrecognized type', () => {
        expect(revenueTypeSlices([{ type: 'bundle', amount: '100', count: 1 }])[0].label).toBe('Bundle');
    });

    it('never divides by zero when there is no revenue at all', () => {
        expect(revenueTypeSlices([{ type: 'event', amount: '0', count: 0 }])[0].pct).toBe(0);
    });
});

describe('trendPoints', () => {
    it('maps revenue_trend buckets to short month labels', () => {
        const points = trendPoints({ revenue_trend: [{ month: 'Jul 2026', count: 12, earnings: '24500.00' }] });
        expect(points).toEqual([{ label: 'Jul', revenue: 24500, bookings: 12 }]);
    });
});

describe('funnelStages', () => {
    it('computes each stage as a percentage of profile views', () => {
        const stages = funnelStages(
            { profile_views: 1000 },
            { conversion_funnel: { new_leads: 100, contacted: 60, converted: 40, conversion_rate: 40 } },
        );
        // [views, detail opens (placeholder), leads, contacted, converted]
        expect(stages.map(s => s.pctOfFirst)).toEqual([100, 0, 10, 6, 4]);
        expect(stages.find(s => s.key === 'detail')?.available).toBe(false);
    });

    it('labels the final stage "Enquiries closed", not a literal booking count', () => {
        // conversion_funnel.converted is a count of status="closed" enquiries (Class/Program/Venue
        // combined) — reaching an in-progress stage like trial_booked/enrolled doesn't count, and
        // "closed" doesn't itself guarantee a booking resulted, so this must not read as a booking count.
        const stages = funnelStages(
            { profile_views: 1000 },
            { conversion_funnel: { new_leads: 100, contacted: 60, converted: 40, conversion_rate: 40 } },
        );
        expect(stages.find(s => s.key === 'converted')?.label).toBe('Enquiries closed');
    });

    it('never divides by zero with no profile views', () => {
        const stages = funnelStages({ profile_views: 0 }, null);
        expect(stages.every(s => Number.isFinite(s.pctOfFirst))).toBe(true);
    });
});

describe('uncontactedLeadValue', () => {
    it('multiplies uncontacted leads by the average order value', () => {
        const result = uncontactedLeadValue(
            { conversion_funnel: { new_leads: 84, contacted: 51, converted: 30, conversion_rate: 0 } },
            { avg_order_value: '2000' },
        );
        expect(result).toEqual({ uncontacted: 33, value: 66000 });
    });

    it('never goes negative when contacted exceeds new_leads', () => {
        const result = uncontactedLeadValue(
            { conversion_funnel: { new_leads: 10, contacted: 15, converted: 5, conversion_rate: 0 } },
            { avg_order_value: '500' },
        );
        expect(result.uncontacted).toBe(0);
    });
});

describe('weeklyTrendPoints', () => {
    it('maps week_start to a short date label', () => {
        const points = weeklyTrendPoints([{ week_start: '2026-07-27', revenue: '8200.00', bookings: 6 }]);
        expect(points).toEqual([{ label: '27 Jul', revenue: 8200, bookings: 6 }]);
    });

    it('returns an empty array for an empty window', () => {
        expect(weeklyTrendPoints([])).toEqual([]);
    });
});

describe('revenueByListingSlices', () => {
    it('computes percentages and sorts by amount desc, labeling by listing title', () => {
        const slices = revenueByListingSlices([
            { listing_id: 'v1', listing_title: 'Grand Hall', amount: '18000.00', count: 5 },
            { listing_id: 'v2', listing_title: 'Rooftop Lounge', amount: '8200.00', count: 4 },
        ]);
        expect(slices[0]).toMatchObject({ type: 'v1', label: 'Grand Hall', amount: 18000, count: 5 });
        expect(slices[0].pct + slices[1].pct).toBe(100);
    });

    it('never divides by zero when there is no revenue at all', () => {
        expect(revenueByListingSlices([{ listing_id: 'v1', listing_title: 'Grand Hall', amount: '0', count: 0 }])[0].pct).toBe(0);
    });
});

describe('overviewFunnelStages', () => {
    it('builds a real 3-stage funnel (no placeholder stages) as a percentage of listing views', () => {
        const stages = overviewFunnelStages({ listing_views: 1000, enquiries: 84, confirmed_bookings: 57 });
        expect(stages).toHaveLength(3);
        expect(stages.every(s => s.available)).toBe(true);
        expect(stages.map(s => s.pctOfFirst)).toEqual([100, 8, 6]);
    });

    it('never divides by zero with no listing views', () => {
        const stages = overviewFunnelStages({ listing_views: 0, enquiries: 0, confirmed_bookings: 0 });
        expect(stages.every(s => Number.isFinite(s.pctOfFirst))).toBe(true);
    });
});

