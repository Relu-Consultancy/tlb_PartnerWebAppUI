import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import {
    getStatsOverview, getStatsEvents, getStatsVenues, getStatsEnquiries, trackProfileView,
} from '../stats';
import { mockStatsOverview, mockStatsEnquiries } from '../../test/msw/handlers';

const BASE = 'https://tlb-api.reluconsultancy.in';

beforeEach(() => {
    localStorage.clear();
});

describe('stats API — getStatsOverview', () => {
    it('returns the overview payload (unwraps { data } envelope)', async () => {
        const res = await getStatsOverview();
        expect(res).toEqual(mockStatsOverview);
        expect(res.profile_views).toBe(1240);
        expect(res.followers).toBe(87);
    });

    it('hits the correct endpoint with auth header', async () => {
        localStorage.setItem('access_token', 'tok-123');
        let authHeader: string | null = null;
        let url = '';
        server.use(http.get(`${BASE}/api/v1/partner/stats/overview/`, ({ request }) => {
            authHeader = request.headers.get('Authorization');
            url = request.url;
            return HttpResponse.json({ success: true, data: mockStatsOverview });
        }));
        await getStatsOverview();
        expect(url).toContain('/api/v1/partner/stats/overview/');
        expect(authHeader).toBe('Bearer tok-123');
    });

    it('supports a bare (non-enveloped) JSON body', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/stats/overview/`, () =>
            HttpResponse.json(mockStatsOverview)));
        const res = await getStatsOverview();
        expect(res.active_batches).toBe(6);
    });

    it('throws with the API error message on failure', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/stats/overview/`, () =>
            HttpResponse.json({ error: { message: 'Not approved' } }, { status: 403 })));
        await expect(getStatsOverview()).rejects.toThrow('Not approved');
    });

    it('throws a fallback message when no error body is present', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/stats/overview/`, () =>
            new HttpResponse(null, { status: 500 })));
        await expect(getStatsOverview()).rejects.toThrow(/Failed to load overview stats/);
    });
});

describe('stats API — getStatsEvents', () => {
    it('returns the events payload with nullable engagement_rate', async () => {
        const res = await getStatsEvents();
        expect(res.tickets_sold).toBe(152);
        expect(res.engagement_rate).toBeNull();
        expect(res.weekly_ticket_sales).toHaveLength(7);
        expect(res.ticket_sales_trend[0]).toMatchObject({ month: 'Dec 2025', count: 30 });
        expect(res.by_category[0]).toMatchObject({ category: 'Music', count: 80, amount: '120000.00' });
    });

    it('throws on failure', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/stats/events/`, () =>
            HttpResponse.json({ message: 'boom' }, { status: 500 })));
        await expect(getStatsEvents()).rejects.toThrow('boom');
    });
});

describe('stats API — getStatsVenues', () => {
    it('returns venue stats with string money fields', async () => {
        const res = await getStatsVenues();
        expect(res.total_bookings).toBe(48);
        expect(res.occupancy_rate).toBe(67);
        expect(res.monthly_earnings).toBe('200000.00');
        expect(res.revenue_trend).toHaveLength(3);
    });
});

describe('stats API — getStatsEnquiries', () => {
    it('returns funnel + retention + monthly trend', async () => {
        const res = await getStatsEnquiries();
        expect(res.conversion_funnel.conversion_rate).toBe(25);
        expect(res.trial_requests).toBe(18);
        expect(res.avg_response_hours).toBe(4.5);
        expect(res.monthly_trend).toHaveLength(3);
    });

    it('tolerates a null avg_response_hours', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/stats/enquiries/`, () =>
            HttpResponse.json({ success: true, data: { ...mockStatsEnquiries, avg_response_hours: null } })));
        const res = await getStatsEnquiries();
        expect(res.avg_response_hours).toBeNull();
    });
});

describe('stats API — trackProfileView', () => {
    it('POSTs to the track-view endpoint for the given partner id', async () => {
        let called = false;
        let method = '';
        server.use(http.post(`${BASE}/api/v1/partner/:id/track-view/`, ({ request, params }) => {
            called = true;
            method = request.method;
            expect(params.id).toBe('partner-xyz');
            return HttpResponse.json({ success: true, data: { message: 'tracked' } });
        }));
        await trackProfileView('partner-xyz');
        expect(called).toBe(true);
        expect(method).toBe('POST');
    });

    it('never throws even when the request fails (best-effort)', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/:id/track-view/`, () =>
            new HttpResponse(null, { status: 500 })));
        await expect(trackProfileView('partner-xyz')).resolves.toBeUndefined();
    });
});
