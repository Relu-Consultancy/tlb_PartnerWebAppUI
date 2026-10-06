import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { Support } from '../Support';

const BASE = 'https://tlb-api.reluconsultancy.in';
const BOOKING_REFUSAL = { error: { code: 'VALIDATION_ERROR', message: 'No booking found or does not belong to you.' } };

// The live categories endpoint lists "Event Review" first — the old default.
const CATEGORIES = [
    { value: 'event_review', label: 'Event Review' },
    { value: 'booking_issue', label: 'Booking Issue' },
    { value: 'other', label: 'Other' },
];

const TICKET = { id: 't-1', subject: 'Payout delayed', category: 'other', status: 'open', created_at: '2026-10-01T10:00:00Z' };

let posted: Record<string, unknown>[];
let categoriesServed: boolean;

const serve = (onCreate: (body: Record<string, unknown>) => Response) =>
    server.use(
        http.get(`${BASE}/api/v1/help/tickets/list/`, () => HttpResponse.json({ success: true, data: [] })),
        http.get(`${BASE}/api/v1/help/partner/shared-tickets/`, () => HttpResponse.json({ success: true, data: [] })),
        http.get(`${BASE}/api/v1/help/tickets/categories/`, () => {
            categoriesServed = true;
            return HttpResponse.json({ success: true, data: CATEGORIES });
        }),
        http.get(`${BASE}/api/v1/partner/bookings/`, () =>
            HttpResponse.json({ success: true, data: [{ id: 'b-42', booking_reference: 'TLB-0042' }] })
        ),
        http.get(`${BASE}/api/v1/help/tickets/:id/messages/`, () => HttpResponse.json({ success: true, data: { messages: [] } })),
        http.get(`${BASE}/api/v1/help/tickets/:id/`, () => HttpResponse.json({ success: true, data: TICKET })),
        http.post(`${BASE}/api/v1/help/tickets/`, async ({ request }) => {
            const body = (await request.json()) as Record<string, unknown>;
            posted.push(body);
            return onCreate(body);
        })
    );

const created = () => HttpResponse.json({ success: true, data: TICKET }, { status: 201 });

async function openFormAndFill() {
    render(<Support onNavigate={vi.fn()} onOpenSidebar={vi.fn()} />);
    // Categories must have loaded before the form picks its default.
    await waitFor(() => expect(categoriesServed).toBe(true));
    await screen.findAllByRole('button', { name: /New Ticket/i });
    await userEvent.click(screen.getAllByRole('button', { name: /New Ticket/i })[0]);
    await userEvent.type(screen.getByPlaceholderText('Brief summary of your issue'), 'Payout delayed');
    await userEvent.type(screen.getByPlaceholderText(/Describe the issue in detail/), 'My payout has not arrived.');
}

const pick = async (label: string, option: string) => {
    await userEvent.click(screen.getByRole('button', { name: label }));
    await userEvent.click(await screen.findByRole('option', { name: option }));
};

beforeEach(() => {
    posted = [];
    categoriesServed = false;
    // jsdom has no scrollIntoView; the Select menu and the thread view call it.
    Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
    delete (Element.prototype as any).scrollIntoView;
});

describe('Support — raising a ticket', () => {
    it('raises a ticket from just a subject and description, under a general category', async () => {
        serve((body) => (body.category === 'event_review' ? HttpResponse.json(BOOKING_REFUSAL, { status: 400 }) : created()));
        await openFormAndFill();

        await userEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }));

        await waitFor(() => expect(posted).toHaveLength(1));
        // The form used to default to the server's first category ("Event Review"),
        // which the backend ties to a booking — hence "No booking found…".
        expect(posted[0].category).toBe('other');
        expect(posted[0]).not.toHaveProperty('booking_id');
        expect(screen.queryByText(/No booking found/i)).not.toBeInTheDocument();
    });

    it('explains a booking-only category instead of showing the raw refusal, and offers the booking picker', async () => {
        serve((body) =>
            body.category === 'event_review' && !body.booking_id ? HttpResponse.json(BOOKING_REFUSAL, { status: 400 }) : created()
        );
        await openFormAndFill();
        await pick('Ticket category', 'Listing Review');
        expect(screen.queryByRole('button', { name: 'Related booking' })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }));

        expect(await screen.findByText(/This category is about a specific booking/i)).toBeInTheDocument();
        expect(screen.queryByText(/No booking found/i)).not.toBeInTheDocument();

        // The picker now shows for this category, and its booking is sent.
        await pick('Related booking', 'TLB-0042');
        await userEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }));
        await waitFor(() => expect(posted).toHaveLength(2));
        expect(posted[1]).toMatchObject({ category: 'event_review', booking_id: 'b-42' });
    });

    it('still raises the ticket when the backend refuses the linked booking, keeping its reference in the description', async () => {
        serve((body) => (body.booking_id ? HttpResponse.json(BOOKING_REFUSAL, { status: 400 }) : created()));
        await openFormAndFill();
        await pick('Ticket category', 'Bookings Issue');
        await pick('Related booking', 'TLB-0042');

        await userEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }));

        await waitFor(() => expect(posted).toHaveLength(2));
        expect(posted[1]).not.toHaveProperty('booking_id');
        expect(posted[1].body).toContain('Related booking: TLB-0042');
        expect(screen.queryByText(/No booking found/i)).not.toBeInTheDocument();
    });
});
