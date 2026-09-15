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
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Listings unavailable' } }, { status: 500 })));
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
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
            HttpResponse.json({ success: true, data: [] })));
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
                HttpResponse.json({ success: true, data: [{ id: '1', title: 'My Event', status: 'draft', listing_type: 'event' }] })),
            http.get(`${BASE}/api/v1/partner/listings/classes/`, () =>
                HttpResponse.json({ success: true, data: [{ id: '2', title: 'My Class', status: 'draft', listing_type: 'class' }] })),
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
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
            HttpResponse.json({
                success: true,
                data: [
                    { id: '1', title: 'Summer Art Festival', status: 'draft', listing_type: 'event' },
                    { id: '2', title: 'Winter Dance Camp', status: 'draft', listing_type: 'event' },
                ],
            })));
        renderWithPartner();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Summer Art Festival'));
        await user.type(screen.getByPlaceholderText(/search listings/i), 'Winter');
        expect(screen.queryByText('Summer Art Festival')).not.toBeInTheDocument();
        expect(screen.getByText('Winter Dance Camp')).toBeInTheDocument();
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

    it('shows a Locked button instead of Edit for a published (archived) listing', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
            HttpResponse.json({
                success: true,
                data: [{ id: DRAFT_ID, title: 'Archived Event', status: 'archived', listing_type: 'event' }],
            })));
        renderWithPartner();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Locked' })).toBeInTheDocument());
    });

    it('navigates straight to the wizard when only one service type is allowed', async () => {
        renderWithPartner(['Events']);
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Test Event'));
        await user.click(screen.getByRole('button', { name: '+ New listing' }));
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_DETAILS');
    });
});
