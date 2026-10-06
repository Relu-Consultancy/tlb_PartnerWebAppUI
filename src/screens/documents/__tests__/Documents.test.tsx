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
    const fillAll = async (user: ReturnType<typeof userEvent.setup>, opts: { bank?: boolean } = { bank: true }) => {
        await waitFor(() => expect(screen.getByPlaceholderText('ABCDE1234F')).toBeInTheDocument());
        await user.type(screen.getByPlaceholderText('ABCDE1234F'), 'ABCDE1234F');
        if (opts.bank) {
            await user.type(screen.getByPlaceholderText('As per bank records'), 'Asha Rao');
            await user.type(screen.getByPlaceholderText(/12-digit account number/i), '123456789012');
            await user.type(screen.getByPlaceholderText('HDFC0001234'), 'HDFC0001234');
        }
    };

    it('asks for the bank account when only a PAN is filled — the API only takes them together (QA)', async () => {
        const warnSpy = vi.spyOn(toast, 'warning').mockImplementation(() => 0);
        let posted = 0;
        server.use(
            http.post(`${BASE}/api/v1/partner/verification/`, () => {
                posted += 1;
                return HttpResponse.json({ success: true, data: {} });
            })
        );
        const user = userEvent.setup();
        renderScreen();
        await fillAll(user, { bank: false });
        await user.click(screen.getAllByRole('button', { name: /save documents/i })[0]);

        await waitFor(() => expect(warnSpy).toHaveBeenCalled());
        expect(String(warnSpy.mock.calls[0][0])).toMatch(/Add your bank account below/i);
        // The missing bank fields are marked, not just mentioned in a toast.
        expect(screen.getByText('Enter the account holder name')).toBeInTheDocument();
        expect(screen.getByText('Enter the account number')).toBeInTheDocument();
        expect(screen.getByText('Enter the IFSC code')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('As per bank records')).toHaveAttribute('aria-invalid', 'true');
        expect(posted).toBe(0);
        warnSpy.mockRestore();
    });

    it('submits PAN and bank account together in one request', async () => {
        let body: any = null;
        server.use(
            http.post(`${BASE}/api/v1/partner/verification/`, async ({ request }) => {
                body = await request.json();
                return HttpResponse.json({ success: true, data: {} });
            })
        );
        const user = userEvent.setup();
        renderScreen();
        await fillAll(user);
        await user.click(screen.getAllByRole('button', { name: /save documents/i })[0]);

        await waitFor(() => expect(body).not.toBeNull());
        expect(body).toMatchObject({
            pan_number: 'ABCDE1234F',
            account_holder_name: 'Asha Rao',
            account_number: '123456789012',
            ifsc_code: 'HDFC0001234',
        });
        expect(body).not.toHaveProperty('gst_number');
    });

    it.each([0, 1])('Save button %i sends exactly one request, even when double-tapped', async (index) => {
        let posted = 0;
        server.use(
            http.post(`${BASE}/api/v1/partner/verification/`, async () => {
                posted += 1;
                await new Promise((r) => setTimeout(r, 50));
                return HttpResponse.json({ success: true, data: {} });
            })
        );
        const user = userEvent.setup();
        renderScreen();
        await fillAll(user);
        const button = screen.getAllByRole('button', { name: /save documents/i })[index];
        await user.dblClick(button);

        await waitFor(() => expect(posted).toBeGreaterThan(0));
        await new Promise((r) => setTimeout(r, 150));
        expect(posted).toBe(1);
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
