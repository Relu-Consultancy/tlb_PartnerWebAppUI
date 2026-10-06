import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configure, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../test/msw/server';
import { invalidatePortalSummary } from '../api/portalSummary';
import App from '../App';

// Whole-app tests boot the entire portal; in a saturated parallel run that
// can take longer than the suite-wide 4s wait. Scoped to this file's worker.
configure({ asyncUtilTimeout: 25000 });

// Simulate production: a screen's JS chunk takes time to download on first visit.
vi.mock('../screens/analytics', async () => {
    await new Promise((r) => setTimeout(r, 1200));
    return await vi.importActual('../screens/analytics');
});
vi.mock('../screens/coupons', async () => {
    await new Promise((r) => setTimeout(r, 1200));
    return await vi.importActual('../screens/coupons');
});

const BASE = 'https://tlb-api.reluconsultancy.in';
const signedInAs = (status: string) => {
    localStorage.setItem('access_token', 'test-access-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');
    server.use(
        // Keep every request inside the mock — an unmocked call reaches the real
        // API with a fake token, 401s, and ends the session mid-test.
        http.get(`${BASE}/api/v1/notifications/in-app/unread-count/`, () => HttpResponse.json({ success: true, data: { count: 0 } })),
        http.post(`${BASE}/api/v1/auth/refresh-token/`, () =>
            HttpResponse.json({ success: true, data: { access_token: 'test-access-token' } })
        ),
        http.get(`${BASE}/api/v1/partner/me/`, async () => {
            await delay(400);
            return HttpResponse.json({
                success: true,
                data: { id: 1, status, is_verified: true, is_active: true, categories: [{ name: 'Events' }] },
            });
        })
    );
};

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    invalidatePortalSummary();
});

describe('App — gated screens on a slow (production-like) first visit', () => {
    it('approved partner: Analytics renders on the FIRST click', async () => {
        signedInAs('approved');
        const user = userEvent.setup();
        render(<App />);
        await user.click(await screen.findByRole('button', { name: /^Analytics/ }, { timeout: 25000 }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /Analytics & reports/i })).toBeVisible(), { timeout: 25000 });
    }, 60000);

    it('approved partner: Coupons renders on the FIRST click', async () => {
        signedInAs('approved');
        const user = userEvent.setup();
        render(<App />);
        await user.click(await screen.findByRole('button', { name: /^Coupons/ }, { timeout: 25000 }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /^Coupons$/ })).toBeVisible(), { timeout: 25000 });
    }, 60000);

    it('unapproved partner: notice renders on the FIRST click', async () => {
        signedInAs('activated_limited');
        const user = userEvent.setup();
        render(<App />);
        await user.click(await screen.findByRole('button', { name: /^Analytics/ }, { timeout: 25000 }));
        await waitFor(() => expect(screen.getByText(/Analytics unlock once TLB approves/i)).toBeVisible(), { timeout: 25000 });
    }, 60000);
});
