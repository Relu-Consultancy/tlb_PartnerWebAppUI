import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { PartnerNetwork } from '../PartnerNetwork';
import { Toaster } from '../../../components/ui';

const BASE = 'https://tlb-api.reluconsultancy.in';

const otherPartner = {
    id: 'p1', business_name: 'Studio Aurora', email: 'aurora@example.com', base_city: 'Bengaluru',
    logo: null, bio: 'A pottery studio.', contact_number: null, categories: 'Classes',
    published_listing_count: 3, is_verified: true,
};

beforeEach(() => {
    server.use(
        http.get(`${BASE}/api/v1/partner/network/partners/`, () => HttpResponse.json({ success: true, data: [otherPartner] })),
        http.get(`${BASE}/api/v1/partner/network/partners/p1/`, () => HttpResponse.json({ success: true, data: { ...otherPartner, listings: [] } })),
        http.get(`${BASE}/api/v1/partner/network/blocks/`, () => HttpResponse.json({ success: true, data: [] })),
        http.get(`${BASE}/api/v1/partner/network/conversations/list/`, () => HttpResponse.json({ success: true, data: [] })),
    );
});

const renderScreen = () => render(<><Toaster /><PartnerNetwork onNavigate={vi.fn()} onOpenSidebar={vi.fn()} /></>);

describe('PartnerNetwork — messaging blocked on existing conversations too', () => {
    it('treats a BLOCKED send as terminal: reflects the block and closes the composer', async () => {
        server.use(
            http.post(`${BASE}/api/v1/partner/network/conversations/`, () =>
                HttpResponse.json({ success: false, error: { code: 'BLOCKED', message: 'You cannot message this partner.' } }, { status: 403 })),
        );
        renderScreen();
        const user = userEvent.setup();

        await waitFor(() => expect(screen.getByText('Studio Aurora')).toBeInTheDocument());
        await user.click(screen.getByText('Studio Aurora'));

        await waitFor(() => expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /send message/i }));
        const dialog = screen.getByText('Message Partner').closest('div')!.parentElement!.parentElement!;
        await user.click(within(dialog).getByRole('button', { name: /^send message$/i }));

        await waitFor(() => expect(screen.getByText(/you can no longer message this partner/i)).toBeInTheDocument());
        // The composer must not linger open for a pointless retry.
        expect(screen.queryByPlaceholderText(/write a short enquiry/i)).not.toBeInTheDocument();
        // Reflects the block immediately — the button is disabled without needing a manual reload.
        expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    });

    it('shows a generic error and keeps the composer open for a non-BLOCKED failure', async () => {
        server.use(
            http.post(`${BASE}/api/v1/partner/network/conversations/`, () =>
                HttpResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })),
        );
        renderScreen();
        const user = userEvent.setup();

        await waitFor(() => expect(screen.getByText('Studio Aurora')).toBeInTheDocument());
        await user.click(screen.getByText('Studio Aurora'));
        await waitFor(() => expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /send message/i }));
        const dialog = screen.getByText('Message Partner').closest('div')!.parentElement!.parentElement!;
        await user.click(within(dialog).getByRole('button', { name: /^send message$/i }));

        await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
        expect(screen.getByPlaceholderText(/write a short enquiry/i)).toBeInTheDocument();
    });
});
