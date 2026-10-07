import { describe, it, expect } from 'vitest';
import {
    bookingStats,
    bookingWhenOf,
    enquiryStageOf,
    enquiryStats,
    filterBookings,
    filterEnquiries,
    filterRefunds,
    groupByListing,
    refundSummary,
    slotLabelOf,
    soonBookings,
    startsWithinADay,
} from '../model';
import { bookingStatusMeta } from '../presentation';
import { BookingEntry, EnquiryEntry } from '../types';

const NOW = new Date(2026, 8, 15, 10, 0, 0); // 15 Sep 2026, 10:00 local

const enquiry = (overrides: Partial<EnquiryEntry> = {}): EnquiryEntry => ({
    id: overrides.id ?? Math.random().toString(36).slice(2),
    entity: 'Classes',
    listingId: 'l1',
    listingTitle: 'Pottery Term',
    name: 'Neha Rao',
    detail: '',
    contact: 'Hidden',
    isUnlocked: false,
    status: 'new',
    message: '',
    notes: '',
    createdAt: NOW.toISOString(),
    ...overrides,
});

const booking = (overrides: Partial<BookingEntry> = {}): BookingEntry => ({
    id: overrides.id ?? Math.random().toString(36).slice(2),
    entity: 'Events',
    listingId: 'l1',
    listingTitle: 'Sketching Walk',
    bookingReference: 'BKG-1',
    customerName: 'Meera Joshi',
    amount: 1800,
    currency: 'INR',
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: NOW.toISOString(),
    listingStartsAt: null,
    cancelledAt: null,
    cancellationReason: null,
    refundStatus: null,
    refundAmount: null,
    ...overrides,
});

describe('enquiryStageOf', () => {
    it('buckets "new" as the only unanswered stage', () => {
        expect(enquiryStageOf(enquiry({ status: 'new' }))).toBe('new');
        expect(enquiryStageOf(enquiry({ status: 'contacted' }))).toBe('responded');
        expect(enquiryStageOf(enquiry({ status: 'closed' }))).toBe('responded');
    });
});

describe('bookingWhenOf', () => {
    it('is cancelled regardless of listing date', () => {
        expect(bookingWhenOf(booking({ status: 'cancelled', listingStartsAt: NOW.toISOString() }), NOW)).toBe('cancelled');
    });
    it('buckets by the listing schedule, defaulting unknown dates to upcoming', () => {
        expect(bookingWhenOf(booking({ listingStartsAt: new Date(2026, 8, 15, 18, 0).toISOString() }), NOW)).toBe('today');
        expect(bookingWhenOf(booking({ listingStartsAt: '2026-09-20' }), NOW)).toBe('upcoming');
        expect(bookingWhenOf(booking({ listingStartsAt: '2026-09-01' }), NOW)).toBe('past');
        expect(bookingWhenOf(booking({ listingStartsAt: null }), NOW)).toBe('upcoming');
    });
});

describe('startsWithinADay', () => {
    it('is true for today and tomorrow, false further out', () => {
        expect(startsWithinADay(new Date(2026, 8, 15, 20, 0).toISOString(), NOW)).toBe(true);
        expect(startsWithinADay(new Date(2026, 8, 16, 9, 0).toISOString(), NOW)).toBe(true);
        expect(startsWithinADay(new Date(2026, 8, 18, 9, 0).toISOString(), NOW)).toBe(false);
        expect(startsWithinADay(null, NOW)).toBe(false);
    });
});

describe('slotLabelOf', () => {
    it('labels today, tomorrow and other dates distinctly', () => {
        expect(slotLabelOf(new Date(2026, 8, 15, 19, 0).toISOString(), NOW)).toMatch(/^Today /);
        expect(slotLabelOf(new Date(2026, 8, 16, 16, 0).toISOString(), NOW)).toMatch(/^Tomorrow /);
        const farOut = slotLabelOf(new Date(2026, 8, 22, 7, 0).toISOString(), NOW);
        expect(farOut).not.toMatch(/^(Today|Tomorrow)/);
        expect(farOut).toContain('22');
        expect(slotLabelOf(null, NOW)).toBe('—');
    });
});

describe('groupByListing', () => {
    it("groups in first-seen order and preserves each group's entity", () => {
        const rows = [
            enquiry({ id: 'a', listingId: 'l1', listingTitle: 'Pottery' }),
            enquiry({ id: 'b', listingId: 'l2', listingTitle: 'Creative Studio', entity: 'Venues' }),
            enquiry({ id: 'c', listingId: 'l1', listingTitle: 'Pottery' }),
        ];
        const groups = groupByListing(rows);
        expect(groups.map((g) => g.listingId)).toEqual(['l1', 'l2']);
        expect(groups[0].rows.map((r) => r.id)).toEqual(['a', 'c']);
        expect(groups[1].entity).toBe('Venues');
    });
});

describe('filterEnquiries', () => {
    const rows = [
        enquiry({ id: 'a', status: 'new', entity: 'Classes', name: 'Neha Rao' }),
        enquiry({ id: 'b', status: 'contacted', entity: 'Venues', name: 'Karthik Menon' }),
        enquiry({ id: 'c', status: 'new', entity: 'Venues', name: 'Divya Suresh' }),
    ];
    it('filters by stage and scope', () => {
        expect(filterEnquiries(rows, { stage: 'new', scope: 'all', search: '' }).map((r) => r.id)).toEqual(['a', 'c']);
        expect(filterEnquiries(rows, { stage: 'new', scope: 'Venues', search: '' }).map((r) => r.id)).toEqual(['c']);
    });
    it('searches name, listing title and contact, case-insensitively', () => {
        expect(filterEnquiries(rows, { stage: 'new', scope: 'all', search: 'neha' }).map((r) => r.id)).toEqual(['a']);
        expect(filterEnquiries(rows, { stage: 'responded', scope: 'all', search: 'nobody' })).toEqual([]);
    });
});

describe('enquiryStats', () => {
    it('counts total / to-respond / responded and per-entity totals', () => {
        const stats = enquiryStats([
            enquiry({ status: 'new', entity: 'Classes' }),
            enquiry({ status: 'new', entity: 'Venues' }),
            enquiry({ status: 'closed', entity: 'Venues' }),
        ]);
        expect(stats).toMatchObject({ total: 3, toRespond: 2, responded: 1, byEntity: { Classes: 1, Programs: 0, Venues: 2 } });
    });
});

describe('filterBookings', () => {
    const rows = [
        booking({ id: 'a', entity: 'Events', customerName: 'Meera Joshi', listingStartsAt: NOW.toISOString() }),
        booking({ id: 'b', entity: 'Venues', customerName: 'Rahul Nayak', listingStartsAt: NOW.toISOString() }),
        booking({ id: 'c', entity: 'Events', customerName: 'Aditya Rao', status: 'cancelled' }),
    ];
    it('filters by when and scope', () => {
        expect(filterBookings(rows, { when: 'today', scope: 'all', search: '' }, NOW).map((r) => r.id)).toEqual(['a', 'b']);
        expect(filterBookings(rows, { when: 'today', scope: 'Venues', search: '' }, NOW).map((r) => r.id)).toEqual(['b']);
        expect(filterBookings(rows, { when: 'cancelled', scope: 'all', search: '' }, NOW).map((r) => r.id)).toEqual(['c']);
    });
    it('searches customer, listing and booking reference', () => {
        expect(filterBookings(rows, { when: 'today', scope: 'all', search: 'meera' }, NOW).map((r) => r.id)).toEqual(['a']);
    });
});

describe('bookingStats', () => {
    it('computes value, average, cancellation rate and refunds from settled/cancelled rows only', () => {
        const stats = bookingStats([
            booking({ status: 'confirmed', amount: 2000 }),
            booking({ status: 'attended', amount: 1000 }),
            booking({ status: 'cancelled', paymentStatus: 'refunded', refundStatus: 'settled', refundAmount: 500, amount: 500 }),
            // Mid-refund: payment_status still says "paid" — it must not count as refunded.
            booking({ status: 'cancelled', paymentStatus: 'paid', refundStatus: 'processing', refundAmount: 900, amount: 900 }),
        ]);
        expect(stats.confirmedCount).toBe(2);
        expect(stats.bookingValue).toBe(3000);
        expect(stats.averageValue).toBe(1500);
        expect(stats.cancelledCount).toBe(2);
        expect(stats.cancelledPct).toBe(50);
        expect(stats.refundedAmount).toBe(500);
        expect(stats.refundedCount).toBe(1);
    });

    it('never divides by zero on an empty list', () => {
        const stats = bookingStats([]);
        expect(stats.averageValue).toBe(0);
        expect(stats.cancelledPct).toBe(0);
    });
});

describe('soonBookings', () => {
    it('counts today vs tomorrow and excludes cancelled bookings', () => {
        const summary = soonBookings(
            [
                booking({ id: 'a', listingStartsAt: new Date(2026, 8, 15, 18, 0).toISOString() }),
                booking({ id: 'b', listingStartsAt: new Date(2026, 8, 16, 7, 0).toISOString() }),
                booking({ id: 'c', listingStartsAt: new Date(2026, 8, 15, 12, 0).toISOString(), status: 'cancelled' }),
                booking({ id: 'd', listingStartsAt: '2026-09-25' }),
            ],
            NOW
        );
        expect(summary.todayCount).toBe(1);
        expect(summary.tomorrowCount).toBe(1);
        expect(summary.rows.map((r) => r.id)).toEqual(['a', 'b']);
    });
});

describe('refunds', () => {
    const r = (id: string, refundStatus: any, refundAmount: number | null, cancelledAt: string) =>
        booking({ id, status: 'cancelled', paymentStatus: 'paid', refundStatus, refundAmount, cancelledAt, amount: 999 });
    const rows = [
        r('settled-old', 'settled', 300, '2026-10-01T10:00:00Z'),
        r('progress', 'processing', 500, '2026-10-05T10:00:00Z'),
        r('requested', 'requested', 200, '2026-10-06T10:00:00Z'),
        r('failed', 'failed', 750, '2026-10-02T10:00:00Z'),
        booking({ id: 'active', status: 'confirmed', refundStatus: null, refundAmount: null }),
    ];

    it('sums each state — requested and processing are both "in progress"', () => {
        expect(refundSummary(rows)).toEqual({
            attention: { count: 1, amount: 750 },
            in_progress: { count: 2, amount: 700 },
            settled: { count: 1, amount: 300 },
            total: 4,
        });
    });

    it('lists failed first, then in progress, then settled — newest first within each — and never a booking without a refund', () => {
        expect(filterRefunds(rows, 'all').map((e) => e.id)).toEqual(['failed', 'requested', 'progress', 'settled-old']);
        expect(filterRefunds(rows, 'attention').map((e) => e.id)).toEqual(['failed']);
        expect(filterRefunds(rows, 'in_progress').map((e) => e.id)).toEqual(['requested', 'progress']);
    });

    it('drives the badge from the refund status, not the payment status', () => {
        // Mid-refund the payment still says "paid" — the badge must not read as a normal booking.
        expect(bookingStatusMeta({ status: 'cancelled', paymentStatus: 'paid', refundStatus: 'processing' }).label).toBe(
            'Refund in progress'
        );
        expect(bookingStatusMeta({ status: 'cancelled', paymentStatus: 'paid', refundStatus: 'requested' }).label).toBe(
            'Refund in progress'
        );
        expect(bookingStatusMeta({ status: 'cancelled', paymentStatus: 'refunded', refundStatus: 'settled' }).label).toBe('Refunded');
        expect(bookingStatusMeta({ status: 'cancelled', paymentStatus: 'paid', refundStatus: 'failed' })).toEqual({
            label: 'Refund failed',
            tone: 'red',
        });
        expect(bookingStatusMeta({ status: 'cancelled', paymentStatus: 'paid', refundStatus: null }).label).toBe('Cancelled');
    });
});
