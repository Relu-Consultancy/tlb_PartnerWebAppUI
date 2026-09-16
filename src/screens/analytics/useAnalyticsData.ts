import { useCallback, useEffect, useState } from 'react';
import {
    getStatsOverview, getStatsEvents, getStatsVenues, getStatsEnquiries, getStatsRevenue, getStatsReviews, getStatsTraffic,
    StatsOverview, StatsEvents, StatsVenues, StatsEnquiries, StatsRevenue, StatsReviews, StatsTraffic,
} from '../../api/stats';
import { DateRangeKey } from '../../constants/dateRange';

// ---------------------------------------------------------------------------
// Loads every partner-stats endpoint in parallel for the selected reporting
// window. Each is independently optional — one endpoint failing doesn't
// blank the rest of the page.
// ---------------------------------------------------------------------------

interface State {
    loading: boolean;
    overview: StatsOverview | null;
    events: StatsEvents | null;
    venues: StatsVenues | null;
    enquiries: StatsEnquiries | null;
    revenue: StatsRevenue | null;
    reviews: StatsReviews | null;
    traffic: StatsTraffic | null;
    error: boolean;
}

const settled = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null);

export const useAnalyticsData = (range: DateRangeKey) => {
    const [state, setState] = useState<State>({
        loading: true, overview: null, events: null, venues: null, enquiries: null, revenue: null, reviews: null, traffic: null, error: false,
    });

    const load = useCallback(async () => {
        setState(s => ({ ...s, loading: true }));
        const [oRes, eRes, vRes, enqRes, revRes, rwRes, trRes] = await Promise.allSettled([
            getStatsOverview(), getStatsEvents(), getStatsVenues(), getStatsEnquiries(), getStatsRevenue(range), getStatsReviews(), getStatsTraffic(),
        ]);
        setState({
            loading: false,
            overview: settled(oRes),
            events: settled(eRes),
            venues: settled(vRes),
            enquiries: settled(enqRes),
            revenue: settled(revRes),
            reviews: settled(rwRes),
            traffic: settled(trRes),
            error: [oRes, eRes, vRes, enqRes, revRes, rwRes, trRes].every(r => r.status === 'rejected'),
        });
    }, [range]);

    useEffect(() => { load(); }, [load]);

    return { ...state, reload: load };
};
