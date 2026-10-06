import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { Login } from '../Login';
import { PartnerAccess } from '../PartnerAccess';
import { requestOtp } from '../../../api/auth';

const BASE = 'https://tlb-api.reluconsultancy.in';
const REQUEST_OTP = `${BASE}/api/v1/auth/request-otp/`;

// What the backend actually answers today (QA screenshot) — a stringified DRF
// ValidationError, which used to be shown to the partner verbatim.
const RAW_PHONE_REFUSAL =
    "{'identifier': [ErrorDetail(string='Enter a valid email address.', code='invalid')], 'identifier_type': [ErrorDetail(string='\"phone\" is not a valid choice.', code='invalid_choice')]}";

describe('Login — mobile OTP is not available yet', () => {
    it('opens on Email, the channel that works', () => {
        render(<Login onNavigate={vi.fn()} />);
        expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('98765 43210')).not.toBeInTheDocument();
    });

    it('says so on the Mobile tab and points to email, instead of sending a request that fails', async () => {
        let requests = 0;
        server.use(
            http.post(REQUEST_OTP, () => {
                requests += 1;
                return HttpResponse.json({ error: RAW_PHONE_REFUSAL }, { status: 400 });
            })
        );
        render(<Login onNavigate={vi.fn()} />);

        await userEvent.click(screen.getByRole('button', { name: /Mobile/ }));

        expect(await screen.findByText(/Mobile OTP isn’t available yet/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send OTP/i })).toBeDisabled();
        expect(screen.queryByText(/ErrorDetail/)).not.toBeInTheDocument();
        expect(requests).toBe(0);

        await userEvent.click(screen.getByRole('button', { name: /Use email instead/i }));
        expect(await screen.findByPlaceholderText('you@company.com')).toBeInTheDocument();
    });

    it('still sends an email OTP and moves on to verification', async () => {
        const onNavigate = vi.fn();
        let body: any;
        server.use(
            http.post(REQUEST_OTP, async ({ request }) => {
                body = await request.json();
                return HttpResponse.json({ success: true, data: {} });
            })
        );
        render(<Login onNavigate={onNavigate} />);

        await userEvent.type(screen.getByPlaceholderText('you@company.com'), 'partner@example.com');
        await userEvent.click(screen.getByRole('button', { name: /Send OTP/i }));

        await vi.waitFor(() => expect(onNavigate).toHaveBeenCalledWith('OTP_VERIFY'));
        expect(body).toEqual({ identifier: 'partner@example.com', identifier_type: 'email' });
    });
});

describe('PartnerAccess — mobile OTP is not available yet', () => {
    it('explains that a mobile number can’t be used yet and keeps Send OTP disabled', async () => {
        render(<PartnerAccess onNavigate={vi.fn()} />);
        await userEvent.type(screen.getByPlaceholderText('partner@example.com'), '9021598876');

        expect(screen.getByText(/Mobile OTP isn’t available yet/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send OTP/i })).toBeDisabled();
    });
});

describe('requestOtp', () => {
    it('refuses a phone OTP up front with a readable message', async () => {
        await expect(requestOtp('+919021598876', 'phone')).rejects.toThrow(/Mobile OTP isn’t available yet/);
    });

    it('never surfaces a raw serializer dump', async () => {
        server.use(
            http.post(REQUEST_OTP, () =>
                HttpResponse.json(
                    { error: "{'identifier': [ErrorDetail(string='Enter a valid email address.', code='invalid')]}" },
                    { status: 400 }
                )
            )
        );
        await expect(requestOtp('nope', 'email')).rejects.toThrow(/^Enter a valid email address\.$/);
    });

    it('maps the backend’s phone refusal to the same readable message', async () => {
        server.use(http.post(REQUEST_OTP, () => HttpResponse.json({ error: RAW_PHONE_REFUSAL }, { status: 400 })));
        await expect(requestOtp('a@b.co', 'email')).rejects.toThrow(/Mobile OTP isn’t available yet/);
    });
});
