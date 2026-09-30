import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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
