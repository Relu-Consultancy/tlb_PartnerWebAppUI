import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { PartnerProvider } from '../../context/PartnerContext';
import { TopHeader } from '../TopHeader';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

function renderTopHeader() {
    return render(
        <PartnerProvider>
            <TopHeader onOpenSidebar={vi.fn()} onNavigate={mockNavigate} />
        </PartnerProvider>
    );
}

beforeEach(() => {
    mockNavigate.mockClear();
});

describe('TopHeader — account chip business name', () => {
    it('shows the saved business name from /partner/profile/ even when /partner/me/ omits it', async () => {
        // Reproduces the real-world bug: /partner/me/ has no business_name, but the
        // canonical /partner/profile/ endpoint (what EditProfile itself reads/writes) does.
        server.use(
            http.get(`${BASE}/api/v1/partner/me/`, () =>
                HttpResponse.json({ success: true, data: { id: 1, status: 'approved', is_verified: true } })
            ),
            http.get(`${BASE}/api/v1/partner/profile/`, () =>
                HttpResponse.json({ success: true, data: { business_name: 'Aurora Dance Studio' } })
            )
        );
        renderTopHeader();
        await waitFor(() => expect(screen.getByText('Aurora Dance Studio')).toBeInTheDocument());
        expect(screen.queryByText('Your business')).not.toBeInTheDocument();
    });

    it('falls back to "Your business" only when neither endpoint has a name', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/me/`, () =>
                HttpResponse.json({ success: true, data: { id: 1, status: 'approved', is_verified: true } })
            ),
            http.get(`${BASE}/api/v1/partner/profile/`, () => HttpResponse.json({ success: true, data: {} }))
        );
        renderTopHeader();
        await waitFor(() => expect(screen.getByText('Your business')).toBeInTheDocument());
    });
});
