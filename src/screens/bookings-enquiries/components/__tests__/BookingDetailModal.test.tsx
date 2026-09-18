import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test/msw/server';
import { BookingDetailModal } from '../BookingDetailModal';
import { BookingEntry } from '../../types';

const BASE = 'https://tlb-api.reluconsultancy.in';

const entry = (overrides: Partial<BookingEntry> = {}): BookingEntry => ({
    id: 'b1', entity: 'Events', listingId: 'l1', listingTitle: 'Summer Fest',
    bookingReference: 'BKG-1', customerName: 'Asha Rao', amount: 1100, currency: 'INR',
    status: 'confirmed', paymentStatus: 'paid', createdAt: '2026-08-10T00:00:00Z', listingStartsAt: null,
    ...overrides,
});

const mockOnMarkAttended = vi.fn().mockResolvedValue(true);
const mockOnCancelBooking = vi.fn();
const mockOnClose = vi.fn();

const renderModal = (e: BookingEntry) => render(
    <BookingDetailModal entry={e} now={new Date('2026-09-01')} onClose={mockOnClose} onMarkAttended={mockOnMarkAttended} onCancelBooking={mockOnCancelBooking} />
);

// A single, always-installed handler that reads a mutable fixture per test — avoids relying on
// MSW runtime-handler override ordering between `beforeEach` and a per-test `server.use()` for
// the exact same route, which is ambiguous to reason about.
let bookingDetailData: Record<string, unknown> = { customer_phone: '9876543210', customer_email: 'asha@example.com' };

beforeEach(() => {
    mockOnCancelBooking.mockReset();
    bookingDetailData = { customer_phone: '9876543210', customer_email: 'asha@example.com' };
    server.use(
        http.get(`${BASE}/api/v1/partner/bookings/:id/`, () => HttpResponse.json({ success: true, data: bookingDetailData })),
        http.get(`${BASE}/api/v1/partner/bookings/:id/payment-detail/`, () => HttpResponse.json({ success: true, data: {} })),
    );
});

describe('BookingDetailModal — refund tracking', () => {
    it('shows a real "Refund in progress" state, not "Refunded", while a refund is processing', async () => {
        bookingDetailData = {
            customer_phone: '9876543210', customer_email: 'asha@example.com',
            refund: { id: 'r1', status: 'processing', amount: 1100, currency: 'INR', requested_at: '2026-08-20T10:00:00Z', settled_at: null, failed_at: null },
        };
        renderModal(entry({ status: 'cancelled', paymentStatus: 'refunded' }));
        // Shown twice by design: the header badge and the detail note both reflect the real,
        // authoritative refund status now (previously the header badge lagged, showing "Refunded").
        await waitFor(() => expect(screen.getAllByText('Refund in progress').length).toBeGreaterThanOrEqual(2));
        expect(screen.getByText(/usually settles in 3–7 days/i)).toBeInTheDocument();
        expect(screen.queryByText('Refunded')).not.toBeInTheDocument();
    });

    it('shows "Refunded" only once the refund has actually settled', async () => {
        bookingDetailData = {
            refund: { id: 'r1', status: 'settled', amount: 1100, currency: 'INR', requested_at: '2026-08-20T10:00:00Z', settled_at: '2026-08-22T10:00:00Z', failed_at: null },
        };
        renderModal(entry({ status: 'cancelled', paymentStatus: 'refunded' }));
        await waitFor(() => expect(screen.getAllByText('Refunded').length).toBeGreaterThanOrEqual(2));
    });

    it('shows an honest "no refund was initiated" state when a cancelled booking has none', async () => {
        renderModal(entry({ status: 'cancelled', paymentStatus: 'paid' }));
        await waitFor(() => expect(screen.getByText(/no refund was initiated/i)).toBeInTheDocument());
    });
});

describe('BookingDetailModal — cancel & refund action', () => {
    it('only shows Cancel & refund for a confirmed, paid booking', async () => {
        renderModal(entry({ status: 'attended', paymentStatus: 'paid' }));
        await waitFor(() => screen.getByText('Call customer'));
        expect(screen.queryByRole('button', { name: /cancel & refund/i })).not.toBeInTheDocument();
    });

    it('requires a reason before confirming cancellation', async () => {
        renderModal(entry());
        const user = userEvent.setup();
        await waitFor(() => screen.getByRole('button', { name: /cancel & refund/i }));
        await user.click(screen.getByRole('button', { name: /cancel & refund/i }));
        await user.click(screen.getByRole('button', { name: /confirm cancellation/i }));
        expect(await screen.findByText(/please add a short reason/i)).toBeInTheDocument();
        expect(mockOnCancelBooking).not.toHaveBeenCalled();
    });

    it('calls onCancelBooking with the typed reason and closes the form on success', async () => {
        mockOnCancelBooking.mockResolvedValue({ success: true });
        renderModal(entry());
        const user = userEvent.setup();
        await waitFor(() => screen.getByRole('button', { name: /cancel & refund/i }));
        await user.click(screen.getByRole('button', { name: /cancel & refund/i }));
        await user.type(screen.getByPlaceholderText(/event rescheduled/i), 'Customer requested');
        await user.click(screen.getByRole('button', { name: /confirm cancellation/i }));
        await waitFor(() => expect(mockOnCancelBooking).toHaveBeenCalledWith('b1', 'Customer requested'));
        await waitFor(() => expect(screen.queryByRole('button', { name: /confirm cancellation/i })).not.toBeInTheDocument());
    });

    it('shows the exact plain-language copy for CANCELLATION_DEADLINE_PASSED instead of a raw error', async () => {
        mockOnCancelBooking.mockResolvedValue({ success: false, code: 'CANCELLATION_DEADLINE_PASSED', message: 'Cancellation deadline passed.' });
        renderModal(entry());
        const user = userEvent.setup();
        await waitFor(() => screen.getByRole('button', { name: /cancel & refund/i }));
        await user.click(screen.getByRole('button', { name: /cancel & refund/i }));
        await user.type(screen.getByPlaceholderText(/event rescheduled/i), 'Trying anyway');
        await user.click(screen.getByRole('button', { name: /confirm cancellation/i }));
        expect(await screen.findByText(/no override for partners/i)).toBeInTheDocument();
    });
});
