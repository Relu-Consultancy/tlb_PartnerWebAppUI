import { describe, it, expect } from 'vitest';
import { isCustomRangeReady, sourceSlices, trendBars } from '../model';

describe('trendBars', () => {
    it('maps daily points to chart-ready bars with short date labels', () => {
        const bars = trendBars([
            { date: '2026-09-01', views: 12 },
            { date: '2026-09-02', views: 0 },
        ]);
        expect(bars).toHaveLength(2);
        expect(bars[0].views).toBe(12);
        expect(bars[1].views).toBe(0);
        expect(bars[0].label).toContain('Sep');
    });

    it('returns an empty array for an empty window', () => {
        expect(trendBars([])).toEqual([]);
    });
});

describe('sourceSlices', () => {
    it('computes percent-of-total per source and title-cases organic/direct', () => {
        const slices = sourceSlices([
            { source: 'instagram', views: 140 },
            { source: 'organic/direct', views: 60 },
        ]);
        expect(slices[0]).toMatchObject({ source: 'instagram', label: 'Instagram', views: 140, pct: 70 });
        expect(slices[1]).toMatchObject({ source: 'organic/direct', label: 'Organic / direct', views: 60, pct: 30 });
    });

    it('returns 0% for every slice when there are no views at all', () => {
        const slices = sourceSlices([{ source: 'organic/direct', views: 0 }]);
        expect(slices[0].pct).toBe(0);
    });

    it('returns an empty array when there is no source data yet', () => {
        expect(sourceSlices([])).toEqual([]);
    });
});

describe('isCustomRangeReady', () => {
    it('is false until both dates are present', () => {
        expect(isCustomRangeReady('', '')).toBe(false);
        expect(isCustomRangeReady('2026-09-01', '')).toBe(false);
        expect(isCustomRangeReady('', '2026-09-15')).toBe(false);
    });

    it('is false when the range is inverted', () => {
        expect(isCustomRangeReady('2026-09-15', '2026-09-01')).toBe(false);
    });

    it('is true for a valid, ordered range', () => {
        expect(isCustomRangeReady('2026-09-01', '2026-09-15')).toBe(true);
    });
});
