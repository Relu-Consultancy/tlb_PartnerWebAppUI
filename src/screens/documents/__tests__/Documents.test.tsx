import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import Documents, { humanizeFieldErrors } from '../Documents';
import { toast } from '../../../components/ui';

const BASE = 'https://tlb-api.reluconsultancy.in';
const renderScreen = () => render(<Documents onNavigate={vi.fn()} onOpenSidebar={vi.fn()} />);

beforeEach(() => {
    sessionStorage.clear();
});

describe('humanizeFieldErrors', () => {
    it('turns the backend’s serializer repr into something a partner can read', () => {
        // Exactly what reached the toast in production.
        const raw =
            "{'account_holder_name': [ErrorDetail(string='This field may not be blank.', code='blank')], " +
            "'account_number': [ErrorDetail(string='This field may not be blank.', code='blank')]}";
        expect(humanizeFieldErrors(raw)).toBe('Please fill Account holder name, Account number before saving.');
    });

    it('leaves a message it cannot parse alone, so nothing is swallowed', () => {
        expect(humanizeFieldErrors('Server exploded')).toBeNull();
        expect(humanizeFieldErrors('')).toBeNull();
    });
});

describe('Documents — bank details', () => {
    it('blocks a half-filled bank section instead of letting the API reject it', async () => {
        const warnSpy = vi.spyOn(toast, 'warning').mockImplementation(() => 0);
        let posted = false;
        server.use(
            http.post(`${BASE}/api/v1/partner/verification/`, () => {
                posted = true;
                return HttpResponse.json({ success: true, data: {} });
            })
        );
        const user = userEvent.setup();
        renderScreen();

        await waitFor(() => expect(screen.getByPlaceholderText('ABCDE1234F')).toBeInTheDocument());
        await user.type(screen.getByPlaceholderText('ABCDE1234F'), 'ABCDE1234F');
        await user.type(screen.getByPlaceholderText('As per bank records'), 'Abusu');
        await user.click(screen.getAllByRole('button', { name: /save documents/i })[0]);

        await waitFor(() => expect(warnSpy).toHaveBeenCalled());
        expect(String(warnSpy.mock.calls[0][0])).toMatch(/bank details go together/i);
        expect(posted).toBe(false);
    });

    it('accepts a PAN on its own and sends only the filled fields', async () => {
        let body: any = null;
        server.use(
            http.post(`${BASE}/api/v1/partner/verification/`, async ({ request }) => {
                body = await request.json();
                return HttpResponse.json({ success: true, data: {} });
            })
        );
        const user = userEvent.setup();
        renderScreen();

        await waitFor(() => expect(screen.getByPlaceholderText('ABCDE1234F')).toBeInTheDocument());
        await user.type(screen.getByPlaceholderText('ABCDE1234F'), 'ABCDE1234F');
        await user.click(screen.getAllByRole('button', { name: /save documents/i })[0]);

        await waitFor(() => expect(body).not.toBeNull());
        expect(body.pan_number).toBe('ABCDE1234F');
        // Blank bank fields are what triggered "This field may not be blank".
        expect(body).not.toHaveProperty('account_number');
        expect(body).not.toHaveProperty('ifsc_code');
    });

    it('caps the account number at 12 digits', async () => {
        const user = userEvent.setup();
        renderScreen();

        await waitFor(() => expect(screen.getByPlaceholderText(/12-digit account number/i)).toBeInTheDocument());
        const field = screen.getByPlaceholderText(/12-digit account number/i) as HTMLInputElement;
        await user.type(field, '1234567890123456');
        expect(field.value).toBe('123456789012');
    });
});

describe('Documents — verification banner', () => {
    const partnerIs = (data: Record<string, unknown>) =>
        server.use(http.get(`${BASE}/api/v1/partner/me/`, () => HttpResponse.json({ success: true, data })));

    it('does not claim "Verified Partner" for an is_verified account still at activated_limited', async () => {
        partnerIs({ id: 1, status: 'activated_limited', is_verified: true });
        renderScreen();

        await waitFor(() => expect(screen.getByPlaceholderText('ABCDE1234F')).toBeInTheDocument());
        expect(screen.queryByText(/Verified Partner/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Verification Pending/i)).toBeInTheDocument();
    });

    it('shows Verified Partner once the status really is approved', async () => {
        partnerIs({ id: 1, status: 'approved', is_verified: true });
        renderScreen();

        await waitFor(() => expect(screen.getByText(/Verified Partner/i)).toBeInTheDocument());
    });
});
