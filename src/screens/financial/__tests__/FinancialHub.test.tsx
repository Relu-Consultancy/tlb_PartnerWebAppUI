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

    it('shows an add-account prompt when no bank is on file', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/bank-details/`, () => new HttpResponse(null, { status: 404 })));
        renderScreen();
        await waitFor(() => expect(screen.getByText('No bank account linked yet.')).toBeInTheDocument());
        expect(screen.getByText('Add payout account →')).toBeInTheDocument();
    });
});
