import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { Statistics } from '../Statistics';
import { PartnerProvider } from '../../../context/PartnerContext';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

function renderWithPartner(allowedEntities: string[] = ['Events', 'Venues', 'Classes', 'Programs']) {
    sessionStorage.setItem('allowedEntities', JSON.stringify(allowedEntities));
    return render(
        <PartnerProvider>
            <Statistics onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />
        </PartnerProvider>
    );
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('Statistics — header & overview', () => {
    it('renders the screen header', async () => {
        renderWithPartner();
        expect(screen.getByRole('heading', { name: /statistics/i })).toBeInTheDocument();
    });

    it('shows the overview KPI labels after loading', async () => {
        renderWithPartner();
        await waitFor(() => expect(screen.getByText(/profile views/i)).toBeInTheDocument(), { timeout: 3000 });
        expect(screen.getByText(/followers/i)).toBeInTheDocument();
        expect(screen.getByText(/new enquiries/i)).toBeInTheDocument();
        expect(screen.getByText(/active batches/i)).toBeInTheDocument();
    });
});

describe('Statistics — tabs by entity', () => {
    it('shows all entity tabs when the partner offers everything', async () => {
        renderWithPartner(['Events', 'Venues', 'Classes', 'Programs']);
        await waitFor(() => screen.getByText(/profile views/i));
        expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /events/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /venues/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /classes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /programs/i })).toBeInTheDocument();
    });

    it('hides tabs for entities the partner does not offer', async () => {
        renderWithPartner(['Events']);
        await waitFor(() => screen.getByText(/profile views/i));
        expect(screen.getByRole('button', { name: /events/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /venues/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /classes/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /programs/i })).not.toBeInTheDocument();
    });
});

describe('Statistics — tab switching', () => {
    it('shows event analytics when the Events tab is clicked', async () => {
        renderWithPartner(['Events', 'Venues']);
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/profile views/i));
        await user.click(screen.getByRole('button', { name: /^events/i }));
        await waitFor(() => expect(screen.getByText(/weekly ticket sales/i)).toBeInTheDocument());
        expect(screen.getByText(/ticket sales trend/i)).toBeInTheDocument();
    });

    it('shows occupancy analytics when the Venues tab is clicked', async () => {
        renderWithPartner(['Events', 'Venues']);
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/profile views/i));
        await user.click(screen.getByRole('button', { name: /venues/i }));
        await waitFor(() => expect(screen.getByText(/occupancy rate/i)).toBeInTheDocument());
        expect(screen.getByText(/revenue trend/i)).toBeInTheDocument();
    });

    it('shows the conversion funnel when the Classes tab is clicked', async () => {
        renderWithPartner(['Classes']);
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/profile views/i));
        await user.click(screen.getByRole('button', { name: /classes/i }));
        await waitFor(() => expect(screen.getByText(/conversion funnel/i)).toBeInTheDocument());
    });
});

describe('Statistics — empty & error states', () => {
    it('shows the no-analytics empty state when no entities are allowed', async () => {
        renderWithPartner([]);
        await waitFor(() => expect(screen.getByText(/no analytics yet/i)).toBeInTheDocument(), { timeout: 3000 });
    });

    it('shows an error state when every stats endpoint fails', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/stats/overview/`, () => new HttpResponse(null, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/events/`, () => new HttpResponse(null, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/venues/`, () => new HttpResponse(null, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/enquiries/`, () => new HttpResponse(null, { status: 500 })),
        );
        renderWithPartner(['Events']);
        await waitFor(() => expect(screen.getByText(/could not load analytics/i)).toBeInTheDocument(), { timeout: 3000 });
    });
});
