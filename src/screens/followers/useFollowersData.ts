import { useCallback, useEffect, useRef, useState } from 'react';
import { getFollowerDetail, getFollowers, FollowerDetail } from '../../api/followers';
import { useLatestRequest } from '../../hooks/useLatestRequest';
import { FollowerFilters, FollowerRow } from './types';

// ---------------------------------------------------------------------------
// Loads the partner's followers — one page at a time, appending on "load more".
// Search, gender and ordering are all real server-side query params, so a
// filter change restarts at page 1 rather than filtering what's on screen.
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

interface State {
    loading: boolean;
    error: string | null;
    rows: FollowerRow[];
    total: number;
}

export const useFollowersData = (filters: FollowerFilters) => {
    const [state, setState] = useState<State>({ loading: true, error: null, rows: [], total: 0 });
    const [page, setPage] = useState(1);
    const begin = useLatestRequest();
    const [detail, setDetail] = useState<FollowerDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    // Typing shouldn't fire a request per keystroke; the other two filters are
    // discrete choices, so they apply immediately.
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
    const searchTimer = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(searchTimer.current);
    }, [filters.search]);

    const { gender, ordering } = filters;
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, gender, ordering]);

    const load = useCallback(
        async (targetPage: number) => {
            const isCurrent = begin();
            setState((s) => ({ ...s, loading: true, error: null }));
            try {
                const res = await getFollowers({
                    page: targetPage,
                    page_size: PAGE_SIZE,
                    search: debouncedSearch.trim() || undefined,
                    gender: gender || undefined,
                    ordering,
                });
                if (!isCurrent()) return; // search or filter changed meanwhile
                setState((s) => ({
                    loading: false,
                    error: null,
                    rows: targetPage === 1 ? res.results : [...s.rows, ...res.results],
                    total: res.count ?? res.results.length,
                }));
            } catch (err: any) {
                if (!isCurrent()) return;
                console.error('Followers load failed', err);
                setState((s) => ({ ...s, loading: false, error: err?.message || 'Failed to load followers.' }));
            }
        },
        [debouncedSearch, gender, ordering, begin]
    );

    useEffect(() => {
        load(page);
    }, [load, page]);

    const openDetail = useCallback(async (userId: string) => {
        setDetail(null);
        setDetailError(null);
        setDetailLoading(true);
        try {
            setDetail(await getFollowerDetail(userId));
        } catch (err: any) {
            console.error('Follower detail load failed', err);
            setDetailError(err?.message || 'Couldn’t load this follower’s details.');
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const closeDetail = useCallback(() => {
        setDetail(null);
        setDetailError(null);
        setDetailLoading(false);
    }, []);

    return {
        loading: state.loading,
        error: state.error,
        rows: state.rows,
        total: state.total,
        loadMore: () => setPage((p) => p + 1),
        reload: () => (page === 1 ? load(1) : setPage(1)),
        detail,
        detailLoading,
        detailError,
        openDetail,
        closeDetail,
    };
};
