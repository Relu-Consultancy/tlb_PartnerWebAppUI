import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { PartnerAccessOTP } from '../PartnerAccessOTP';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();
const mockAuthData = { value: 'test@example.com', type: 'email' as const };

function renderPartnerAccessOTP() {
    return render(<PartnerAccessOTP onNavigate={mockNavigate} authData={mockAuthData} />);
}

async function fillAndSubmit() {
    const user = userEvent.setup();
    const inputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) await user.type(inputs[i], '1');
    await user.click(screen.getByRole('button', { name: /verify & continue/i }));
}

beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
});

describe('PartnerAccessOTP — verify OTP API', () => {
    it('calls verifyOtp and navigates to PARTNER_CATEGORY on success', async () => {
        renderPartnerAccessOTP();
        await fillAndSubmit();
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('PARTNER_CATEGORY'));
    });

    it('shows the backend-provided message on a generic verify-otp failure instead of hiding it', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/verify-otp/`, () =>
            HttpResponse.json({ error: 'OTP has expired' }, { status: 400 })));
        renderPartnerAccessOTP();
        await fillAndSubmit();
        await waitFor(() => expect(screen.getByText('OTP has expired')).toBeInTheDocument());
    });

    it('shows a friendly "already registered" message and redirects to LOGIN when the email is already a partner', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/verify-otp/`, () =>
            HttpResponse.json({ error: 'This account is already registered and not allowed in signup' }, { status: 400 })));
        renderPartnerAccessOTP();
        await fillAndSubmit();
        await waitFor(() => expect(screen.getByText(/already registered\. please log in instead/i)).toBeInTheDocument());
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('LOGIN'), { timeout: 3000 });
        expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('shows a "too many attempts" toast on a 429, not the generic invalid-OTP message', async () => {
        server.use(http.post(`${BASE}/api/v1/auth/verify-otp/`, () =>
            HttpResponse.json({ error: 'Too many requests' }, { status: 429 })));
        renderPartnerAccessOTP();
        await fillAndSubmit();
        await waitFor(() => expect(screen.getByText(/too many attempts/i)).toBeInTheDocument());
        expect(screen.queryByText('Invalid OTP. Please try again.')).not.toBeInTheDocument();
    });
});
