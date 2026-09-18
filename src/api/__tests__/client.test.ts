import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { refreshAccessToken, setAuthToken, setRefreshToken } from '../client';

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
        server.use(http.post(`${BASE}/api/v1/auth/refresh-token/`, () =>
            HttpResponse.json({ success: true, data: { access_token: 'new-access' } })));
        const access = await refreshAccessToken();
        expect(access).toBe('new-access');
        expect(localStorage.getItem('access_token')).toBe('new-access');
    });

    it('clears tokens on a definitive 401 (invalid/expired refresh token)', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/refresh-token/`, () =>
            HttpResponse.json({ error: 'Invalid refresh token' }, { status: 401 })));
        const access = await refreshAccessToken();
        expect(access).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('keeps tokens intact on a 429 — a rate limit is not an invalid session', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/refresh-token/`, () =>
            HttpResponse.json({ error: 'Too many requests' }, { status: 429 })));
        const access = await refreshAccessToken();
        expect(access).toBeNull();
        // The refresh token must survive a transient rate limit so a retry can succeed shortly after.
        expect(localStorage.getItem('refresh_token')).toBe('some-refresh');
    });
});
