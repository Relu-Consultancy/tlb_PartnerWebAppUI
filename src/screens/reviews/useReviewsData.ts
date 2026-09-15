import { useCallback, useEffect, useState } from 'react';
import { EntityType } from '../../types';
import { getPartnerReviews, PartnerReview } from '../../api/reviews';
import { getStatsReviews, StatsReviews } from '../../api/stats';
import { loadPartnerListings, PartnerListing } from '../../api/portalSummary';
import { tabToQuery } from './model';
import { ReviewTab } from './types';

const PAGE_SIZE = 10;

interface State {
    loading: boolean;
    error: string | null;
    reviews: PartnerReview[];
    total: number;
}

export const useReviewsData = (allowedEntities: EntityType[], tab: ReviewTab, listingId: string) => {
    const [stats, setStats] = useState<StatsReviews | null>(null);
    const [listings, setListings] = useState<PartnerListing[]>([]);
    const [state, setState] = useState<State>({ loading: true, error: null, reviews: [], total: 0 });
    const [page, setPage] = useState(1);

    useEffect(() => {
        getStatsReviews().then(setStats).catch(() => setStats(null));
        loadPartnerListings(allowedEntities).then(setListings).catch(() => setListings([]));
    }, [allowedEntities.join(',')]);

    useEffect(() => { setPage(1); }, [tab, listingId]);

    const load = useCallback(async (targetPage: number) => {
        const query = tabToQuery(tab, listingId);
        if (query === null) { setState({ loading: false, error: null, reviews: [], total: 0 }); return; }
        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const res = await getPartnerReviews({ ...query, page: targetPage, page_size: PAGE_SIZE });
            setState(s => ({
                loading: false,
                error: null,
                reviews: targetPage === 1 ? res.results : [...s.reviews, ...res.results],
                total: res.count,
            }));
        } catch (err: any) {
            setState(s => ({ ...s, loading: false, error: err?.message || 'Failed to load reviews.' }));
        }
    }, [tab, listingId]);

    useEffect(() => { load(page); }, [load, page]);

    const loadMore = () => setPage(p => p + 1);

    return { stats, listings, loading: state.loading, error: state.error, reviews: state.reviews, total: state.total, loadMore };
};
