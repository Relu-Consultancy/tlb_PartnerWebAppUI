import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { invalidatePortalSummary } from '../api/portalSummary';
import App from '../App';

const BASE = 'https://tlb-api.reluconsultancy.in';

const signedIn = () => {
    localStorage.setItem('access_token', 'test-access-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');
    server.use(
        http.get(`${BASE}/api/v1/notifications/in-app/unread-count/`, () => HttpResponse.json({ success: true, data: { count: 0 } })),
        http.post(`${BASE}/api/v1/auth/refresh-token/`, () =>
            HttpResponse.json({ success: true, data: { access_token: 'test-access-token' } })
        ),
        http.get(`${BASE}/api/v1/partner/me/`, () =>
            HttpResponse.json({
                success: true,
                data: { id: 1, status: 'approved', is_verified: true, is_active: true, categories: [{ name: 'Events' }] },
            })
        )
    );
};

const activeNav = () => document.querySelector('[aria-current="page"]')?.textContent ?? '';
const pressBack = () => act(() => window.history.back());

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    invalidatePortalSummary();
});

describe('Browser Back button (QA: back used to exit the site)', () => {
    it('walks back through screens, then asks to log out instead of leaving', async () => {
        signedIn();
        const user = userEvent.setup();
        render(<App />);

        await waitFor(() => expect(activeNav()).toMatch(/^Dashboard/), { timeout: 8000 });
        await user.click(screen.getByRole('button', { name: /^Reviews/ }));
        await waitFor(() => expect(activeNav()).toMatch(/^Reviews/));
        await user.click(screen.getByRole('button', { name: /^My listings/ }));
        await waitFor(() => expect(activeNav()).toMatch(/^My listings/));

        // Deep in the app: Back returns to the previous screen, not out of the site.
        await pressBack();
        await waitFor(() => expect(activeNav()).toMatch(/^Reviews/));
        await pressBack();
        await waitFor(() => expect(activeNav()).toMatch(/^Dashboard/));

        // On the dashboard root: Back asks first and keeps the partner in the app.
        await pressBack();
        await waitFor(() => expect(screen.getByText('Do you want to log out?')).toBeInTheDocument());
        expect(activeNav()).toMatch(/^Dashboard/);
        expect(localStorage.getItem('access_token')).toBe('test-access-token');

        // "Stay" closes the prompt and leaves the session intact.
        await user.click(screen.getByRole('button', { name: 'Stay' }));
        await waitFor(() => expect(screen.queryByText('Do you want to log out?')).not.toBeInTheDocument());
        expect(activeNav()).toMatch(/^Dashboard/);
    }, 30000);

    it('"Log out" from the prompt signs the partner out', async () => {
        signedIn();
        const user = userEvent.setup();
        render(<App />);

        await waitFor(() => expect(activeNav()).toMatch(/^Dashboard/), { timeout: 8000 });
        await pressBack();
        await user.click(await screen.findByRole('button', { name: 'Log out' }));

        await waitFor(() => expect(localStorage.getItem('access_token')).toBeNull());
        expect(document.querySelector('[aria-current="page"]')).toBeNull();
    }, 30000);

    it('Back from outside never reopens a wizard the partner already left', async () => {
        // After submitting (or exiting) a wizard its draft id is gone: stepping back
        // into it showed "No active draft", and blank earlier steps could create a
        // duplicate listing.
        signedIn();
        const user = userEvent.setup();
        render(<App />);

        await waitFor(() => expect(activeNav()).toMatch(/^Dashboard/), { timeout: 8000 });
        await user.click(screen.getByRole('button', { name: /^My listings/ }));
        await waitFor(() => expect(activeNav()).toMatch(/^My listings/));
        await user.click(await screen.findByRole('button', { name: /\+ New listing/ }, { timeout: 8000 }));
        await waitFor(() => expect(screen.getByText(/step 1 of/i)).toBeInTheDocument(), { timeout: 8000 });

        // Leave the wizard, then press Back.
        await user.click(screen.getByRole('button', { name: /^Reviews/ }));
        await waitFor(() => expect(activeNav()).toMatch(/^Reviews/));
        await pressBack();

        await waitFor(() => expect(activeNav()).toMatch(/^My listings/));
        expect(screen.queryByText(/step 1 of/i)).not.toBeInTheDocument();
    }, 30000);
});
