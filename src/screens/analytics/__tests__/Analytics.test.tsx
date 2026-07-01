import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { PartnerProvider } from '../../../context/PartnerContext';
import Analytics from '../Analytics';

const BASE = 'https://tlb-api.reluconsultancy.in';

const defaultProps = {
    onNavigate: vi.fn(),
    onOpenSidebar: vi.fn(),
};

const renderAnalytics = () =>
    render(
        <PartnerProvider>
            <Analytics {...defaultProps} />
        </PartnerProvider>,
    );

beforeEach(() => {
    sessionStorage.clear();
});

describe('Analytics screen', () => {
    it('renders the audience hero KPIs from the overview + event stats', async () => {
        renderAnalytics();
        // profile_views 1240 → "1.2K", followers 87
        await waitFor(() => expect(screen.getByText(/profile views/i)).toBeInTheDocument());
        expect(screen.getByText(/^audience reach$/i)).toBeInTheDocument();
        expect(screen.getByText(/^engagement$/i)).toBeInTheDocument();
    });

    it('shows the growth insights panel', async () => {
        renderAnalytics();
        await waitFor(() => expect(screen.getByText(/growth insights/i)).toBeInTheDocument());
    });

    it('renders the reach trend and audience-by-category panels', async () => {
        renderAnalytics();
        await waitFor(() => expect(screen.getByText(/audience reach trend/i)).toBeInTheDocument());
        expect(screen.getByText(/audience by category/i)).toBeInTheDocument();
        // category labels come from mockStatsEvents.by_category
        expect(screen.getByText('Music')).toBeInTheDocument();
        expect(screen.getByText('Dance')).toBeInTheDocument();
    });

    it('shows an error state with retry when all stats fail', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/stats/overview/`, () => HttpResponse.json({}, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/events/`, () => HttpResponse.json({}, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/enquiries/`, () => HttpResponse.json({}, { status: 500 })),
            http.get(`${BASE}/api/v1/partner/stats/venues/`, () => HttpResponse.json({}, { status: 500 })),
        );
        renderAnalytics();
        await waitFor(() => expect(screen.getByText(/could not load analytics/i)).toBeInTheDocument());
    });
});
