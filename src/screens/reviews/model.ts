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
