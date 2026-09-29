import { describe, it, expect } from 'vitest';
import { reviewSummary, tabToQuery } from '../model';

describe('tabToQuery', () => {
    it('returns null for tabs with no real backing data', () => {
        expect(tabToQuery('business', 'all')).toBeNull();
        expect(tabToQuery('unanswered', 'all')).toBeNull();
    });

    it('returns an empty filter for "all" listings', () => {
        expect(tabToQuery('all', 'all')).toEqual({});
        expect(tabToQuery('listing', 'all')).toEqual({});
    });

    it('filters to a specific listing when one is chosen', () => {
        expect(tabToQuery('all', 'l1')).toEqual({ listing_id: 'l1' });
        expect(tabToQuery('listing', 'l1')).toEqual({ listing_id: 'l1' });
    });
});

describe('reviewSummary — tile vs feed', () => {
    const review = (rating: number) => ({ rating });

    it('uses the aggregate when it has reviews', () => {
        const summary = reviewSummary({ avg_rating: 4.6, total_reviews: 12 }, { reviews: [review(5)], total: 12, unfiltered: true });
        expect(summary).toEqual({ avgRating: 4.6, totalReviews: 12, fromFeed: false, partialAverage: false });
    });

    it('falls back to the feed when the stats call failed — never "0 reviews" above a visible review', () => {
        const summary = reviewSummary(null, { reviews: [review(5)], total: 1, unfiltered: true });
        expect(summary.totalReviews).toBe(1);
        expect(summary.avgRating).toBe(5);
        expect(summary.fromFeed).toBe(true);
        expect(summary.partialAverage).toBe(false);
    });

    it('falls back to the feed when the aggregate lags behind it', () => {
        const summary = reviewSummary({ avg_rating: null, total_reviews: 0 }, { reviews: [review(4)], total: 1, unfiltered: true });
        expect(summary.totalReviews).toBe(1);
        expect(summary.avgRating).toBe(4);
    });

    it('flags an average drawn from only the loaded page', () => {
        const summary = reviewSummary(null, { reviews: [review(5), review(3)], total: 40, unfiltered: true });
        expect(summary.partialAverage).toBe(true);
        expect(summary.avgRating).toBe(4);
    });

    it('never stands in a filtered feed for the partner-wide aggregate', () => {
        const summary = reviewSummary(null, { reviews: [review(5)], total: 1, unfiltered: false });
        expect(summary.totalReviews).toBeNull();
        expect(summary.fromFeed).toBe(false);
    });

    it('keeps a genuine zero as zero', () => {
        const summary = reviewSummary({ avg_rating: null, total_reviews: 0 }, { reviews: [], total: 0, unfiltered: true });
        expect(summary.totalReviews).toBe(0);
        expect(summary.avgRating).toBeNull();
    });
});
