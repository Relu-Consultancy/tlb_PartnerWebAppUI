import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { invalidatePortalSummary } from '../api/portalSummary';
import { PartnerProvider, usePartner } from '../context/PartnerContext';
import { Home } from '../screens/dashboard/Dashboard';
import { ServiceListings } from '../screens/services/ServiceListings';
import { sanitizeEntities, toEntityType } from '../components/portal/partnerMeta';

const BASE = 'https://tlb-api.reluconsultancy.in';

beforeEach(() => {
    sessionStorage.clear();
    invalidatePortalSummary();
});

// Dashboard, then My listings — one provider, as in the app, so whatever the
// dashboard puts in the list is exactly what My listings then reads.
const DashboardThenListings: React.FC = () => {
    const [screenName, setScreenName] = useState<'home' | 'listings'>('home');
    const { allowedEntities } = usePartner();
    return (
        <>
            <output data-testid="entities">{allowedEntities.join(',')}</output>
            {screenName === 'home' ? (
                <>
                    <Home onNavigate={vi.fn()} />
                    <button onClick={() => setScreenName('listings')}>Test: switch to My listings</button>
                </>
            ) : (
                <ServiceListings onNavigate={vi.fn()} />
            )}
        </>
    );
};

describe('service types from the backend never crash My listings (QA: "Ze[n] is not a function")', () => {
    it.each([
        ['lower-case names', [{ id: 1, name: 'events' }]],
        ['singular names', [{ id: 1, name: 'Event' }]],
        ['plain strings', ['events']],
        [
            'an unknown category alongside',
            [
                { id: 1, name: 'Events' },
                { id: 9, name: 'Workshops' },
            ],
        ],
    ])('%s', async (_label, categories) => {
        sessionStorage.setItem('allowedEntities', JSON.stringify(['Events']));
        server.use(
            http.get(`${BASE}/api/v1/partner/me/`, () =>
                HttpResponse.json({ success: true, data: { id: 1, status: 'approved', business_name: 'Zoloner Brander', categories } })
            )
        );
        render(
            <PartnerProvider>
                <DashboardThenListings />
            </PartnerProvider>
        );

        // The dashboard has read the partner and synced the service types.
        await waitFor(() => expect(screen.getByTestId('entities')).toHaveTextContent('Events'));
        await new Promise((r) => setTimeout(r, 300));
        expect(screen.getByTestId('entities').textContent).toBe('Events');

        await userEvent.click(screen.getByRole('button', { name: 'Test: switch to My listings' }));

        await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(), { timeout: 4000 });
        expect(screen.queryByText(/is not a function/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Failed to load listings/i)).not.toBeInTheDocument();
    });
});

describe('setAllowedEntities is the single gatekeeper', () => {
    it('stores only real service types, whatever a caller passes', () => {
        const { result } = renderHook(() => usePartner(), { wrapper: PartnerProvider });
        act(() => {
            result.current.setAllowedEntities(['events', 'Workshops', 'Classes', 'Classes', null] as any);
        });
        expect(result.current.allowedEntities).toEqual(['Events', 'Classes']);
        expect(JSON.parse(sessionStorage.getItem('allowedEntities') || '[]')).toEqual(['Events', 'Classes']);
    });

    it('cleans a stored list on load too', () => {
        sessionStorage.setItem('allowedEntities', JSON.stringify(['venue', 'Programs', 42]));
        const { result } = renderHook(() => usePartner(), { wrapper: PartnerProvider });
        expect(result.current.allowedEntities).toEqual(['Venues', 'Programs']);
    });
});

describe('toEntityType / sanitizeEntities', () => {
    it('reads names case- and plural-insensitively', () => {
        expect(toEntityType(' events ')).toBe('Events');
        expect(toEntityType('Class')).toBe('Classes');
        expect(toEntityType('Workshops')).toBeNull();
        expect(toEntityType(undefined)).toBeNull();
    });

    it('keeps order, drops repeats and unknowns, and survives non-arrays', () => {
        expect(sanitizeEntities(['Programs', 'events', 'Programs', 'x'])).toEqual(['Programs', 'Events']);
        expect(sanitizeEntities('Events')).toEqual([]);
        expect(sanitizeEntities(null)).toEqual([]);
    });
});
