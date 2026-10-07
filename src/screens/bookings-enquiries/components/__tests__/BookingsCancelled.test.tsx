import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test/msw/server';
import { BookingsPanel } from '../BookingsPanel';
import { BookingDetailModal } from '../BookingDetailModal';
import { BookingEntry } from '../../types';
import { bookingStatusMeta, cancellationReasonText } from '../../presentation';

const BASE = 'https://tlb-api.reluconsultancy.in';
const NOW = new Date(2026, 9, 6, 12, 0);

const entry = (overrides: Partial<BookingEntry> = {}): BookingEntry => ({
    id: 'b1',
    entity: 'Events',
    listingId: 'l1',
    listingTitle: 'Summer Fest',
    bookingReference: 'BKG-1',
    customerName: 'Asha Rao',
    amount: 0,
    currency: 'INR',
    status: 'cancelled',
    paymentStatus: 'pending',
    createdAt: '2026-10-05T10:00:00Z',
    listingStartsAt: '2026-10-20T18:00:00Z',
    cancelledAt: '2026-10-06T09:30:00Z',
    cancellationReason: 'listing_archived',
    refundStatus: null,
    refundAmount: null,
    ...overrides,
});

describe('a cancelled booking never looks deleted (QA: "the booking was gone")', () => {
    it('an empty Upcoming points at the cancelled booking', async () => {
        render(<BookingsPanel entries={[entry()]} availableEntities={['Events']} now={NOW} onOpen={vi.fn()} />);

        expect(screen.getByText('No bookings here')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'See 1 cancelled booking' }));
        await userEvent.click(screen.getByRole('button', { name: /Summer Fest/ }));

        expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    });

    it('the row says when and why it was cancelled', async () => {
        render(<BookingsPanel entries={[entry()]} availableEntities={['Events']} now={NOW} onOpen={vi.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: 'See 1 cancelled booking' }));
        await userEvent.click(screen.getByRole('button', { name: /Summer Fest/ }));

        expect(screen.getByText(/Cancelled 6 Oct.*Listing archived/)).toBeInTheDocument();
    });

    it('the detail view shows the backend’s reason and time', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/bookings/:id/`, () =>
                HttpResponse.json({
                    success: true,
                    data: {
                        id: 'b1',
                        status: 'cancelled',
                        cancelled_at: '2026-10-06T09:30:00Z',
                        cancellation_reason: 'Payment window expired',
                    },
                })
            ),
            http.get(`${BASE}/api/v1/partner/bookings/:id/payment-detail/`, () => HttpResponse.json({ success: true, data: {} }))
        );
        render(
            <BookingDetailModal
                entry={entry({ cancellationReason: null })}
                now={NOW}
                onClose={vi.fn()}
                onMarkAttended={vi.fn()}
                onCancelBooking={vi.fn()}
            />
        );

        await waitFor(() => expect(screen.getByText(/Reason: Payment window expired/)).toBeInTheDocument());
        expect(screen.getByText(/Cancelled .*Reason/)).toBeInTheDocument();
    });
});

describe('status labels never crash on a status nobody mapped', () => {
    it('falls back to a readable neutral label', () => {
        expect(bookingStatusMeta({ status: 'no_show' as any, paymentStatus: 'paid' })).toEqual({ label: 'No show', tone: 'neutral' });
    });

    it('reads reason codes as words and keeps free text as written', () => {
        expect(cancellationReasonText('hold_expired')).toBe('Hold expired');
        expect(cancellationReasonText('Customer asked to cancel')).toBe('Customer asked to cancel');
        expect(cancellationReasonText('  ')).toBeNull();
    });
});
