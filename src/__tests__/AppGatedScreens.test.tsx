import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { invalidatePortalSummary } from '../api/portalSummary';
import App from '../App';

const BASE = 'https://tlb-api.reluconsultancy.in';

const signedInAs = (status: string) => {
    localStorage.setItem('access_token', 'test-access-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');
    server.use(
        http.get(`${BASE}/api/v1/partner/me/`, () =>
            HttpResponse.json({
                success: true,
                data: { id: 1, status, is_verified: true, is_active: true, categories: [{ name: 'Events' }] },
            })
        )
    );
};

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    invalidatePortalSummary();
});

describe('App — first visit to the approval-gated screens', () => {
    it.each([
        ['Analytics', /Analytics unlock once TLB approves your profile/i],
        ['Coupons', /Coupons unlock once TLB approves your profile/i],
    ])(
        'an unapproved partner sees the notice on the FIRST click into %s',
        async (label, notice) => {
            signedInAs('activated_limited');
            const user = userEvent.setup();
            render(<App />);
            const link = await screen.findByRole('button', { name: new RegExp(`^${label}`) }, { timeout: 8000 });
            await user.click(link);
            await waitFor(() => expect(screen.getByText(notice)).toBeVisible(), { timeout: 8000 });
        },
        20000
    );
});
