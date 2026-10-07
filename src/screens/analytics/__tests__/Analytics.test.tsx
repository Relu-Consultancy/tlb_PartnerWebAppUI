import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { mockListingPerformance } from '../../../test/msw/handlers';
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
            http.get(`${BASE}/api/v1/partner/stats/overview-all/`, () => HttpResponse.json({}, { status: 500 }))
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

    it('shows "Where customers come from" beside the funnel, linking to the full traffic report', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Demand funnel' }));
        expect(screen.getByText('Profile views')).toBeInTheDocument();
        expect(screen.getByText('Where customers come from')).toBeInTheDocument();
        expect(screen.getByText('Instagram')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /full report/i }));
        expect(mockNavigate).toHaveBeenCalledWith('TRAFFIC_ANALYTICS');
    });

    it('shows the listings tab with real per-listing performance rows and their price/rating states', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Listings' }));
        await waitFor(() => expect(screen.getByText('Indigo Dyeing Evening')).toBeInTheDocument());
        expect(screen.getByText('4.9')).toBeInTheDocument();
        expect(screen.getByText('3.1%')).toBeInTheDocument();
        // Second row has no price/rating yet — must show honest placeholders, not fabricated values.
        expect(screen.getByText('Beginners Pottery')).toBeInTheDocument();
        expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    });

    it('re-sorts the listings tab via the Top/Underperforming/All control', async () => {
        let capturedTab: string | null = null;
        server.use(
            http.get(`${BASE}/api/v1/partner/stats/listing-performance/`, ({ request }) => {
                capturedTab = new URL(request.url).searchParams.get('tab');
                return HttpResponse.json({ success: true, data: mockListingPerformance });
            })
        );
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Listings' }));
        await waitFor(() => screen.getByText('Indigo Dyeing Evening'));
        await user.click(screen.getByRole('tab', { name: 'Underperforming' }));
        await waitFor(() => expect(capturedTab).toBe('underperforming'));
    });

    it('shows the reports tab with 4 real, downloadable CSV reports and GST as the only placeholder', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Reports' }));
        expect(screen.getByText('Monthly earnings statement')).toBeInTheDocument();
        expect(screen.getByText('Booking register')).toBeInTheDocument();
        expect(screen.getByText('Reviews & ratings export')).toBeInTheDocument();
        // Enquiry & response log is now real too (backend shipped it) — only GST summary has no endpoint.
        expect(screen.getByText(/Enquiry & response log/i)).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Download' })).toHaveLength(4);
        expect(screen.getByText(/GST summary/i)).toBeInTheDocument();
        // 2 "Coming soon" pills: GST's row, and the unrelated "Schedule a report" button next to it.
        expect(screen.getAllByText('Coming soon')).toHaveLength(2);
    });

    it('shows the customers tab with whichever real retention metric applies', async () => {
        renderScreen(['Classes']);
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Revenue by service'));
        await user.click(screen.getByRole('tab', { name: 'Customers' }));
        expect(screen.getByText('Student retention')).toBeInTheDocument();
    });
});

describe('Analytics — approval refusals', () => {
    it('shows the verification notice when a single stats endpoint refuses, not just when all of them fail', async () => {
        // The old rule needed every call to reject; one endpoint staying open
        // left an unapproved partner on an empty screen with no explanation.
        server.use(
            http.get(`${BASE}/api/v1/partner/stats/revenue/`, () =>
                HttpResponse.json({ error: { message: 'You do not have permission to perform this action.' } }, { status: 403 })
            )
        );
        renderScreen();
        await waitFor(() => expect(screen.getByText(/Analytics unlock once TLB approves your profile/i)).toBeInTheDocument());
    });
});

describe('Analytics — Revenue trend controls (QA: only static text was shown)', () => {
    it('offers grouping and period dropdowns on the trend card', async () => {
        const user = userEvent.setup();
        renderScreen();
        await user.click(await screen.findByRole('tab', { name: /^Revenue/ }));

        const grouping = await screen.findByRole('combobox', { name: 'Trend grouping' });
        expect(Array.from((grouping as HTMLSelectElement).options).map((o) => o.text)).toEqual(['Weekly', 'Monthly', 'Yearly']);
        const period = screen.getByRole('combobox', { name: 'Trend period' });
        expect(Array.from((period as HTMLSelectElement).options).map((o) => o.text)).toContain('Till date');

        await user.selectOptions(grouping, 'yearly');
        expect(screen.getByText(/^Yearly ·/)).toBeInTheDocument();
    });
});
