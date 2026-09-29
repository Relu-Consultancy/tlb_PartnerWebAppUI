import { parseDate } from '../../utils/format';
import { FollowerOrdering, FollowerRow, FollowerStats } from './types';

// ---------------------------------------------------------------------------
// Pure derivations for Followers — recency, and the headline tiles. No React,
// no I/O, unit-tested directly.
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;
const NEW_BADGE_DAYS = 7;
const RECENT_WINDOW_DAYS = 30;

/** Followed within the last week — the row's "New" pill. */
export const isNewFollower = (row: FollowerRow, now: Date): boolean => {
    const at = parseDate(row.followed_at);
    return at != null && now.getTime() - at.getTime() < NEW_BADGE_DAYS * DAY_MS;
};

/**
 * Headline tiles. `total` is the server's own count; the other two can only be
 * derived from the rows loaded so far, so each reports whether it's complete
 * rather than quietly presenting a partial number as the whole truth.
 */
export const followerStats = (rows: FollowerRow[], total: number, ordering: FollowerOrdering, now: Date): FollowerStats => {
    const cutoff = now.getTime() - RECENT_WINDOW_DAYS * DAY_MS;
    const followedAt = rows.map((r) => parseDate(r.followed_at)?.getTime() ?? null);
    const newLast30 = followedAt.filter((t) => t != null && t >= cutoff).length;
    const allLoaded = rows.length >= total;

    // Newest-first means the recent followers come first, so the count is
    // complete as soon as a loaded row falls outside the window.
    const reachedOlderRows = followedAt.some((t) => t != null && t < cutoff);
    const newLast30Exact = allLoaded || (ordering === 'newest' && reachedOlderRows);

    return {
        total,
        newLast30,
        newLast30Exact,
        cities: new Set(rows.map((r) => r.city).filter(Boolean)).size,
        allLoaded,
    };
};

/** "Loyal" at 5+ bookings, "Returning" at 1+ — nothing shown for a follower who's never booked. */
export const loyaltyLabel = (bookings: number): string | null => {
    if (bookings >= 5) return 'Loyal customer';
    if (bookings >= 1) return 'Returning customer';
    return null;
};
