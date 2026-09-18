import { useCallback, useEffect, useState } from 'react';
import {
    getStatsOverview, getStatsEvents, getStatsVenues, getStatsEnquiries, getStatsRevenue, getStatsReviews, getStatsTraffic,
    getStatsOverviewAll,
    StatsOverview, StatsEvents, StatsVenues, StatsEnquiries, StatsRevenue, StatsReviews, StatsTraffic, StatsOverviewAll,
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
    /** Always the unscoped "All services" overview (listing_type omitted) — independent of whatever
     * service scope the Overview tab's own selector is on. Currently only consumed for `top_city` on
     * the Demand-funnel tab's "Where customers come from" card. */
    overviewAll: StatsOverviewAll | null;
    error: boolean;
}

const settled = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null);

export const useAnalyticsData = (range: DateRangeKey) => {
    const [state, setState] = useState<State>({
        loading: true, overview: null, events: null, venues: null, enquiries: null, revenue: null, reviews: null, traffic: null, overviewAll: null, error: false,
    });

    const load = useCallback(async () => {
        setState(s => ({ ...s, loading: true }));
        const [oRes, eRes, vRes, enqRes, revRes, rwRes, trRes, oaRes] = await Promise.allSettled([
            getStatsOverview(), getStatsEvents(), getStatsVenues(), getStatsEnquiries(), getStatsRevenue(range), getStatsReviews(), getStatsTraffic(),
            getStatsOverviewAll(range),
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
            overviewAll: settled(oaRes),
            error: [oRes, eRes, vRes, enqRes, revRes, rwRes, trRes, oaRes].every(r => r.status === 'rejected'),
        });
    }, [range]);

    useEffect(() => { load(); }, [load]);

    return { ...state, reload: load };
};
