import { EntityType, Screen } from '../../types';
import type { StatsEvents, StatsReviews, StatsRevenue, StatsVenues } from '../../api/stats';
import type { BankDetails } from '../../api/banking';
import type { InAppNotification } from '../../api/notifications';
import { countListings, isUnanswered, ListingCounts, PartnerEnquiry, PartnerListing } from '../../api/portalSummary';
import { DateRangeKey, isWithinRange } from '../../constants/dateRange';
import type { ProfileSectionId } from '../../constants/profileSections';
import type { Tone } from '../../components/portal/primitives';
import { isTicketed, orderEntities, verificationOf } from '../../components/portal/partnerMeta';
import { formatCount, formatRupees, isSameLocalDay, joinWithAmpersand, parseDate, toNumber } from '../../utils/format';

// ---------------------------------------------------------------------------
// Dashboard view model — turns raw API payloads into exactly what each card
// renders. Pure (no React, no I/O) so every derivation is unit-testable.
// ---------------------------------------------------------------------------

export interface DashboardInputs {
    entities: EntityType[];
    range: DateRangeKey;
    now: Date;
    partner: any;
    listings: PartnerListing[];
    enquiries: PartnerEnquiry[];
    revenue: StatsRevenue | null;
    events: StatsEvents | null;
    venues: StatsVenues | null;
    reviews: StatsReviews | null;
    /** `undefined` = couldn't load, `null` = no bank account added yet. */
    bank: BankDetails | null | undefined;
    notifications: InAppNotification[];
    /** Bookings created today, when bookings could be read. */
    bookingsToday: number | null;
}

export interface KpiModel {
    listings: ListingCounts;
    enquiries: { received: number; unanswered: number };
    bookings: { confirmed: number | null; today: number | null };
    revenue: { gross: number | null; sources: string };
}

export type ServiceMode = 'Ticketed' | 'Ticketed + enquiry' | 'Enquiry only';

export interface Metric {
    label: string;
    value: string;
    highlight?: boolean;
}

export interface PerformanceRow {
    entity: EntityType;
    mode: ServiceMode;
    counts: ListingCounts;
    demand: { primary: string; secondary: string | null };
    /** `null` → handled off-platform (enquiry-led, no TLB payments). */
    revenue: number | null;
    metrics: Metric[];
}

export type AttentionAction =
    | { kind: 'screen'; screen: Screen }
    | { kind: 'profile'; section: ProfileSectionId }
    | { kind: 'review'; listing: PartnerListing };

export type AttentionIcon = 'alert' | 'rejected' | 'message' | 'star' | 'shield' | 'bank';

export interface AttentionItem {
    id: string;
    tone: Tone;
    icon: AttentionIcon;
    title: string;
    subtitle?: string;
    count?: number;
    action: AttentionAction;
}

export type SummaryIcon = 'message' | 'check' | 'rupee' | 'listings' | 'star';

export interface SummaryLine {
    id: string;
    tone: Tone;
    icon: SummaryIcon;
    text: string;
}

export interface UpcomingEvent {
    listing: PartnerListing;
    /** "Today, 6:00 pm" · "Tomorrow" */
    whenLabel: string;
}

export interface DashboardModel {
    /** Service types shown, in display order. */
    scope: EntityType[];
    kpis: KpiModel;
    performance: PerformanceRow[];
    attention: AttentionItem[];
    summary: SummaryLine[];
    eventsSoon: UpcomingEvent[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Selected service types, or — before categories sync — whatever the partner has listed. */
export const serviceScope = (entities: EntityType[], listings: PartnerListing[]): EntityType[] =>
    orderEntities(entities.length ? entities : Array.from(new Set(listings.map(l => l.entityType))));

export const countBookingsOn = (bookings: any[], day: Date): number =>
    bookings.filter(b => {
        const created = parseDate(b?.created_at ?? b?.booked_at ?? b?.created);
        return !!created && isSameLocalDay(created, day);
    }).length;

const revenueFor = (revenue: StatsRevenue | null, type: string): number =>
    toNumber(revenue?.revenue_by_type?.find(t => t.type === type)?.amount);

// Date-only values ("2026-09-15") are local calendar days, not UTC midnight.
const parseStart = (value: string | null): { date: Date; hasTime: boolean } | null => {
    if (!value) return null;
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) return { date: new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]), hasTime: false };
    const date = parseDate(value);
    return date ? { date, hasTime: true } : null;
};

// ── Sections ────────────────────────────────────────────────────────────────

const buildPerformance = (
    scope: EntityType[], listings: PartnerListing[], enquiriesInRange: PartnerEnquiry[],
    { revenue, events, venues }: DashboardInputs,
): PerformanceRow[] => scope.map((entity): PerformanceRow => {
    const counts = countListings(listings, entity);
    const listingsMetric: Metric = { label: 'Listings', value: formatCount(counts.total) };
    const enquiries = enquiriesInRange.filter(e => e.entityType === entity);

    switch (entity) {
        case 'Events': {
            const amount = revenueFor(revenue, 'event');
            return {
                entity, mode: 'Ticketed', counts, revenue: amount,
                demand: {
                    primary: events ? `${formatCount(events.tickets_sold)} tickets sold` : '—',
                    secondary: events ? `${formatCount(events.upcoming)} upcoming` : null,
                },
                metrics: [
                    listingsMetric,
                    { label: 'Tickets sold', value: events ? formatCount(events.tickets_sold) : '—' },
                    { label: 'Upcoming', value: events ? formatCount(events.upcoming) : '—' },
                    { label: 'Revenue', value: formatRupees(amount), highlight: true },
                ],
            };
        }
        case 'Venues': {
            const amount = revenueFor(revenue, 'venue');
            return {
                entity, mode: 'Ticketed + enquiry', counts, revenue: amount,
                demand: {
                    primary: venues ? `${formatCount(venues.total_bookings)} bookings` : '—',
                    secondary: venues ? `${Math.round(venues.occupancy_rate)}% booked` : null,
                },
                metrics: [
                    listingsMetric,
                    { label: 'Bookings', value: venues ? formatCount(venues.total_bookings) : '—' },
                    { label: 'Enquiries', value: formatCount(enquiries.length) },
                    { label: 'Revenue', value: formatRupees(amount), highlight: true },
                ],
            };
        }
        case 'Classes': {
            const responded = enquiries.filter(e => !isUnanswered(e)).length;
            return {
                entity, mode: 'Enquiry only', counts, revenue: null,
                demand: { primary: `${formatCount(enquiries.length)} enquiries`, secondary: `${formatCount(responded)} responded` },
                metrics: [
                    listingsMetric,
                    { label: 'Enquiries', value: formatCount(enquiries.length) },
                    { label: 'Responded', value: formatCount(responded) },
                ],
            };
        }
        case 'Programs':
        default: {
            // Program enquiries are per-listing only, so demand isn't rolled up here.
            const amount = revenueFor(revenue, 'program');
            return {
                entity, mode: 'Enquiry only', counts, revenue: amount > 0 ? amount : null,
                demand: { primary: 'Enquiry-led', secondary: null },
                metrics: [
                    listingsMetric,
                    { label: 'Live', value: formatCount(counts.live) },
                    { label: 'Pending', value: formatCount(counts.pending) },
                ],
            };
        }
    }
});

const buildAttention = (
    scope: EntityType[], listings: PartnerListing[], enquiries: PartnerEnquiry[],
    { partner, reviews, bank, notifications }: DashboardInputs,
): AttentionItem[] => {
    const items: AttentionItem[] = [];

    const status = partner?.status || '';
    const canOperate = partner?.is_active === true || status === 'activated_limited';
    if (canOperate && verificationOf(partner) === 'pending') {
        items.push({
            id: 'verification', tone: 'red', icon: 'shield',
            title: 'Submit your verification documents',
            subtitle: 'Get verified to unlock payouts and full visibility',
            action: { kind: 'screen', screen: 'AGREEMENT_SUBMIT' },
        });
    }

    const refunds = notifications.filter(n => !n.is_read && (n.notification_type || '').toLowerCase().includes('refund'));
    if (refunds.length > 0) {
        items.push({
            id: 'refunds', tone: 'red', icon: 'alert',
            title: refunds[0].title || 'A refund is in progress',
            count: refunds.length > 1 ? refunds.length : undefined,
            action: { kind: 'screen', screen: 'FINANCIAL_HUB' },
        });
    }

    const rejected = listings
        .filter(l => l.state === 'rejected')
        .sort((a, b) => (parseDate(b.reviewedAt)?.getTime() ?? 0) - (parseDate(a.reviewedAt)?.getTime() ?? 0));
    if (rejected.length > 0) {
        items.push({
            id: 'rejected', tone: 'red', icon: 'rejected',
            title: `Listing rejected — “${rejected[0].title}”`,
            subtitle: rejected[0].reviewMessage ? 'Tap to read the reviewer’s note' : undefined,
            count: rejected.length,
            action: { kind: 'review', listing: rejected[0] },
        });
    }

    const unanswered = enquiries.filter(isUnanswered).length;
    if (unanswered > 0) {
        items.push({
            id: 'enquiries', tone: 'red', icon: 'message',
            title: 'Reply to pending enquiries',
            count: unanswered,
            action: { kind: 'screen', screen: 'BOOKINGS_ENQUIRIES' },
        });
    }

    const newReviews = reviews?.reviews_this_month ?? 0;
    if (newReviews > 0) {
        const rating = reviews?.avg_rating != null ? ` · rated ${reviews.avg_rating.toFixed(1)}` : '';
        items.push({
            id: 'reviews', tone: 'amber', icon: 'star',
            title: 'Respond to new reviews',
            subtitle: `${formatCount(newReviews)} new this month${rating}`,
            count: newReviews,
            action: { kind: 'screen', screen: 'REVIEWS' },
        });
    }

    // Payouts only matter for services customers pay for on TLB.
    if (scope.some(isTicketed)) {
        if (bank === null) {
            items.push({
                id: 'bank', tone: 'amber', icon: 'bank',
                title: 'Add bank details to receive payouts',
                action: { kind: 'profile', section: 'bank' },
            });
        } else if (bank?.verification_status === 'rejected') {
            items.push({
                id: 'bank', tone: 'red', icon: 'bank',
                title: 'Bank details were rejected — update them',
                subtitle: bank.verification_note || undefined,
                action: { kind: 'profile', section: 'bank' },
            });
        }
    }

    return items;
};

const buildSummary = (
    scope: EntityType[], counts: ListingCounts, enquiriesReceived: number,
    { revenue, reviews }: DashboardInputs,
): SummaryLine[] => {
    const lines: SummaryLine[] = [];
    if (scope.some(e => e === 'Classes' || e === 'Venues')) {
        lines.push({ id: 'enquiries', tone: 'red', icon: 'message', text: `${formatCount(enquiriesReceived)} enquiries received` });
    }
    if (revenue) {
        lines.push({ id: 'bookings', tone: 'green', icon: 'check', text: `${formatCount(revenue.confirmed_bookings)} bookings confirmed` });
        lines.push({ id: 'earnings', tone: 'amber', icon: 'rupee', text: `${formatRupees(toNumber(revenue.net_earnings))} after platform fee` });
    }
    lines.push({
        id: 'listings', tone: 'blue', icon: 'listings',
        text: `${formatCount(counts.live + counts.paused)} published · ${formatCount(counts.pending)} awaiting review`,
    });
    if (reviews) {
        lines.push({
            id: 'reviews', tone: 'purple', icon: 'star',
            text: reviews.total_reviews > 0
                ? `${formatCount(reviews.total_reviews)} reviews · rating ${(reviews.avg_rating ?? 0).toFixed(1)}`
                : 'No reviews yet',
        });
    }
    return lines;
};

const buildEventsSoon = (listings: PartnerListing[], now: Date): UpcomingEvent[] => {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const timeLabel = (d: Date) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

    return listings
        .filter(l => l.entityType === 'Events' && l.state === 'live')
        .map(listing => ({ listing, start: parseStart(listing.startsAt) }))
        .filter((x): x is { listing: PartnerListing; start: { date: Date; hasTime: boolean } } =>
            !!x.start && (isSameLocalDay(x.start.date, now) || isSameLocalDay(x.start.date, tomorrow)))
        .sort((a, b) => a.start.date.getTime() - b.start.date.getTime())
        .map(({ listing, start }) => ({
            listing,
            whenLabel: `${isSameLocalDay(start.date, now) ? 'Today' : 'Tomorrow'}${start.hasTime ? `, ${timeLabel(start.date)}` : ''}`,
        }));
};

// ── Entry point ─────────────────────────────────────────────────────────────

export const buildDashboardModel = (inputs: DashboardInputs): DashboardModel => {
    const { entities, listings, enquiries, range, now, revenue, bookingsToday } = inputs;
    const scope = serviceScope(entities, listings);
    const counts = countListings(listings);
    const enquiriesInRange = enquiries.filter(e => isWithinRange(parseDate(e.createdAt), range, now));

    return {
        scope,
        kpis: {
            listings: counts,
            // Received follows the period; unanswered is all-time because it's a to-do.
            enquiries: { received: enquiriesInRange.length, unanswered: enquiries.filter(isUnanswered).length },
            bookings: { confirmed: revenue ? revenue.confirmed_bookings : null, today: bookingsToday },
            revenue: {
                gross: revenue ? toNumber(revenue.gross_revenue) : null,
                sources: joinWithAmpersand(scope.filter(isTicketed)) || 'No ticketed services',
            },
        },
        performance: buildPerformance(scope, listings, enquiriesInRange, inputs),
        attention: buildAttention(scope, listings, enquiries, inputs),
        summary: buildSummary(scope, counts, enquiriesInRange.length, inputs),
        eventsSoon: buildEventsSoon(listings, now),
    };
};
