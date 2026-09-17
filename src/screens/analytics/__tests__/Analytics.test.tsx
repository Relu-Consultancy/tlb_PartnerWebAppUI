import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
            http.get(`${BASE}/api/v1/partner/stats/traffic/`, () => HttpResponse.json({}, { status: 500 })),
        );
        renderScreen();
        await waitFor(() => expect(screen.getByText(/could not load analytics/i)).toBeInTheDocument());
    });
});

describe('Analytics — Overview tab (stats/overview-all/)', () => {
    it('shows the real combined KPIs and revenue-by-service breakdown for All services', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByText('Rs 1,24,600')).toBeInTheDocument());
        const metricsGrid = screen.getByText('Gross revenue').closest('.grid') as HTMLElement;
        expect(within(metricsGrid).getByText('57')).toBeInTheDocument(); // confirmed_bookings
        expect(within(metricsGrid).getByText('67%')).toBeInTheDocument(); // conversion_rate
        expect(within(metricsGrid).getByText('31%')).toBeInTheDocument(); // repeat_customers_pct
        const revenueCard = screen.getByText('Revenue by service').closest('.pt-card') as HTMLElement;
        expect(within(revenueCard).getByText('Events')).toBeInTheDocument();
        // No Net Payout tile — its "after platform fee" framing doesn't match how settlement works yet.
        expect(screen.queryByText(/net payout/i)).not.toBeInTheDocument();
    });

    it('re-scopes to a single service and swaps in revenue-by-listing', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Venues' }));
        await waitFor(() => expect(screen.getByText('Grand Hall')).toBeInTheDocument());
        expect(screen.getByText('Rooftop Lounge')).toBeInTheDocument();
        expect(screen.getByText(/revenue by venue/i)).toBeInTheDocument();
    });

    it('hides the literal conversion rate on the Events scope instead of showing a permanent 0%', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Events' }));
        await waitFor(() => expect(screen.getByText(/no enquiry data for events/i)).toBeInTheDocument());
        const metricsGrid = screen.getByText('Gross revenue').closest('.grid') as HTMLElement;
        expect(within(metricsGrid).queryByText('0%')).not.toBeInTheDocument();
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

    it('shows real traffic-source shares and links to the full traffic report', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Demand funnel' }));
        expect(screen.getByText('Instagram')).toBeInTheDocument();
        expect(screen.getByText('Organic / direct')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /full report/i }));
        expect(mockNavigate).toHaveBeenCalledWith('TRAFFIC_ANALYTICS');
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
