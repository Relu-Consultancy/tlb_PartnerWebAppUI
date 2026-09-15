import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { Analytics } from '../Analytics';
import { PartnerProvider } from '../../../context/PartnerContext';

const BASE = 'https://tlb-api.reluconsultancy.in';

const mockNavigate = vi.fn();

function renderScreen(allowedEntities: string[] = ['Events', 'Classes', 'Venues']) {
    sessionStorage.setItem('allowedEntities', JSON.stringify(allowedEntities));
    return render(
        <PartnerProvider>
            <Analytics onNavigate={mockNavigate} />
        </PartnerProvider>
    );
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('Analytics — loading and error states', () => {
    it('shows a skeleton loader initially', () => {
        renderScreen();
        expect(document.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('shows an error message when every stats endpoint fails', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/stats/overview/`, () => HttpResponse.json({}, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/events/`, () => HttpResponse.json({}, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/venues/`, () => HttpResponse.json({}, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/enquiries/`, () => HttpResponse.json({}, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/revenue/`, () => HttpResponse.json({}, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/reviews/`, () => HttpResponse.json({}, { status: 500 })),
        );
        renderScreen();
        await waitFor(() => expect(screen.getByText(/could not load analytics/i)).toBeInTheDocument());
    });
});

describe('Analytics — Overview tab', () => {
    it('shows the real revenue metrics and revenue-by-service breakdown', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByText('Rs 1,24,600')).toBeInTheDocument());
        expect(screen.getByText('Rs 1,05,910')).toBeInTheDocument();
        expect(screen.getByText('Revenue by service')).toBeInTheDocument();
        expect(screen.getByText('Events')).toBeInTheDocument();
    });

    it('shows the My listings heading and title', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByRole('heading', { name: 'Analytics & reports' })).toBeInTheDocument());
    });
});

describe('Analytics — tab switching', () => {
    it('shows the demand funnel with a real uncontacted-leads insight', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Demand funnel' }));
        expect(screen.getByText('Profile views')).toBeInTheDocument();
        // new_leads 100 - contacted 60 = 40 uncontacted
        expect(screen.getByText(/40 enquiries have not been contacted yet/i)).toBeInTheDocument();
    });

    it('shows the reports tab with real, downloadable CSV reports', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Reports' }));
        expect(screen.getByText('Monthly earnings statement')).toBeInTheDocument();
        expect(screen.getByText('Booking register')).toBeInTheDocument();
        expect(screen.getByText('Reviews & ratings export')).toBeInTheDocument();
        // GST summary and the enquiry/response SLA log render as design placeholders, not real downloads.
        expect(screen.getByText(/GST summary/i)).toBeInTheDocument();
        expect(screen.getByText(/Enquiry & response log/i)).toBeInTheDocument();
        expect(screen.getAllByText('Coming soon').length).toBeGreaterThanOrEqual(2);
    });

    it('shows the customers tab with whichever real retention metric applies', async () => {
        renderScreen(['Classes']);
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Customers' }));
        expect(screen.getByText('Student retention')).toBeInTheDocument();
    });
});
