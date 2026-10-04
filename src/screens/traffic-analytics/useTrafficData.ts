import { useCallback, useEffect, useState } from 'react';
import { getStatsTraffic, StatsTraffic } from '../../api/stats';
import { isApprovalError } from '../../api/client';
import { useLatestRequest } from '../../hooks/useLatestRequest';
import { isCustomRangeReady } from './model';
import { TrafficPeriodState } from './types';

interface State {
    loading: boolean;
    traffic: StatsTraffic | null;
    error: string | null;
    /** The backend refused because the partner isn't approved yet. */
    approvalRefused: boolean;
}

export const useTrafficData = (period: TrafficPeriodState) => {
    const [state, setState] = useState<State>({ loading: true, traffic: null, error: null, approvalRefused: false });
    const begin = useLatestRequest();
    const ready = period.key !== 'custom' || isCustomRangeReady(period.dateFrom, period.dateTo);

    const load = useCallback(async () => {
        const isCurrent = begin();
        if (!ready) {
            setState({ loading: false, traffic: null, error: null, approvalRefused: false });
            return;
        }
        setState((s) => ({ ...s, loading: true, error: null, approvalRefused: false }));
        try {
            const traffic = await getStatsTraffic(
                period.key === 'custom' ? { period: 'custom', date_from: period.dateFrom, date_to: period.dateTo } : { period: period.key }
            );
            if (!isCurrent()) return; // period changed meanwhile
            setState({ loading: false, traffic, error: null, approvalRefused: false });
        } catch (e: any) {
            if (!isCurrent()) return;
            setState({
                loading: false,
                traffic: null,
                error: e?.message || 'Failed to load traffic stats',
                approvalRefused: isApprovalError(e),
            });
        }
    }, [period.key, period.dateFrom, period.dateTo, ready, begin]);

    useEffect(() => {
        load();
    }, [load]);

    return { ...state, ready, reload: load };
};
