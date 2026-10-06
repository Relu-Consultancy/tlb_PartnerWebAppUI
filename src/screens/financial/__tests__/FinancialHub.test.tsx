import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import FinancialHub from '../FinancialHub';
import { PartnerProvider } from '../../../context/PartnerContext';

const BASE = 'https://tlb-api.reluconsultancy.in';

function renderScreen() {
    return render(
        <PartnerProvider>
            <FinancialHub onNavigate={vi.fn()} />
        </PartnerProvider>
    );
}

beforeEach(() => {
    sessionStorage.clear();
});

describe('FinancialHub — loading and display', () => {
    it('shows a skeleton loader initially', () => {
        renderScreen();
        expect(document.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('shows the real paid-out figure and payout account from the default fixtures', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByText('Rs 1,05,910')).toBeInTheDocument());
        expect(screen.getByText(/HDFC Bank ••4412/)).toBeInTheDocument();
        expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('shows Coming soon for available balance, in processing, and the ledger/payout history', async () => {
        renderScreen();
        await waitFor(() => screen.getByText('Rs 1,05,910'));
        expect(screen.getAllByText('Coming soon').length).toBeGreaterThanOrEqual(4);
    });

    it('shows the real revenue-by-vertical breakdown', async () => {
        renderScreen();
        await waitFor(() => screen.getByText('Rs 1,05,910'));
        expect(screen.getByText('Events')).toBeInTheDocument();
        expect(screen.getByText('Rs 47,300')).toBeInTheDocument();
    });
});

describe('FinancialHub — bank details modal', () => {
    it('opens the manage modal pre-filled with the existing bank details', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/HDFC Bank ••4412/));
        await user.click(screen.getByText('Manage payout account →'));
        await waitFor(() => expect(screen.getByRole('heading', { name: 'Update bank account' })).toBeInTheDocument());
        expect(screen.getByDisplayValue('Aviraj Studio')).toBeInTheDocument();
    });
});

describe('FinancialHub — bank account gate', () => {
    it('hides every revenue/payout section behind a connect-bank prompt when no bank is on file', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/bank-details/`, () => new HttpResponse(null, { status: 404 })));
        renderScreen();
        await waitFor(() => expect(screen.getByRole('heading', { name: 'Connect your bank account' })).toBeInTheDocument());
        expect(screen.queryByText('Rs 1,05,910')).not.toBeInTheDocument();
        expect(screen.queryByText('Revenue by vertical')).not.toBeInTheDocument();
        expect(screen.queryByText('Payout account')).not.toBeInTheDocument();
    });

    it('unlocks the sections as soon as the bank form is saved', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/bank-details/`, () => new HttpResponse(null, { status: 404 })),
            http.put(`${BASE}/api/v1/partner/bank-details/`, () =>
                HttpResponse.json({
                    success: true,
                    data: {
                        account_holder_name: 'Aviraj Studio',
                        bank_name: 'HDFC Bank',
                        branch_name: '',
                        account_number_masked: '••9012',
                        ifsc_code: 'HDFC0001234',
                        cancelled_cheque_url: '',
                        consent_given: true,
                        verification_status: 'pending',
                        verification_note: '',
                        updated_at: '2026-09-28T10:00:00Z',
                    },
                })
            )
        );
        renderScreen();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: /add bank account/i }));
        await waitFor(() => screen.getByRole('heading', { name: 'Add bank account' }));

        await user.type(screen.getByPlaceholderText('As per bank records'), 'Aviraj Studio');
        await user.type(screen.getByPlaceholderText('9-18 digit account number'), '123456789012');
        await user.type(screen.getByPlaceholderText('Confirm account number'), '123456789012');
        await user.type(screen.getByPlaceholderText('e.g. HDFC0001234'), 'HDFC0001234');
        await user.click(screen.getByRole('checkbox'));

        await user.click(screen.getByRole('button', { name: 'Save bank details' }));

        await waitFor(() => expect(screen.getByText('Rs 1,05,910')).toBeInTheDocument());
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.queryByRole('heading', { name: 'Connect your bank account' })).not.toBeInTheDocument();
        expect(screen.getByText('Payout account')).toBeInTheDocument();
    });

    it('offers a retry — not the connect prompt — when the bank details fail to load', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/bank-details/`, () =>
                HttpResponse.json({ error: { message: 'Server error' } }, { status: 500 })
            )
        );
        renderScreen();
        await waitFor(() => expect(screen.getByRole('heading', { name: /couldn.t load your payout account/i })).toBeInTheDocument());
        expect(screen.queryByRole('heading', { name: 'Connect your bank account' })).not.toBeInTheDocument();

        server.resetHandlers();
        await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }));
        await waitFor(() => expect(screen.getByText(/HDFC Bank ••4412/)).toBeInTheDocument());
    });
});

describe('FinancialHub — bank dialog opens at its final size (QA: it appeared small, then grew)', () => {
    it('Add bank account opens without any scale/slide transform', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/bank-details/`, () => new HttpResponse(null, { status: 404 })));
        renderScreen();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: /add bank account/i }));

        const dialog = await screen.findByRole('dialog');
        // The old animation started every dialog at scale(0.98) + translateY(8px).
        expect(dialog.style.transform).not.toMatch(/scale|translate/);
    });

    it('renders the overlay at the top of <body>, outside the screen and its animated wrapper', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/bank-details/`, () => new HttpResponse(null, { status: 404 })));
        const { container } = renderScreen();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: /add bank account/i }));

        const dialog = await screen.findByRole('dialog');
        // In place, a transformed ancestor sized the fixed overlay instead of the window.
        expect(container.contains(dialog)).toBe(false);
        expect(dialog.parentElement?.parentElement).toBe(document.body);
    });
});

describe('FinancialHub — bank gate holds for every "no bank" response (QA: sections were reachable)', () => {
    it.each([
        ['200 with data: null', () => HttpResponse.json({ success: true, data: null })],
        ['200 with data: {}', () => HttpResponse.json({ success: true, data: {} })],
        [
            '200 with a blank record',
            () => HttpResponse.json({ success: true, data: { account_holder_name: '', ifsc_code: '', account_number_masked: '' } }),
        ],
        ['404', () => new HttpResponse(null, { status: 404 })],
    ])('shows the connect-bank prompt and hides payouts for %s', async (_label, reply) => {
        server.use(http.get(`${BASE}/api/v1/partner/bank-details/`, reply));
        renderScreen();
        await waitFor(() => expect(screen.getByRole('heading', { name: 'Connect your bank account' })).toBeInTheDocument());
        expect(screen.queryByText('Revenue by vertical')).not.toBeInTheDocument();
        expect(screen.queryByText('Payout account')).not.toBeInTheDocument();
    });
});
