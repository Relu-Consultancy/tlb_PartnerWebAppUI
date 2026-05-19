import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { requestOtp, verifyOtp, getCurrentUser, logout } from '../auth';

const BASE = 'https://tlb-api.reluconsultancy.in';

describe('requestOtp', () => {
    it('sends POST with identifier and identifier_type', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/auth/request-otp/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, message: 'OTP sent' });
        }));
        const res = await requestOtp('test@example.com', 'email');
        expect(captured.identifier).toBe('test@example.com');
        expect(captured.identifier_type).toBe('email');
        expect(res.success).toBe(true);
    });

    it('sends phone identifier type', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/auth/request-otp/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true });
        }));
        await requestOtp('9876543210', 'phone');
        expect(captured.identifier_type).toBe('phone');
    });

    it('throws on 400 (invalid identifier)', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/request-otp/`, () =>
            HttpResponse.json({ error: 'Invalid identifier' }, { status: 400 })));
        await expect(requestOtp('bad', 'email')).rejects.toThrow();
    });

    it('throws on 429 (rate limit)', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/request-otp/`, () =>
            HttpResponse.json({ error: 'Too many requests' }, { status: 429 })));
        await expect(requestOtp('test@test.com', 'email')).rejects.toThrow();
    });
});

describe('verifyOtp', () => {
    it('sends identifier, otp, and role', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/auth/verify-otp/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { access_token: 'acc', refresh_token: 'ref' } });
        }));
        const res = await verifyOtp('test@example.com', '123456', 'partner');
        expect(captured.identifier).toBe('test@example.com');
        expect(captured.otp).toBe('123456');
        expect(captured.role).toBe('partner');
        expect(res.data.access_token).toBe('acc');
    });

    it('defaults role to partner when not specified', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/auth/verify-otp/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { access_token: 'acc', refresh_token: 'ref' } });
        }));
        await verifyOtp('test@example.com', '123456');
        expect(captured.role).toBe('partner');
    });

    it('throws on 400 (wrong OTP)', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/verify-otp/`, () =>
            HttpResponse.json({ error: 'Invalid OTP' }, { status: 400 })));
        await expect(verifyOtp('test@example.com', '000000')).rejects.toThrow();
    });

    it('throws on 410 (expired OTP)', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/verify-otp/`, () =>
            HttpResponse.json({ error: 'OTP expired' }, { status: 410 })));
        await expect(verifyOtp('test@example.com', '111111')).rejects.toThrow();
    });
});

describe('getCurrentUser', () => {
    it('returns user profile', async () => {
        server.use(http.get(`${BASE}/api/v1/auth/me/`, () =>
            HttpResponse.json({ success: true, data: { id: 1, email: 'test@example.com' } })));
        const res = await getCurrentUser();
        expect(res.data.email).toBe('test@example.com');
    });

    it('throws on 401 (unauthenticated)', async () => {
        server.use(http.get(`${BASE}/api/v1/auth/me/`, () =>
            HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })));
        await expect(getCurrentUser()).rejects.toThrow();
    });
});

describe('logout', () => {
    beforeEach(() => {
        localStorage.setItem('access_token', 'some-token');
        localStorage.setItem('refresh_token', 'some-refresh');
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('clears tokens from localStorage after logout', async () => {
        await logout('some-refresh');
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('clears tokens even when server returns error', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/logout/`, () =>
            HttpResponse.json({ error: 'Server error' }, { status: 500 })));
        await logout('some-refresh');
        expect(localStorage.getItem('access_token')).toBeNull();
    });
});
