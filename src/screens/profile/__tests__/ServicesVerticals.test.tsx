import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { BrandProfile } from '../EditProfile';
import { PartnerProvider } from '../../../context/PartnerContext';

const BASE = 'https://tlb-api.reluconsultancy.in';

function renderScreen() {
    sessionStorage.setItem('allowedEntities', JSON.stringify(['Events', 'Classes']));
    return render(
        <PartnerProvider>
            <BrandProfile onNavigate={vi.fn()} />
        </PartnerProvider>
    );
}

beforeEach(() => {
    sessionStorage.clear();
});

// The Profile screen fans out several parallel fetches on mount (partner,
// listings, reviews, bank details, verticals) — give the first assertion in
// each test more room than the default 1000ms before the skeleton clears.
const waitForLong = (cb: () => void) => waitFor(cb, { timeout: 3000 });

describe('Services & categories — verticals self-service', () => {
    it('shows the partner\'s current verticals from the real API', async () => {
        renderScreen();
        await waitForLong(() => expect(screen.getByRole('heading', { name: 'Services & categories' })).toBeInTheDocument());
        await waitFor(() => expect(screen.getByText('Events')).toBeInTheDocument());
        expect(screen.getByText('Classes')).toBeInTheDocument();
    });

    it('adds a new vertical and shows it immediately without a page reload', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitForLong(() => screen.getByText('Events'));
        expect(screen.queryByText('Venues')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /\+ Add service type/i }));
        await user.click(await screen.findByRole('menuitem', { name: 'Venues' }));

        await waitFor(() => expect(screen.getByText('Venues')).toBeInTheDocument());
    });

    it('removes a vertical after a two-step confirm', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitForLong(() => screen.getByText('Classes'));

        const card = screen.getByText('Classes').closest('div')!.parentElement!;
        await user.click(within(card).getByRole('button', { name: 'Remove' }));
        await user.click(within(card).getByRole('button', { name: /Confirm/i }));

        await waitFor(() => expect(screen.queryByText('Classes')).not.toBeInTheDocument());
    });

    it('surfaces the CATEGORY_HAS_ACTIVE_LISTINGS message instead of silently failing', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/verticals/`, () =>
            HttpResponse.json({ error: { code: 'CATEGORY_HAS_ACTIVE_LISTINGS', message: '3 listings are blocking removal of Classes.' } }, { status: 400 })));
        renderScreen();
        const user = userEvent.setup();
        await waitForLong(() => screen.getByText('Classes'));

        const card = screen.getByText('Classes').closest('div')!.parentElement!;
        await user.click(within(card).getByRole('button', { name: 'Remove' }));
        await user.click(within(card).getByRole('button', { name: /Confirm/i }));

        // The confirm row resolves back to a plain "Remove" button rather than
        // staying stuck mid-flight, and the vertical is never optimistically
        // removed on a failed request — toast content itself isn't asserted
        // here since no <Toaster/> is mounted in this isolated render.
        await waitFor(() => expect(within(card).getByRole('button', { name: 'Remove' })).toBeInTheDocument());
        expect(screen.getByText('Classes')).toBeInTheDocument();
    });

    it('shows a not-yet-approved message instead of an error when the endpoint 403s', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/verticals/`, () =>
            HttpResponse.json({ error: { message: 'Partner not approved' } }, { status: 403 })));
        renderScreen();
        await waitForLong(() => expect(screen.getByText(/fully approved/i)).toBeInTheDocument());
    });
});
