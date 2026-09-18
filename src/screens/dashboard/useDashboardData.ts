import { useCallback, useEffect, useMemo, useState } from 'react';
import { EntityType } from '../../types';
import { DateRangeKey } from '../../constants/dateRange';
import {
    loadCurrentPartner, loadPartnerEnquiries, loadPartnerListings,
    PartnerEnquiry, PartnerListing,
} from '../../api/portalSummary';
import { getStatsEvents, getStatsRevenue, getStatsReviews, getStatsVenues, StatsEvents, StatsRevenue, StatsReviews, StatsVenues } from '../../api/stats';
import { getBankDetails, BankDetails } from '../../api/banking';
import { InAppNotification, listNotifications } from '../../api/notifications';
import { getBookings } from '../../api/listings';
import { buildDashboardModel, countBookingsOn, DashboardModel } from './dashboardModel';

const RECENT_ACTIVITY_LIMIT = 5;
// Dashboard wants fresh numbers but should still share calls the shell just made.
const FRESH_MS = 5_000;

interface CoreData {
    partner: any;
    listings: PartnerListing[];
    enquiries: PartnerEnquiry[];
    events: StatsEvents | null;
    venues: StatsVenues | null;
    reviews: StatsReviews | null;
    bank: BankDetails | null | undefined;
    notifications: InAppNotification[];
    /** First page of bookings (newest first), or null when not applicable / failed. */
    recentBookings: any[] | null;
}

const settled = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === 'fulfilled' ? result.value : fallback;

const asList = (json: any): any[] => {
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : (data?.results ?? []);
};

export interface DashboardData {
    loading: boolean;
    /** True while a period change is refetching revenue-derived figures. */
    revenueLoading: boolean;
    partner: any;
    notifications: InAppNotification[];
    model: DashboardModel | null;
    markActivityRead: (id: string) => void;
}

export const useDashboardData = (entities: EntityType[], range: DateRangeKey): DashboardData => {
    const [core, setCore] = useState<CoreData | null>(null);
    const [revenue, setRevenue] = useState<StatsRevenue | null>(null);
    const [revenueLoading, setRevenueLoading] = useState(true);
    const scopeKey = entities.join(',');

    // Everything that doesn't depend on the reporting period. Every source is
    // independent, so a failing endpoint only blanks its own figures.
    useEffect(() => {
        let cancelled = false;
        const includes = (e: EntityType) => entities.length === 0 || entities.includes(e);
        const hasEvents = includes('Events');
        const hasVenues = includes('Venues');

        Promise.allSettled([
            loadCurrentPartner(FRESH_MS),
            loadPartnerListings(entities, FRESH_MS),
            loadPartnerEnquiries(entities, FRESH_MS),
            hasEvents ? getStatsEvents() : Promise.resolve(null),
            hasVenues ? getStatsVenues() : Promise.resolve(null),
            getStatsReviews(),
            getBankDetails(),
            listNotifications({ page_size: RECENT_ACTIVITY_LIMIT }),
            hasEvents || hasVenues ? getBookings() : Promise.resolve(null),
        ]).then(([partner, listings, enquiries, events, venues, reviews, bank, notifications, bookings]) => {
            if (cancelled) return;
            if (partner.status === 'rejected') console.error('Dashboard: partner load failed', partner.reason);
            setCore({
                partner: settled(partner, null),
                listings: settled(listings, []),
                enquiries: settled(enquiries, []),
                events: settled(events, null),
                venues: settled(venues, null),
                reviews: settled(reviews, null),
                bank: bank.status === 'fulfilled' ? bank.value : undefined,
                notifications: notifications.status === 'fulfilled' ? notifications.value.results : [],
                recentBookings: bookings.status === 'fulfilled' && bookings.value ? asList(bookings.value) : null,
            });
        });

        return () => { cancelled = true; };
    }, [scopeKey]);

    // Revenue (and confirmed bookings) follow the selected period.
    useEffect(() => {
        let cancelled = false;
        setRevenueLoading(true);
        getStatsRevenue(range)
            .then(r => { if (!cancelled) setRevenue(r); })
            .catch(() => { if (!cancelled) setRevenue(null); })
            .finally(() => { if (!cancelled) setRevenueLoading(false); });
        return () => { cancelled = true; };
    }, [range]);

    const model = useMemo(() => {
        if (!core) return null;
        const now = new Date();
        return buildDashboardModel({
            entities, range, now,
            partner: core.partner,
            listings: core.listings,
            enquiries: core.enquiries,
            revenue,
            events: core.events,
            venues: core.venues,
            reviews: core.reviews,
            bank: core.bank,
            notifications: core.notifications,
            // First page only — an undercount on very busy days, never an overcount.
            bookingsToday: core.recentBookings ? countBookingsOn(core.recentBookings, now) : null,
        });
    }, [core, revenue, scopeKey, range]);

    const markActivityRead = useCallback((id: string) => {
        setCore(prev => prev && {
            ...prev,
            notifications: prev.notifications.map(n => (n.id === id ? { ...n, is_read: true } : n)),
        });
    }, []);

    return {
        loading: core === null,
        revenueLoading,
        partner: core?.partner ?? null,
        notifications: core?.notifications ?? [],
        model,
        markActivityRead,
    };
};
