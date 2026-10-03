import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { apiClient, refreshAccessToken, setAuthToken, setRefreshToken, SESSION_EXPIRED_EVENT } from '../client';

const BASE = 'https://tlb-api.reluconsultancy.in';

beforeEach(() => {
    setAuthToken('old-access');
    setRefreshToken('some-refresh');
});

afterEach(() => {
    localStorage.clear();
});

describe('refreshAccessToken', () => {
    it('sets a new access token on success', async () => {
        server.use(
            http.post(`${BASE}/api/v1/auth/refresh-token/`, () =>
                HttpResponse.json({ success: true, data: { access_token: 'new-access' } })
            )
        );
        const access = await refreshAccessToken();
        expect(access).toBe('new-access');
        expect(localStorage.getItem('access_token')).toBe('new-access');
    });

    it('clears tokens on a definitive 401 (invalid/expired refresh token)', async () => {
        server.use(
            http.post(`${BASE}/api/v1/auth/refresh-token/`, () => HttpResponse.json({ error: 'Invalid refresh token' }, { status: 401 }))
        );
        const access = await refreshAccessToken();
        expect(access).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('keeps tokens intact on a 429 — a rate limit is not an invalid session', async () => {
        server.use(
            http.post(`${BASE}/api/v1/auth/refresh-token/`, () => HttpResponse.json({ error: 'Too many requests' }, { status: 429 }))
        );
        const access = await refreshAccessToken();
        expect(access).toBeNull();
        // The refresh token must survive a transient rate limit so a retry can succeed shortly after.
        expect(localStorage.getItem('refresh_token')).toBe('some-refresh');
    });
});

describe('refreshAccessToken — concurrency and rotation', () => {
    it('spends the refresh token once when many requests 401 together', async () => {
        // With rotation, a second parallel refresh of the same token fails and
        // used to log the partner out despite the first one succeeding.
        let refreshCalls = 0;
        server.use(
            http.post(`${BASE}/api/v1/auth/refresh-token/`, () => {
                refreshCalls += 1;
                return HttpResponse.json({ success: true, data: { access_token: 'new-access', refresh_token: 'rotated' } });
            }),
            http.get(`${BASE}/api/v1/ping/`, ({ request }) =>
                request.headers.get('Authorization') === 'Bearer new-access'
                    ? HttpResponse.json({ ok: true })
                    : HttpResponse.json({ detail: 'expired' }, { status: 401 })
            )
        );

        const responses = await Promise.all(Array.from({ length: 6 }, () => apiClient('/api/v1/ping/')));

        expect(refreshCalls).toBe(1);
        expect(responses.every((r) => r.status === 200)).toBe(true);
    });

    it('stores the rotated refresh token the server hands back', async () => {
        server.use(
            http.post(`${BASE}/api/v1/auth/refresh-token/`, () =>
                HttpResponse.json({ success: true, data: { access_token: 'new-access', refresh_token: 'rotated' } })
            )
        );
        await refreshAccessToken();
        expect(localStorage.getItem('refresh_token')).toBe('rotated');
    });

    it('keeps the session through a network blip instead of logging out', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/refresh-token/`, () => HttpResponse.error()));
        const access = await refreshAccessToken();
        expect(access).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBe('some-refresh');
    });

    it('announces a session that has definitively ended', async () => {
        const onExpired = vi.fn();
        window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
        server.use(http.post(`${BASE}/api/v1/auth/refresh-token/`, () => HttpResponse.json({ error: 'Invalid' }, { status: 401 })));
        await refreshAccessToken();
        window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
        expect(onExpired).toHaveBeenCalledTimes(1);
    });
});
