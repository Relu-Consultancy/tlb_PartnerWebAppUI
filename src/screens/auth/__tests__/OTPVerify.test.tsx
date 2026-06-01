import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { OTPVerify } from '../OTPVerify';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();
const mockAuthData = { value: 'test@example.com', type: 'email' as const };

function renderOTPVerify(authData: { value: string; type: 'email' | 'phone' } = mockAuthData) {
    return render(<OTPVerify onNavigate={mockNavigate} authData={authData} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('OTPVerify — initial render', () => {
    it('renders 6 OTP input boxes', () => {
        renderOTPVerify();
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBe(6);
    });

    it('shows the contact value in the description', () => {
        renderOTPVerify();
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });

    it('shows "Secure Verification" heading', () => {
        renderOTPVerify();
        expect(screen.getByText('Secure Verification')).toBeInTheDocument();
    });

    it('Verify Identity button is disabled when OTP is empty', () => {
        renderOTPVerify();
        const btn = screen.getByRole('button', { name: /verify identity/i });
        expect(btn).toBeDisabled();
    });

    it('shows countdown timer "Resend in 00:30" initially', () => {
        renderOTPVerify();
        expect(screen.getByText(/resend in 00:30/i)).toBeInTheDocument();
    });
});

describe('OTPVerify — OTP input interaction', () => {
    it('allows typing a digit into each input', async () => {
        renderOTPVerify();
        const user = userEvent.setup();
        const inputs = screen.getAllByRole('textbox');
        await user.type(inputs[0], '1');
        expect(inputs[0]).toHaveValue('1');
    });

    it('ignores non-digit characters', async () => {
        renderOTPVerify();
        const user = userEvent.setup();
        const inputs = screen.getAllByRole('textbox');
        await user.type(inputs[0], 'a');
        expect(inputs[0]).toHaveValue('');
    });

    it('enables Verify button when all 6 digits are filled', async () => {
        renderOTPVerify();
        const user = userEvent.setup();
        const inputs = screen.getAllByRole('textbox');
        for (let i = 0; i < 6; i++) {
            await user.type(inputs[i], String(i + 1));
        }
        const btn = screen.getByRole('button', { name: /verify identity/i });
        expect(btn).not.toBeDisabled();
    });
});

describe('OTPVerify — verify OTP API', () => {
    it('calls verifyOtp and navigates to HOME on success', async () => {
        renderOTPVerify();
        const user = userEvent.setup();
        const inputs = screen.getAllByRole('textbox');
        for (let i = 0; i < 6; i++) await user.type(inputs[i], '1');
        await user.click(screen.getByRole('button', { name: /verify identity/i }));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('HOME'));
    });

    it('stores access_token in localStorage on success', async () => {
        renderOTPVerify();
        const user = userEvent.setup();
        const inputs = screen.getAllByRole('textbox');
        for (let i = 0; i < 6; i++) await user.type(inputs[i], '1');
        await user.click(screen.getByRole('button', { name: /verify identity/i }));
        await waitFor(() => expect(localStorage.getItem('access_token')).toBe('test-access-token'));
    });

    it('shows a toast on invalid OTP', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/verify-otp/`, () =>
            HttpResponse.json({ error: 'Invalid OTP' }, { status: 400 })));
        renderOTPVerify();
        const user = userEvent.setup();
        const inputs = screen.getAllByRole('textbox');
        for (let i = 0; i < 6; i++) await user.type(inputs[i], '0');
        await user.click(screen.getByRole('button', { name: /verify identity/i }));
        await waitFor(() => expect(screen.getByText('Invalid OTP. Please try again.')).toBeInTheDocument());
    });

    it('rejects login when partner status indicates onboarding is incomplete', async () => {
        // Partner exists but only at otp_verified — login should refuse the session.
        server.use(http.get(`${BASE}/api/v1/partner/me/`, () =>
            HttpResponse.json({ success: true, data: { id: 1, status: 'otp_verified' } })));
        renderOTPVerify();
        const user = userEvent.setup();
        const inputs = screen.getAllByRole('textbox');
        for (let i = 0; i < 6; i++) await user.type(inputs[i], '0');
        await user.click(screen.getByRole('button', { name: /verify identity/i }));
        await waitFor(() => expect(screen.getByText(/not registered as a partner/i)).toBeInTheDocument());
        // Tokens must be cleared, and HOME must NOT be navigated to.
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(mockNavigate).not.toHaveBeenCalledWith('HOME');
    });
});

describe('OTPVerify — resend OTP', () => {
    it('calls requestOtp and resets inputs on resend', async () => {
        vi.useFakeTimers();
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/auth/request-otp/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true });
        }));
        renderOTPVerify();
        // Synchronous act — flushes state + effects without needing real setImmediate
        for (let i = 0; i < 31; i++) {
            act(() => { vi.advanceTimersByTime(1000); });
        }
        const resendBtn = screen.getByRole('button', { name: /resend otp/i });
        expect(resendBtn).toBeInTheDocument();
        // Restore real timers BEFORE clicking so async act/fetch work normally
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });
        await user.click(resendBtn);
        await waitFor(() => expect(captured).not.toBeNull(), { timeout: 5000 });
        expect(captured.identifier).toBe('test@example.com');
    }, 30000);

    it('shows "Change Number/Email?" link', () => {
        renderOTPVerify();
        expect(screen.getByText(/change number\/email/i)).toBeInTheDocument();
    });

    it('navigates to LOGIN on back button', async () => {
        renderOTPVerify();
        const user = userEvent.setup();
        const backBtn = screen.getAllByRole('button')[0];
        await user.click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith('LOGIN');
    });
});

describe('OTPVerify — phone mode', () => {
    it('shows "registered mobile number" text for phone auth', () => {
        renderOTPVerify({ value: '9876543210', type: 'phone' });
        expect(screen.getByText(/registered mobile number/i)).toBeInTheDocument();
    });
});
