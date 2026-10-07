import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test/msw/server';
import { invalidatePortalSummary } from '../../../../api/portalSummary';
import { PartnerProvider } from '../../../../context/PartnerContext';
import { BookingsEnquiries } from '../../BookingsEnquiries';

const BASE = 'https://tlb-api.reluconsultancy.in';

const row = (id: string, overrides: Record<string, unknown>) => ({
    id,
    booking_type: 'event',
    listing_id: 'l1',
    listing_title: 'Summer Fest',
    booking_reference: `TLB-EV-${id}`,
    customer_name: `Customer ${id}`,
    total_amount: '500',
    status: 'cancelled',
    payment_status: 'paid',
    created_at: '2026-10-01T10:00:00Z',
    cancelled_at: '2026-10-05T10:00:00Z',
    ...overrides,
});

const serve = (rows: unknown[]) =>
    server.use(http.get(`${BASE}/api/v1/partner/bookings/`, () => HttpResponse.json({ success: true, data: rows, next: null })));

const renderScreen = (onNavigate = vi.fn()) => {
    sessionStorage.setItem('allowedEntities', JSON.stringify(['Events']));
    render(
        <PartnerProvider>
            <BookingsEnquiries onNavigate={onNavigate} />
        </PartnerProvider>
    );
    return onNavigate;
};

const openRefunds = async () => {
    await userEvent.click(await screen.findByRole('button', { name: /^Refunds/ }));
};

beforeEach(() => {
    sessionStorage.clear();
    invalidatePortalSummary();
});

describe('Bookings/Enquiries — Refunds tab', () => {
    it('shows every refund with its current status — never "Refunded" before it settles', async () => {
        serve([
            row('a', { refund_status: 'processing', refund_amount: 500 }),
            row('b', { refund_status: 'settled', refund_amount: 300, payment_status: 'refunded' }),
            row('c', { refund_status: 'failed', refund_amount: 750 }),
            row('d', { status: 'confirmed', refund_status: null, refund_amount: null, cancelled_at: null }),
        ]);
        renderScreen();
        await openRefunds();

        expect(screen.getByText('Every refund on your bookings, and where it stands right now.')).toBeInTheDocument();
        const a = screen.getByText('Customer a').closest('button')!;
        expect(within(a).getByText('Refund in progress')).toBeInTheDocument();
        expect(within(a).getByText('Usually 3–7 days')).toBeInTheDocument();
        expect(within(screen.getByText('Customer b').closest('button')!).getByText('Refunded')).toBeInTheDocument();
        expect(within(screen.getByText('Customer c').closest('button')!).getByText('Refund failed')).toBeInTheDocument();
        // A booking without a refund isn't listed.
        expect(screen.queryByText('Customer d')).not.toBeInTheDocument();
    });

    it('flags failed refunds and sends the partner to support', async () => {
        serve([row('a', { refund_status: 'processing', refund_amount: 500 }), row('c', { refund_status: 'failed', refund_amount: 750 })]);
        const onNavigate = renderScreen();
        await openRefunds();

        expect(screen.getByText(/1 refund failed/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('tab', { name: /Needs attention/ }));
        expect(screen.getByText('Customer c')).toBeInTheDocument();
        expect(screen.queryByText('Customer a')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Contact support' }));
        expect(onNavigate).toHaveBeenCalledWith('HELP_SUPPORT');
    });

    it('says so plainly when there are no refunds', async () => {
        serve([row('d', { status: 'confirmed', refund_status: null, cancelled_at: null })]);
        renderScreen();
        await openRefunds();
        expect(screen.getByText('No refunds yet')).toBeInTheDocument();
    });

    it('opens the booking detail, with its timeline, from a refund row', async () => {
        serve([row('a', { refund_status: 'processing', refund_amount: 500 })]);
        server.use(
            http.get(`${BASE}/api/v1/partner/bookings/a/`, () =>
                HttpResponse.json({
                    success: true,
                    data: {
                        id: 'a',
                        refund: {
                            id: 'rf',
                            status: 'processing',
                            amount: 500,
                            currency: 'INR',
                            requested_at: '2026-10-05T10:00:01Z',
                            settled_at: null,
                            failed_at: null,
                        },
                    },
                })
            ),
            http.get(`${BASE}/api/v1/partner/bookings/a/payment-detail/`, () => HttpResponse.json({ success: true, data: {} }))
        );
        renderScreen();
        await openRefunds();
        await userEvent.click(screen.getByText('Customer a').closest('button')!);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('the Bookings tab badge also follows the refund, not the payment', async () => {
        serve([row('a', { refund_status: 'processing', refund_amount: 500 })]);
        renderScreen();
        await userEvent.click(await screen.findByRole('button', { name: /^Bookings/ }));
        await userEvent.click(screen.getByRole('button', { name: /See 1 cancelled booking/ }));
        await userEvent.click(screen.getByRole('button', { name: /Summer Fest/ }));
        expect(screen.getByText('Refund in progress')).toBeInTheDocument();
    });
});
