import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { invalidatePortalSummary } from '../../../api/portalSummary';
import { PartnerProvider } from '../../../context/PartnerContext';
import { Home } from '../Dashboard';

const BASE = 'https://tlb-api.reluconsultancy.in';

beforeEach(() => {
    sessionStorage.clear();
    invalidatePortalSummary();
});

describe('Dashboard — Performance by service', () => {
    it('"Full analytics" opens the Analytics page, not a preview of the same table', async () => {
        // QA: the link opened a modal repeating the dashboard card's own numbers.
        sessionStorage.setItem('allowedEntities', JSON.stringify(['Events']));
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
                HttpResponse.json({ success: true, data: [{ id: 'e1', title: 'Summer Fest', status: 'published', is_paused: false }] })
            )
        );
        const onNavigate = vi.fn();
        const user = userEvent.setup();
        render(
            <PartnerProvider>
                <Home onNavigate={onNavigate} />
            </PartnerProvider>
        );

        await user.click(await screen.findByRole('button', { name: /Full analytics/i }, { timeout: 8000 }));

        expect(onNavigate).toHaveBeenCalledWith('ANALYTICS');
        expect(screen.queryByText('Performance summary')).not.toBeInTheDocument();
    }, 20000);
});
