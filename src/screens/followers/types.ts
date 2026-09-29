import { FollowerListItem } from '../../api/followers';

// ---------------------------------------------------------------------------
// Followers — people following the partner's brand on the TLB app. The list is
// server-paginated, server-searched and server-sorted; everything here just
// names the shapes the screen passes around.
// ---------------------------------------------------------------------------

export type FollowerOrdering = 'newest' | 'oldest' | 'name';

/** '' = every gender, including followers who never set one. */
export type GenderFilter = '' | 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface FollowerFilters {
    search: string;
    gender: GenderFilter;
    ordering: FollowerOrdering;
}

export interface FollowerStats {
    /** Server-side total across every page. */
    total: number;
    /** Followers gained in the last 30 days, from the rows loaded so far. */
    newLast30: number;
    /**
     * True when `newLast30` is the whole picture — newest-first ordering means
     * every recent follower is already loaded once the oldest loaded row falls
     * outside the window. Otherwise the tile reads "N+".
     */
    newLast30Exact: boolean;
    /** Distinct cities among the rows loaded so far. */
    cities: number;
    /** True once every follower the server has is on screen. */
    allLoaded: boolean;
}

export type FollowerRow = FollowerListItem;
