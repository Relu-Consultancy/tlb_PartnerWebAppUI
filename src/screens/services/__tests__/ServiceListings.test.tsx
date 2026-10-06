import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { DRAFT_ID } from '../../../test/msw/handlers';
import { ServiceListings } from '../ServiceListings';
import { PartnerProvider } from '../../../context/PartnerContext';
import { getCurrentDraftId } from '../../../api/listings';
import { toast } from '../../../components/ui';

const BASE = 'https://tlb-api.reluconsultancy.in';

const mockNavigate = vi.fn();

function renderWithPartner(allowedEntities: string[] = ['Events']) {
    sessionStorage.setItem('allowedEntities', JSON.stringify(allowedEntities));
    return render(
        <PartnerProvider>
            <ServiceListings onNavigate={mockNavigate} />
        </PartnerProvider>
    );
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('ServiceListings — loading and error states', () => {
    it('shows a skeleton loader initially', () => {
        renderWithPartner();
        expect(document.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('shows an error message when every service type fails to load', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Listings unavailable' } }, { status: 500 })
            )
        );
        renderWithPartner();
        await waitFor(() => expect(screen.getByText(/listings unavailable/i)).toBeInTheDocument());
    });
});

describe('ServiceListings — listing display', () => {
    it('shows the listing title, a synthesized code, and its status', async () => {
        renderWithPartner();
        await waitFor(() => expect(screen.getByText('Test Event')).toBeInTheDocument());
        expect(screen.getByText(/^LST-\d{6}$/)).toBeInTheDocument();
        // "Draft" also labels a stats tile, so at least one match is the row's own status pill.
        expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
    });

    it('shows an empty state when no listings match the filters', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () => HttpResponse.json({ success: true, data: [] })));
        renderWithPartner();
        await waitFor(() => expect(screen.getByText(/no listings match/i)).toBeInTheDocument());
    });

    it('shows the My listings heading', async () => {
        renderWithPartner();
        await waitFor(() => expect(screen.getByRole('heading', { name: 'My listings' })).toBeInTheDocument());
    });
});

describe('ServiceListings — service scope', () => {
    it('filters to only the selected service type', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({ success: true, data: [{ id: '1', title: 'My Event', status: 'draft', listing_type: 'event' }] })
            ),
            http.get(`${BASE}/api/v1/partner/listings/classes/`, () =>
                HttpResponse.json({ success: true, data: [{ id: '2', title: 'My Class', status: 'draft', listing_type: 'class' }] })
            )
        );
        renderWithPartner(['Events', 'Classes']);
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('My Event'));
        await waitFor(() => screen.getByText('My Class'));

        await user.click(screen.getByRole('tab', { name: /^Events/ }));
        expect(screen.getByText('My Event')).toBeInTheDocument();
        expect(screen.queryByText('My Class')).not.toBeInTheDocument();
    });
});

describe('ServiceListings — search', () => {
    it('filters listings by title', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({
                    success: true,
                    data: [
                        { id: '1', title: 'Summer Art Festival', status: 'draft', listing_type: 'event' },
                        { id: '2', title: 'Winter Dance Camp', status: 'draft', listing_type: 'event' },
                    ],
                })
            )
        );
        renderWithPartner();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Summer Art Festival'));
        await user.type(screen.getByPlaceholderText(/search listings/i), 'Winter');
        expect(screen.queryByText('Summer Art Festival')).not.toBeInTheDocument();
        expect(screen.getByText('Winter Dance Camp')).toBeInTheDocument();
    });
});

describe('ServiceListings — refundable tag', () => {
    it('shows a Non-refundable badge once enrichment resolves a listing with is_refundable: false', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/`, () =>
                HttpResponse.json({
                    success: true,
                    data: { id: DRAFT_ID, listing_type: 'event', title: 'Test Event', is_refundable: false },
                })
            )
        );
        renderWithPartner();
        await waitFor(() => expect(screen.getByText('Non-refundable')).toBeInTheDocument());
    });

    it('shows no refund badge on the row for a refundable (default) listing', async () => {
        renderWithPartner();
        await waitFor(() => screen.getByText('Test Event'));
        expect(screen.queryByText('Non-refundable')).not.toBeInTheDocument();
        expect(screen.queryByText('Refundable')).not.toBeInTheDocument();
    });
});

describe('ServiceListings — edit and create navigation', () => {
    it('sets the draft id and navigates to CREATE_EVENT_DETAILS on Edit', async () => {
        renderWithPartner();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Test Event'));
        await user.click(screen.getByRole('button', { name: 'Edit' }));
        expect(getCurrentDraftId()).toBe(DRAFT_ID);
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_DETAILS');
    });

    it('lifts the archive before opening the wizard, since archived listings are locked server-side', async () => {
        let unarchived = false;
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({
                    success: true,
                    data: [{ id: DRAFT_ID, title: 'Archived Event', status: 'archived', listing_type: 'event' }],
                })
            ),
            http.post(`${BASE}/api/v1/partner/listings/${DRAFT_ID}/unarchive/`, () => {
                unarchived = true;
                return HttpResponse.json({ success: true, data: { id: DRAFT_ID, status: 'draft' } });
            })
        );
        renderWithPartner();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'Edit' }));
        await waitFor(() => expect(unarchived).toBe(true));
        expect(getCurrentDraftId()).toBe(DRAFT_ID);
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_DETAILS');
    });

    it('stays put when the unarchive fails, instead of opening a wizard that cannot save', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({
                    success: true,
                    data: [{ id: DRAFT_ID, title: 'Archived Event', status: 'archived', listing_type: 'event' }],
                })
            ),
            http.post(`${BASE}/api/v1/partner/listings/${DRAFT_ID}/unarchive/`, () =>
                HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Not editable' } }, { status: 400 })
            )
        );
        const toastError = vi.spyOn(toast, 'error');
        renderWithPartner();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'Edit' }));
        await waitFor(() => expect(toastError).toHaveBeenCalled());
        expect(mockNavigate).not.toHaveBeenCalledWith('CREATE_EVENT_DETAILS');
        toastError.mockRestore();
    });

    it('offers Edit — not Archive — for an archived listing', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({
                    success: true,
                    data: [{ id: DRAFT_ID, title: 'Archived Event', status: 'archived', listing_type: 'event' }],
                })
            )
        );
        renderWithPartner();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
    });

    it('offers Archive instead of Edit while a listing is live', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({
                    success: true,
                    data: [{ id: DRAFT_ID, title: 'Live Event', status: 'published', is_paused: false, listing_type: 'event' }],
                })
            )
        );
        renderWithPartner();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    });

    it('offers neither Edit nor Archive while a listing is pending review', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({
                    success: true,
                    data: [{ id: DRAFT_ID, title: 'Pending Event', status: 'pending', listing_type: 'event' }],
                })
            )
        );
        renderWithPartner();
        await waitFor(() => screen.getByText('Pending Event'));
        expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    });

    it('swaps Archive for Edit once the live listing is archived', async () => {
        let bookingsServed = false;
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({
                    success: true,
                    data: [{ id: DRAFT_ID, title: 'Live Event', status: 'published', is_paused: false, listing_type: 'event' }],
                })
            ),
            http.get(`${BASE}/api/v1/partner/bookings/`, () => {
                bookingsServed = true;
                return HttpResponse.json({ success: true, data: [], next: null });
            }),
            http.post(`${BASE}/api/v1/partner/listings/${DRAFT_ID}/archive/`, () =>
                HttpResponse.json({ success: true, data: { status: 'archived' } })
            )
        );
        renderWithPartner();
        const user = userEvent.setup();
        const archive = await screen.findByRole('button', { name: 'Archive' });
        // No bookings on it — once that's known, archiving needs no warning.
        await waitFor(() => expect(bookingsServed).toBe(true));
        await new Promise((r) => setTimeout(r, 50));
        await user.click(archive);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument());
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('navigates straight to the wizard when only one service type is allowed', async () => {
        renderWithPartner(['Events']);
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Test Event'));
        await user.click(screen.getByRole('button', { name: '+ New listing' }));
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_DETAILS');
    });
});

describe('ServiceListings — warns before taking a listing with bookings off sale (QA: archive + edit cancelled a booking)', () => {
    const liveEvent = { id: DRAFT_ID, title: 'Live Event', status: 'published', is_paused: false, listing_type: 'event' };
    const archivedEvent = { id: DRAFT_ID, title: 'Archived Event', status: 'archived', listing_type: 'event' };
    const booking = (overrides: Record<string, unknown> = {}) => ({
        id: 'bk-1',
        booking_type: 'event',
        listing_id: DRAFT_ID,
        listing_title: 'Live Event',
        booking_reference: 'BKG-1',
        customer_name: 'Asha Rao',
        total_amount: '500',
        status: 'confirmed',
        payment_status: 'paid',
        created_at: '2026-10-01T10:00:00Z',
        ...overrides,
    });

    const serve = (listing: object, bookings: object[]) => {
        const calls = { archive: 0, unarchive: 0, bookingsServed: false };
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () => HttpResponse.json({ success: true, data: [listing] })),
            http.get(`${BASE}/api/v1/partner/bookings/`, () => {
                calls.bookingsServed = true;
                return HttpResponse.json({ success: true, data: bookings, next: null });
            }),
            http.post(`${BASE}/api/v1/partner/listings/${DRAFT_ID}/archive/`, () => {
                calls.archive += 1;
                return HttpResponse.json({ success: true, data: { status: 'archived' } });
            }),
            http.post(`${BASE}/api/v1/partner/listings/${DRAFT_ID}/unarchive/`, () => {
                calls.unarchive += 1;
                return HttpResponse.json({ success: true, data: { id: DRAFT_ID, status: 'draft' } });
            })
        );
        return calls;
    };

    const ready = async (calls: { bookingsServed: boolean }, buttonName: string) => {
        const button = await screen.findByRole('button', { name: buttonName });
        await waitFor(() => expect(calls.bookingsServed).toBe(true));
        await new Promise((r) => setTimeout(r, 50));
        return button;
    };

    it('asks before archiving, says how many customers, and archives nothing until confirmed', async () => {
        const calls = serve(liveEvent, [booking()]);
        renderWithPartner();
        const user = userEvent.setup();
        await user.click(await ready(calls, 'Archive'));

        const dialog = await screen.findByRole('dialog', { name: 'Archive this listing?' });
        expect(dialog).toHaveTextContent('1 customer has an active booking on Live Event');
        expect(dialog).toHaveTextContent('can cancel those bookings');
        expect(calls.archive).toBe(0);

        await user.click(screen.getByRole('button', { name: 'Keep it live' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(calls.archive).toBe(0);

        await user.click(screen.getByRole('button', { name: 'Archive' }));
        await user.click(await screen.findByRole('button', { name: 'Archive anyway' }));
        await waitFor(() => expect(calls.archive).toBe(1));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument());
    });

    it('counts only live bookings on this listing — cancelled ones and other listings do not trigger it', async () => {
        const calls = serve(liveEvent, [booking({ status: 'cancelled' }), booking({ id: 'bk-2', listing_id: 'other-listing' })]);
        renderWithPartner();
        const user = userEvent.setup();
        await user.click(await ready(calls, 'Archive'));

        await waitFor(() => expect(calls.archive).toBe(1));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('asks before Edit moves an archived listing that still has bookings back to draft', async () => {
        const calls = serve(archivedEvent, [
            booking({ listing_title: 'Archived Event', status: 'awaiting_payment', payment_status: 'pending' }),
        ]);
        renderWithPartner();
        const user = userEvent.setup();
        await user.click(await ready(calls, 'Edit'));

        const dialog = await screen.findByRole('dialog', { name: 'Edit this listing?' });
        expect(dialog).toHaveTextContent('1 customer has an active booking');
        expect(calls.unarchive).toBe(0);

        await user.click(screen.getByRole('button', { name: 'Edit anyway' }));
        await waitFor(() => expect(calls.unarchive).toBe(1));
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_DETAILS');
    });
});
