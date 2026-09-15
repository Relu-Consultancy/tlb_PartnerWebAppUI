import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { Reviews } from '../Reviews';
import { PartnerProvider } from '../../../context/PartnerContext';

const BASE = 'https://tlb-api.reluconsultancy.in';

function renderScreen() {
    sessionStorage.setItem('allowedEntities', JSON.stringify(['Events', 'Classes', 'Venues']));
    return render(
        <PartnerProvider>
            <Reviews onNavigate={vi.fn()} />
        </PartnerProvider>
    );
}

beforeEach(() => {
    sessionStorage.clear();
});

describe('Reviews — loading and display', () => {
    it('shows a skeleton loader initially', () => {
        renderScreen();
        expect(document.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('shows the real listing rating and both reviews from the default fixtures', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByText('Meera K.')).toBeInTheDocument());
        expect(screen.getByText('Arun V.')).toBeInTheDocument();
        expect(screen.getByText('4.6')).toBeInTheDocument();
    });

    it('shows Coming soon for the Business rating and Awaiting a reply tiles', async () => {
        renderScreen();
        await waitFor(() => screen.getByText('Meera K.'));
        expect(screen.getAllByText('Coming soon').length).toBeGreaterThanOrEqual(2);
    });
});

describe('Reviews — tabs', () => {
    it('shows a Coming soon panel for the Business tab', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Meera K.'));
        await user.click(screen.getByRole('tab', { name: /^Business/ }));
        expect(screen.getByText(/every review it returns is tied to one of your listings/i)).toBeInTheDocument();
    });

    it('shows a Coming soon panel for the Awaiting reply tab', async () => {
        renderScreen();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Meera K.'));
        await user.click(screen.getByRole('tab', { name: /^Awaiting reply/ }));
        expect(screen.getByText(/tracking which ones are still awaiting a reply/i)).toBeInTheDocument();
    });

    it('shows an error message when the review feed fails to load', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/reviews/`, () =>
            HttpResponse.json({ error: { message: 'Reviews unavailable' } }, { status: 500 })));
        renderScreen();
        await waitFor(() => expect(screen.getByText(/reviews unavailable/i)).toBeInTheDocument());
    });
});
