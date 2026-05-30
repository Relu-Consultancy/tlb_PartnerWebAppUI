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

const BASE = 'https://tlb-api.reluconsultancy.in';

const mockNavigate = vi.fn();

function renderWithPartner(allowedEntities: string[] = ['Events']) {
    sessionStorage.setItem('allowedEntities', JSON.stringify(allowedEntities));
    return render(
        <PartnerProvider>
            <ServiceListings onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />
        </PartnerProvider>
    );
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('ServiceListings — loading and error states', () => {
    it('shows loading spinner initially', () => {
        renderWithPartner();
        expect(screen.getByText(/loading listings/i)).toBeInTheDocument();
    });

    it('shows error message on API failure', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Listings unavailable' } }, { status: 500 })));
        renderWithPartner();
        await waitFor(() =>
            expect(screen.getByText(/listings unavailable/i)).toBeInTheDocument()
        );
    });
});

describe('ServiceListings — listing display', () => {
    it('shows listing title after loading', async () => {
        renderWithPartner();
        // Component renders both a desktop table and mobile cards, so the title
        // appears more than once in jsdom (no CSS to hide either layout).
        await waitFor(() =>
            expect(screen.getAllByText('Test Event').length).toBeGreaterThan(0)
        );
    });

    it('shows Draft status badge', async () => {
        renderWithPartner();
        await waitFor(() =>
            expect(screen.getAllByText('Draft').length).toBeGreaterThan(0)
        );
    });

    it('shows category name on the listing card', async () => {
        renderWithPartner();
        await waitFor(() => screen.getAllByText('Test Event'));
        // mockListing has category { name: 'Dance' } — rendered in the category column
        expect(screen.getAllByText('Dance').length).toBeGreaterThan(0);
    });

    it('shows empty state when no listings returned', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
            HttpResponse.json({ success: true, data: [] })));
        renderWithPartner();
        await waitFor(() =>
            expect(screen.getByText(/no listings yet/i)).toBeInTheDocument()
        );
    });

    it('shows the Listings heading', async () => {
        renderWithPartner();
        await waitFor(() =>
            expect(screen.getByRole('heading', { name: 'Listings' })).toBeInTheDocument()
        );
    });
});

describe('ServiceListings — tabs', () => {
    it('shows All tab', async () => {
        renderWithPartner();
        await waitFor(() =>
            expect(screen.getByText('All')).toBeInTheDocument()
        );
    });

    it('shows allowed entity tabs', async () => {
        renderWithPartner(['Events', 'Classes']);
        await waitFor(() => screen.getAllByText('Test Event'));
        // Both entity tabs should be present
        const tabs = screen.getAllByRole('button', { name: /^(All|Events|Classes)/ });
        expect(tabs.length).toBeGreaterThanOrEqual(3);
    });

    it('filters to show only selected entity type', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({ success: true, data: [{ id: '1', title: 'My Event', status: 'draft', listing_type: 'event', category: { id: 1, name: 'Dance' } }] })),
            http.get(`${BASE}/api/v1/partner/listings/classes/`, () =>
                HttpResponse.json({ success: true, data: [{ id: '2', title: 'My Class', status: 'draft', listing_type: 'class', category: { id: 3, name: 'Sports' } }] }))
        );
        renderWithPartner(['Events', 'Classes']);
        const user = userEvent.setup();
        await waitFor(() => screen.getAllByText('My Event'));
        await waitFor(() => screen.getAllByText('My Class'));
        // Click on Events tab (tab label is "Events (1)")
        const eventTabBtns = screen.getAllByRole('button').filter(b => b.textContent?.startsWith('Events'));
        if (eventTabBtns.length > 0) await user.click(eventTabBtns[0]);
        await waitFor(() =>
            expect(screen.queryAllByText('My Class')).toHaveLength(0)
        );
        expect(screen.getAllByText('My Event').length).toBeGreaterThan(0);
    });
});

describe('ServiceListings — search', () => {
    it('has a search input', async () => {
        renderWithPartner();
        await waitFor(() => screen.getAllByText('Test Event'));
        expect(screen.getByPlaceholderText(/search listings/i)).toBeInTheDocument();
    });

    it('filters listings by search query', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
            HttpResponse.json({
                success: true,
                data: [
                    { id: '1', title: 'Summer Art Festival', status: 'draft', listing_type: 'event', category: { id: 1, name: 'Dance' } },
                    { id: '2', title: 'Winter Dance Camp', status: 'draft', listing_type: 'event', category: { id: 1, name: 'Dance' } },
                ],
            })));
        renderWithPartner();
        const user = userEvent.setup();
        await waitFor(() => screen.getAllByText('Summer Art Festival'));
        const searchInput = screen.getByPlaceholderText(/search listings/i);
        await user.type(searchInput, 'Winter');
        expect(screen.queryAllByText('Summer Art Festival')).toHaveLength(0);
        expect(screen.getAllByText('Winter Dance Camp').length).toBeGreaterThan(0);
    });
});

describe('ServiceListings — edit and create navigation', () => {
    it('shows an Edit action for draft events', async () => {
        renderWithPartner();
        // Edit is an icon button (title="Edit") on desktop + a text button on mobile.
        await waitFor(() =>
            expect(screen.getAllByTitle('Edit').length).toBeGreaterThan(0)
        );
    });

    it('sets draft id and navigates to CREATE_EVENT_DETAILS on Edit click', async () => {
        renderWithPartner();
        const user = userEvent.setup();
        await waitFor(() => screen.getAllByTitle('Edit'));
        await user.click(screen.getAllByTitle('Edit')[0]);
        expect(getCurrentDraftId()).toBe(DRAFT_ID);
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_DETAILS');
    });

    it('shows an Edit action for pending listings (still editable)', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
            HttpResponse.json({
                success: true,
                data: [{
                    id: DRAFT_ID,
                    title: 'Pending Event',
                    status: 'pending',
                    listing_type: 'event',
                    category: { id: 1, name: 'Dance' },
                }],
            })));
        renderWithPartner();
        await waitFor(() =>
            expect(screen.getAllByTitle('Edit').length).toBeGreaterThan(0)
        );
        expect(screen.queryAllByTitle('Locked')).toHaveLength(0);
    });

    it('shows Locked button for published listings', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
            HttpResponse.json({
                success: true,
                data: [{
                    id: DRAFT_ID,
                    title: 'Published Event',
                    status: 'published',
                    listing_type: 'event',
                    category: { id: 1, name: 'Dance' },
                }],
            })));
        renderWithPartner();
        await waitFor(() =>
            expect(screen.getByText('Locked')).toBeInTheDocument()
        );
    });

    it('navigates to CREATE_EVENT_DETAILS on Add Listing when only Events allowed', async () => {
        renderWithPartner(['Events']);
        const user = userEvent.setup();
        await waitFor(() => screen.getAllByText('Test Event'));
        const addBtn = document.querySelector('header button[class*="bg-tlb-yellow"]') as HTMLButtonElement;
        await user.click(addBtn);
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_DETAILS');
    });
});
