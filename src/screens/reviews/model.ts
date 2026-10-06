import { GetReviewsParams } from '../../api/reviews';
import { ReviewTab } from './types';

// ---------------------------------------------------------------------------
// Pure derivations for Reviews. No React, no I/O, unit-tested directly.
//
// The mock splits reviews into "Business" (reviews on the partner directly)
// and "Listing" (reviews on a specific listing). The real API only ever
// returns listing-tied reviews (`PartnerReview.listing_id` is always set) —
// there is no business-level review concept — so the "Business" tab and the
// "Awaiting a reply" tab/tile are real UI elements with no real data behind
// them; see presentation.ts / ReviewsList.tsx for how they render as design
// placeholders instead of vanishing.
// ---------------------------------------------------------------------------

/** Maps a UI tab + optional listing filter to real `getPartnerReviews` query params. Returns null for tabs with no real data (Business, Awaiting reply). */
export const tabToQuery = (tab: ReviewTab, listingId: string): GetReviewsParams | null => {
    if (tab === 'business' || tab === 'unanswered') return null;
    return listingId !== 'all' ? { listing_id: listingId } : {};
};

// ---------------------------------------------------------------------------
// Headline rating tile.
//
// The tile and the feed below it come from two different endpoints —
// `/partner/stats/reviews/` (aggregate) and `/partner/reviews/` (the list) —
// and they can disagree: the stats call can fail (it resolves to `null`, which
// used to render as a confident "0") or lag behind a review the feed already
// returns. A tile that says "0 reviews" above a visible review is always
// wrong, so the feed wins whenever the aggregate has nothing to show.
// ---------------------------------------------------------------------------

export interface ReviewSummary {
    avgRating: number | null;
    /** null = genuinely unknown (stats unavailable and nothing to fall back on). */
    totalReviews: number | null;
    /** True when the numbers came from the feed because the aggregate had none. */
    fromFeed: boolean;
    /** True when the average covers only the reviews loaded so far. */
    partialAverage: boolean;
    /** Whose rating this is — the whole partner, or the one listing picked in the filter. */
    scope: 'partner' | 'listing';
}

interface FeedInput {
    reviews: { rating: number }[];
    total: number;
    /** Only an unfiltered feed can stand in for a partner-wide aggregate. */
    unfiltered: boolean;
    /** The feed is narrowed to one listing — the tile then rates that listing. */
    listing?: boolean;
}

/** Mean of the ratings actually present, and whether that covers every review. */
const feedAverage = (reviews: { rating: number }[], total: number) => {
    const rated = reviews.map((r) => r.rating).filter((r) => typeof r === 'number' && r > 0);
    return {
        avgRating: rated.length > 0 ? rated.reduce((sum, r) => sum + r, 0) / rated.length : null,
        partialAverage: rated.length < total,
    };
};

export const reviewSummary = (stats: StatsLike | null, feed: FeedInput): ReviewSummary => {
    // One listing picked: the partner-wide aggregate is the wrong number — rate
    // that listing from its own reviews.
    if (feed.listing) {
        return { ...feedAverage(feed.reviews, feed.total), totalReviews: feed.total, fromFeed: true, scope: 'listing' };
    }
    if (stats && stats.total_reviews > 0) {
        if (stats.avg_rating == null && feed.unfiltered && feed.reviews.length > 0) {
            // The aggregate counts the reviews but sent no average (QA: a null
            // rating beside 3–4 reviews) — work it out from the reviews themselves.
            return {
                ...feedAverage(feed.reviews, stats.total_reviews),
                totalReviews: stats.total_reviews,
                fromFeed: true,
                scope: 'partner',
            };
        }
        return { avgRating: stats.avg_rating, totalReviews: stats.total_reviews, fromFeed: false, partialAverage: false, scope: 'partner' };
    }
    if (feed.unfiltered && feed.total > 0) {
        return { ...feedAverage(feed.reviews, feed.total), totalReviews: feed.total, fromFeed: true, scope: 'partner' };
    }
    // A real zero (stats answered, feed agrees) vs. nothing to go on at all.
    return { avgRating: null, totalReviews: stats ? stats.total_reviews : null, fromFeed: false, partialAverage: false, scope: 'partner' };
};

interface StatsLike {
    avg_rating: number | null;
    total_reviews: number;
}
