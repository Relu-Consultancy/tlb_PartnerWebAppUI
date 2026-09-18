import { useCallback, useEffect, useState } from 'react';
import { getStatsTraffic, StatsTraffic } from '../../api/stats';
import { isCustomRangeReady } from './model';
import { TrafficPeriodState } from './types';

interface State {
    loading: boolean;
    traffic: StatsTraffic | null;
    error: string | null;
}

export const useTrafficData = (period: TrafficPeriodState) => {
    const [state, setState] = useState<State>({ loading: true, traffic: null, error: null });
    const ready = period.key !== 'custom' || isCustomRangeReady(period.dateFrom, period.dateTo);

    const load = useCallback(async () => {
        if (!ready) { setState({ loading: false, traffic: null, error: null }); return; }
        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const traffic = await getStatsTraffic(
                period.key === 'custom'
                    ? { period: 'custom', date_from: period.dateFrom, date_to: period.dateTo }
                    : { period: period.key }
            );
            setState({ loading: false, traffic, error: null });
        } catch (e: any) {
            setState({ loading: false, traffic: null, error: e?.message || 'Failed to load traffic stats' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period.key, period.dateFrom, period.dateTo, ready]);

    useEffect(() => { load(); }, [load]);

    return { ...state, ready, reload: load };
};
