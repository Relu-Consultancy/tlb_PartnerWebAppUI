import { describe, it, expect } from 'vitest';
import { buildDashboardModel, countBookingsOn, DashboardInputs, serviceScope } from '../dashboardModel';
import { countListings, PartnerEnquiry, PartnerListing } from '../../../api/portalSummary';
import type { StatsRevenue } from '../../../api/stats';

const NOW = new Date(2026, 8, 15, 10, 0, 0); // 15 Sep 2026, 10:00 local

const listing = (overrides: Partial<PartnerListing> = {}): PartnerListing => ({
    id: overrides.id ?? Math.random().toString(36).slice(2),
    title: 'Pottery Workshop',
    entityType: 'Events',
    state: 'live',
    coverUrl: null,
    startsAt: null,
    reviewedAt: null,
    reviewMessage: '',
    ...overrides,
});

const enquiry = (overrides: Partial<PartnerEnquiry> = {}): PartnerEnquiry => ({
    id: Math.random().toString(36).slice(2),
    entityType: 'Classes',
    status: 'new',
    createdAt: NOW.toISOString(),
    ...overrides,
});

const revenue = (overrides: Partial<StatsRevenue> = {}): StatsRevenue => ({
    period: '30d',
    gross_revenue: '105910.00',
    platform_fees: '5000.00',
    refunds: '0.00',
    net_earnings: '100910.00',
    confirmed_bookings: 57,
    avg_order_value: '1800.00',
    this_month: '0',
    prev_month: '0',
    revenue_growth_pct: 0,
    revenue_by_type: [{ type: 'event', amount: '62400.00', count: 40 }, { type: 'venue', amount: '43510.00', count: 17 }],
    revenue_trend: [],
    ...overrides,
});

const inputs = (overrides: Partial<DashboardInputs> = {}): DashboardInputs => ({
    entities: ['Events', 'Classes', 'Venues'],
    range: '30d',
    now: NOW,
    partner: { status: 'approved' },
    listings: [],
    enquiries: [],
    revenue: revenue(),
    events: null,
    venues: null,
    reviews: null,
    bank: undefined,
    notifications: [],
    bookingsToday: null,
    ...overrides,
});

describe('countListings', () => {
    it('buckets by state and filters by service type', () => {
        const listings = [
            listing({ state: 'live' }), listing({ state: 'pending' }),
            listing({ state: 'rejected' }), listing({ entityType: 'Venues', state: 'live' }),
        ];
        expect(countListings(listings)).toMatchObject({ total: 4, live: 2, pending: 1, rejected: 1 });
        expect(countListings(listings, 'Venues')).toMatchObject({ total: 1, live: 1, pending: 0 });
    });
});

describe('serviceScope', () => {
    it('orders selected entities for display', () => {
        expect(serviceScope(['Classes', 'Programs', 'Events'], [])).toEqual(['Events', 'Classes', 'Programs']);
    });

    it('falls back to service types present in listings before categories sync', () => {
        expect(serviceScope([], [listing({ entityType: 'Venues' }), listing({ entityType: 'Events' })]))
            .toEqual(['Events', 'Venues']);
    });
});

describe('buildDashboardModel — KPIs', () => {
    it('counts enquiries received in the period but unanswered ones all-time', () => {
        const old = new Date(NOW.getTime() - 60 * 86_400_000).toISOString();
        const model = buildDashboardModel(inputs({
            enquiries: [
                enquiry({ status: 'new' }),
                enquiry({ status: 'contacted' }),
                enquiry({ status: 'new', createdAt: old }),
            ],
        }));
        expect(model.kpis.enquiries).toEqual({ received: 2, unanswered: 2 });
    });

    it('shows no revenue or bookings figure when revenue stats failed', () => {
        const model = buildDashboardModel(inputs({ revenue: null }));
        expect(model.kpis.revenue.gross).toBeNull();
        expect(model.kpis.bookings.confirmed).toBeNull();
    });

    it('labels revenue sources from ticketed services only', () => {
        expect(buildDashboardModel(inputs()).kpis.revenue.sources).toBe('Events & Venues');
        expect(buildDashboardModel(inputs({ entities: ['Classes'] })).kpis.revenue.sources).toBe('No ticketed services');
    });
});

describe('buildDashboardModel — performance', () => {
    it('attributes revenue by type and marks enquiry-only classes off-platform', () => {
        const model = buildDashboardModel(inputs({
            listings: [listing(), listing({ state: 'pending' }), listing({ entityType: 'Classes' })],
            enquiries: [enquiry({ status: 'new' }), enquiry({ status: 'enrolled' })],
        }));
        const events = model.performance.find(r => r.entity === 'Events')!;
        const classes = model.performance.find(r => r.entity === 'Classes')!;

        expect(model.performance.map(r => r.entity)).toEqual(['Events', 'Venues', 'Classes']);
        expect(events.revenue).toBe(62400);
        expect(events.counts).toMatchObject({ live: 1, total: 2, pending: 1 });
        expect(classes.revenue).toBeNull();
        expect(classes.demand).toEqual({ primary: '2 enquiries', secondary: '1 responded' });
    });
});

describe('buildDashboardModel — needs your attention', () => {
    it('surfaces the most recently rejected listing with the total count', () => {
        const older = listing({ title: 'Old', state: 'rejected', reviewedAt: '2026-09-01T00:00:00Z' });
        const newer = listing({ title: 'Street Photography Walk', state: 'rejected', reviewedAt: '2026-09-10T00:00:00Z' });
        const item = buildDashboardModel(inputs({ listings: [older, newer] })).attention.find(a => a.id === 'rejected')!;

        expect(item.title).toContain('Street Photography Walk');
        expect(item.count).toBe(2);
        expect(item.action).toEqual({ kind: 'review', listing: newer });
    });

    it('asks operating-but-unverified partners to submit documents', () => {
        const model = buildDashboardModel(inputs({ partner: { status: 'activated_limited' } }));
        expect(model.attention[0]).toMatchObject({ id: 'verification', action: { kind: 'screen', screen: 'AGREEMENT_SUBMIT' } });
    });

    it('only nudges for bank details when they are known to be missing', () => {
        expect(buildDashboardModel(inputs({ bank: undefined })).attention.some(a => a.id === 'bank')).toBe(false);
        expect(buildDashboardModel(inputs({ bank: null })).attention.find(a => a.id === 'bank')?.action)
            .toEqual({ kind: 'profile', section: 'bank' });
        expect(buildDashboardModel(inputs({ bank: null, entities: ['Classes'] })).attention.some(a => a.id === 'bank')).toBe(false);
    });

    it('is empty when nothing needs action', () => {
        expect(buildDashboardModel(inputs()).attention).toEqual([]);
    });
});

describe('buildDashboardModel — events live today or tomorrow', () => {
    it('includes live events starting today or tomorrow, soonest first', () => {
        const model = buildDashboardModel(inputs({
            listings: [
                listing({ id: 'tomorrow', startsAt: '2026-09-16' }),
                listing({ id: 'today', startsAt: new Date(2026, 8, 15, 18, 0).toISOString() }),
                listing({ id: 'next-week', startsAt: '2026-09-22' }),
                listing({ id: 'paused', state: 'paused', startsAt: '2026-09-15' }),
            ],
        }));
        expect(model.eventsSoon.map(e => e.listing.id)).toEqual(['today', 'tomorrow']);
        expect(model.eventsSoon[0].whenLabel).toMatch(/^Today, /);
        expect(model.eventsSoon[1].whenLabel).toBe('Tomorrow');
    });
});

describe('countBookingsOn', () => {
    it('counts bookings created on the given local day', () => {
        const bookings = [
            { created_at: new Date(2026, 8, 15, 9, 0).toISOString() },
            { booked_at: new Date(2026, 8, 15, 1, 0).toISOString() },
            { created_at: new Date(2026, 8, 14, 23, 0).toISOString() },
            { created_at: null },
        ];
        expect(countBookingsOn(bookings, NOW)).toBe(2);
    });
});
