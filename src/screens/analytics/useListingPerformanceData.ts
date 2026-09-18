import { useCallback, useEffect, useState } from 'react';
import { getStatsListingPerformance, ListingPerformanceRow, ListingPerformanceTab, RevenuePeriod } from '../../api/stats';

const PAGE_SIZE = 10;

interface State {
    loading: boolean;
    rows: ListingPerformanceRow[];
    total: number;
    error: string | null;
}

/** Backs the Listings tab's Top/Underperforming/All table — paginated, appends on "load more", replaces on filter change. */
export const useListingPerformanceData = (period: RevenuePeriod, tab: ListingPerformanceTab) => {
    const [state, setState] = useState<State>({ loading: true, rows: [], total: 0, error: null });
    const [page, setPage] = useState(1);

    const load = useCallback(async (targetPage: number) => {
        setState(s => ({ ...s, loading: true, error: null, rows: targetPage === 1 ? [] : s.rows }));
        try {
            const res = await getStatsListingPerformance({ period, tab, page: targetPage, page_size: PAGE_SIZE });
            setState(s => ({
                loading: false, error: null, total: res.count,
                rows: targetPage === 1 ? res.results : [...s.rows, ...res.results],
            }));
        } catch (e: any) {
            setState({ loading: false, rows: [], total: 0, error: e?.message || 'Failed to load listing performance' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period, tab]);

    useEffect(() => { setPage(1); load(1); }, [load]);

    const loadMore = () => { const next = page + 1; setPage(next); load(next); };

    return { ...state, loadMore };
};
