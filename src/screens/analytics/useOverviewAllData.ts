import { useEffect, useState } from 'react';
import { getStatsOverviewAll, OverviewAllListingType, StatsOverviewAll } from '../../api/stats';
import { RevenuePeriod } from '../../api/stats';

interface State {
    loading: boolean;
    overview: StatsOverviewAll | null;
    error: string | null;
}

/** Backs the Overview tab's All services/Events/Classes/Venues scope — one endpoint, re-scoped by listing_type. */
export const useOverviewAllData = (period: RevenuePeriod, listingType?: OverviewAllListingType) => {
    const [state, setState] = useState<State>({ loading: true, overview: null, error: null });

    useEffect(() => {
        let cancelled = false;
        setState(s => ({ ...s, loading: true, error: null }));
        getStatsOverviewAll(period, listingType)
            .then(overview => { if (!cancelled) setState({ loading: false, overview, error: null }); })
            .catch((e: any) => { if (!cancelled) setState({ loading: false, overview: null, error: e?.message || 'Failed to load overview stats' }); });
        return () => { cancelled = true; };
    }, [period, listingType]);

    return state;
};
