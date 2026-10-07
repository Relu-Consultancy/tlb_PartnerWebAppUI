import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { invalidatePortalSummary } from '../../../api/portalSummary';
import { useBookingsData } from '../useBookingsData';

const BASE = 'https://tlb-api.reluconsultancy.in';

const booking = (overrides: Record<string, unknown> = {}) => ({
    id: 'bk-1',
    booking_type: 'event',
    listing_id: 'l1',
    listing_title: 'Summer Fest',
    booking_reference: 'BKG-1',
    customer_name: 'Asha Rao',
    total_amount: '1100',
    status: 'confirmed',
    payment_status: 'paid',
    created_at: '2026-09-01T10:00:00Z',
    ...overrides,
});

const serveBookings = (rows: unknown[]) =>
    server.use(http.get(`${BASE}/api/v1/partner/bookings/`, () => HttpResponse.json({ success: true, data: rows, next: null })));

beforeEach(() => {
    invalidatePortalSummary();
});

describe('useBookingsData — which bookings reach the inbox', () => {
    it('keeps bookings on direct-booking classes and programs', async () => {
        // Reported live: a partner had real paid bookings showing as 0. The
        // type map only knew event/venue, so class and program bookings —
        // which exist whenever the listing is set to direct booking — were
        // dropped silently.
        serveBookings([
            booking({ id: 'bk-1', booking_type: 'class', listing_title: 'Junior Swimming' }),
            booking({ id: 'bk-2', booking_type: 'program', listing_title: 'Future Coders' }),
        ]);

        const { result } = renderHook(() => useBookingsData(['Classes', 'Programs']));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.entries).toHaveLength(2);
        expect(result.current.entries.map((e) => e.entity)).toEqual(['Classes', 'Programs']);
    });

    it('still drops a booking for a service type the partner does not offer', async () => {
        serveBookings([booking({ booking_type: 'venue' })]);

        const { result } = renderHook(() => useBookingsData(['Events']));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.entries).toHaveLength(0);
    });

    it('falls back to the listing’s own type when booking_type is missing', async () => {
        // An unfamiliar or absent booking_type must not make a real booking invisible.
        serveBookings([booking({ booking_type: undefined, listing_id: 'evt-1' })]);
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({ success: true, data: [{ id: 'evt-1', title: 'Summer Fest', status: 'published' }] })
            )
        );

        const { result } = renderHook(() => useBookingsData(['Events']));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.entries).toHaveLength(1);
        expect(result.current.entries[0].entity).toBe('Events');
    });
});

describe('useBookingsData — every backend status lands in the right bucket', () => {
    it('files a failed payment under Cancelled, with a reason, instead of Upcoming', async () => {
        serveBookings([booking({ id: 'bk-f', status: 'payment_failed', payment_status: 'pending' })]);
        const { result } = renderHook(() => useBookingsData(['Events']));
        await waitFor(() => expect(result.current.entries).toHaveLength(1));
        expect(result.current.entries[0]).toMatchObject({ status: 'cancelled', cancellationReason: 'The customer’s payment failed' });
    });

    it('treats a refunded booking as cancelled with its money returned', async () => {
        serveBookings([booking({ id: 'bk-r', status: 'refunded', payment_status: 'refunded' })]);
        const { result } = renderHook(() => useBookingsData(['Events']));
        await waitFor(() => expect(result.current.entries).toHaveLength(1));
        expect(result.current.entries[0]).toMatchObject({ status: 'cancelled', paymentStatus: 'refunded' });
    });

    it('treats a payment hold as awaiting payment', async () => {
        serveBookings([booking({ id: 'bk-h', status: 'hold', payment_status: 'pending' })]);
        const { result } = renderHook(() => useBookingsData(['Events']));
        await waitFor(() => expect(result.current.entries).toHaveLength(1));
        expect(result.current.entries[0].status).toBe('awaiting_payment');
    });

    it('keeps when and why a booking was cancelled', async () => {
        serveBookings([
            booking({
                id: 'bk-c',
                status: 'cancelled',
                payment_status: 'pending',
                cancelled_at: '2026-10-06T09:30:00Z',
                cancellation_reason: 'hold_expired',
            }),
        ]);
        const { result } = renderHook(() => useBookingsData(['Events']));
        await waitFor(() => expect(result.current.entries).toHaveLength(1));
        expect(result.current.entries[0]).toMatchObject({ cancelledAt: '2026-10-06T09:30:00Z', cancellationReason: 'hold_expired' });
    });
});

describe('useBookingsData — refund status from the list (refund_status / refund_amount)', () => {
    it('reads the refund status and amount on each row', async () => {
        serveBookings([
            booking({ id: 'r1', status: 'cancelled', payment_status: 'paid', refund_status: 'processing', refund_amount: 500 }),
            booking({ id: 'r2', status: 'cancelled', payment_status: 'paid', refund_status: 'failed', refund_amount: '750.00' }),
            booking({ id: 'r3', status: 'confirmed', payment_status: 'paid', refund_status: null, refund_amount: null }),
        ]);
        const { result } = renderHook(() => useBookingsData(['Events']));
        await waitFor(() => expect(result.current.entries).toHaveLength(3));
        const byId = Object.fromEntries(result.current.entries.map((e) => [e.id, e]));
        expect(byId.r1).toMatchObject({ refundStatus: 'processing', refundAmount: 500 });
        expect(byId.r2).toMatchObject({ refundStatus: 'failed', refundAmount: 750 });
        expect(byId.r3).toMatchObject({ refundStatus: null, refundAmount: null });
    });

    it('treats a response without the new fields as "no refund"', async () => {
        serveBookings([booking({ id: 'old', status: 'cancelled', payment_status: 'paid' })]);
        const { result } = renderHook(() => useBookingsData(['Events']));
        await waitFor(() => expect(result.current.entries).toHaveLength(1));
        expect(result.current.entries[0]).toMatchObject({ refundStatus: null, refundAmount: null });
    });

    it('reads a payment already marked refunded as a settled refund', async () => {
        serveBookings([booking({ id: 'done', status: 'cancelled', payment_status: 'refunded' })]);
        const { result } = renderHook(() => useBookingsData(['Events']));
        await waitFor(() => expect(result.current.entries).toHaveLength(1));
        expect(result.current.entries[0].refundStatus).toBe('settled');
    });

    it('a partner cancel shows the new refund at once, from the cancel response', async () => {
        serveBookings([booking({ id: 'c1', status: 'confirmed', payment_status: 'paid', total_amount: '1100' })]);
        server.use(
            http.post(`${BASE}/api/v1/partner/bookings/c1/cancel/`, () =>
                HttpResponse.json({
                    success: true,
                    data: { id: 'c1', status: 'cancelled', refund: { id: 'rf', status: 'processing', amount: 1100 } },
                })
            )
        );
        const { result } = renderHook(() => useBookingsData(['Events']));
        await waitFor(() => expect(result.current.entries).toHaveLength(1));
        await act(async () => {
            await result.current.cancel('c1', 'Venue unavailable');
        });
        expect(result.current.entries[0]).toMatchObject({ status: 'cancelled', refundStatus: 'processing', refundAmount: 1100 });
    });
});
