import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { mockCoupon } from '../../../test/msw/handlers';
import { Coupons } from '../Coupons';
import { PartnerProvider } from '../../../context/PartnerContext';

const BASE = 'https://tlb-api.reluconsultancy.in';

const mockNavigate = vi.fn();

const couponListItem = (overrides: Record<string, unknown> = {}) => ({
    id: 'coupon-1', code: 'MONSOON20', discount_type: 'percent', discount_value: 20,
    is_active: true, usage_count: 28, usage_limit: 100, expires_at: null, ...overrides,
});

function renderScreen(allowedEntities: string[] = ['Events']) {
    sessionStorage.setItem('allowedEntities', JSON.stringify(allowedEntities));
    return render(
        <PartnerProvider>
            <Coupons onNavigate={mockNavigate} />
        </PartnerProvider>
    );
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('Coupons — loading and empty state', () => {
    it('shows a skeleton loader initially', () => {
        renderScreen();
        expect(document.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('shows an empty state with no coupons', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByText('No coupons yet')).toBeInTheDocument());
    });

    it('shows an error message when the list fails to load', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/coupons/`, () =>
            HttpResponse.json({ error: { message: 'Coupons unavailable' } }, { status: 500 })));
        renderScreen();
        await waitFor(() => expect(screen.getByText(/coupons unavailable/i)).toBeInTheDocument());
    });
});

describe('Coupons — list display', () => {
    it('shows the coupon code, discount and status', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/coupons/`, () =>
            HttpResponse.json({ success: true, data: [couponListItem()] })));
        renderScreen();
        await waitFor(() => expect(screen.getByText('MONSOON20')).toBeInTheDocument());
        expect(screen.getByText('20% off')).toBeInTheDocument();
        // "Active" also labels a segbar filter pill, so more than one match confirms the row's own status pill.
        expect(screen.getAllByText('Active').length).toBeGreaterThan(1);
    });

    it('shows "All active listings" when a coupon has no targeting', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/coupons/`, () => HttpResponse.json({ success: true, data: [couponListItem()] })),
            http.get(`${BASE}/api/v1/partner/coupons/:id/`, () => HttpResponse.json({ success: true, data: { ...mockCoupon, target_listing_types: [] } })),
        );
        renderScreen();
        await waitFor(() => expect(screen.getByText('All active listings')).toBeInTheDocument());
    });

    it('filters coupons by search', async () => {
        const codesById: Record<string, string> = { 'coupon-1': 'MONSOON20', 'coupon-2': 'CLAYFIRST' };
        server.use(
            http.get(`${BASE}/api/v1/partner/coupons/`, () =>
                HttpResponse.json({ success: true, data: [couponListItem(), couponListItem({ id: 'coupon-2', code: 'CLAYFIRST' })] })),
            http.get(`${BASE}/api/v1/partner/coupons/:id/`, ({ params }) =>
                HttpResponse.json({ success: true, data: { ...mockCoupon, id: params.id, code: codesById[params.id as string] } })),
        );
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('MONSOON20'));
        await user.type(screen.getByPlaceholderText(/search coupons/i), 'CLAYFIRST');
        expect(screen.queryByText('MONSOON20')).not.toBeInTheDocument();
        expect(screen.getByText('CLAYFIRST')).toBeInTheDocument();
    });
});

describe('Coupons — create flow', () => {
    it('opens the create modal and publishes a new coupon', async () => {
        let created: any = null;
        server.use(
            http.get(`${BASE}/api/v1/partner/coupons/`, () => HttpResponse.json({ success: true, data: [] })),
            http.post(`${BASE}/api/v1/partner/coupons/`, async ({ request }) => {
                created = await request.json();
                return HttpResponse.json({ success: true, data: { ...mockCoupon, ...created, id: 'new-id' } }, { status: 201 });
            }),
        );
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('No coupons yet'));
        await user.click(screen.getByRole('button', { name: '+ Create coupon' }));

        await waitFor(() => expect(screen.getByRole('heading', { name: 'Create a coupon' })).toBeInTheDocument());
        await user.type(screen.getByPlaceholderText(/e\.g\. MONSOON20/i), 'FESTIVE30');
        const amountInputs = screen.getAllByRole('spinbutton');
        await user.type(amountInputs[0], '30');
        await user.click(screen.getByRole('button', { name: /publish coupon/i }));

        await waitFor(() => expect(created).toMatchObject({ code: 'FESTIVE30', discount_value: 30, discount_type: 'percent' }));
    });
});

describe('Coupons — pause/resume', () => {
    it('toggles a coupon between Active and Paused', async () => {
        let patched: any = null;
        server.use(
            http.get(`${BASE}/api/v1/partner/coupons/`, () => HttpResponse.json({ success: true, data: [couponListItem()] })),
            http.patch(`${BASE}/api/v1/partner/coupons/:id/`, async ({ request }) => {
                patched = await request.json();
                return HttpResponse.json({ success: true, data: { ...mockCoupon, ...patched } });
            }),
        );
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('MONSOON20'));
        await user.click(screen.getByRole('button', { name: 'Pause' }));
        await waitFor(() => expect(patched).toMatchObject({ is_active: false }));
    });
});
