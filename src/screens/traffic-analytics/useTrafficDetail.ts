import { useCallback, useEffect, useState } from 'react';
import { getStatsTrafficDetail, TrafficDetailByDayRow, TrafficDetailByListingRow, TrafficGroupBy } from '../../api/stats';
import { isCustomRangeReady } from './model';
import { TrafficPeriodState } from './types';

const PAGE_SIZE = 20;

interface State {
    loading: boolean;
    rows: (TrafficDetailByDayRow | TrafficDetailByListingRow)[];
    total: number;
    error: string | null;
}

/** Paginated day/listing drill-down for the traffic detail table — appends on "load more", replaces on filter change. */
export const useTrafficDetail = (period: TrafficPeriodState, groupBy: TrafficGroupBy) => {
    const [state, setState] = useState<State>({ loading: true, rows: [], total: 0, error: null });
    const [page, setPage] = useState(1);
    const ready = period.key !== 'custom' || isCustomRangeReady(period.dateFrom, period.dateTo);

    const periodParams = period.key === 'custom'
        ? { period: 'custom' as const, date_from: period.dateFrom, date_to: period.dateTo }
        : { period: period.key };

    const load = useCallback(async (targetPage: number) => {
        if (!ready) { setState({ loading: false, rows: [], total: 0, error: null }); return; }
        // Clear stale rows immediately on a page-1 (filter-change) load — otherwise a
        // group_by switch briefly renders the previous shape's rows under the new columns.
        setState(s => ({ ...s, loading: true, error: null, rows: targetPage === 1 ? [] : s.rows }));
        try {
            const res = await getStatsTrafficDetail({ ...periodParams, group_by: groupBy as 'day', page: targetPage, page_size: PAGE_SIZE });
            setState(s => ({
                loading: false, error: null, total: res.count,
                rows: targetPage === 1 ? res.results : [...s.rows, ...res.results],
            }));
        } catch (e: any) {
            setState({ loading: false, rows: [], total: 0, error: e?.message || 'Failed to load traffic detail' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period.key, period.dateFrom, period.dateTo, groupBy, ready]);

    useEffect(() => { setPage(1); load(1); }, [load]);

    const loadMore = () => { const next = page + 1; setPage(next); load(next); };

    return { ...state, loadMore };
};
