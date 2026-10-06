import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { mockCoupon } from '../../../test/msw/handlers';
import { Coupons } from '../Coupons';
import { PartnerProvider } from '../../../context/PartnerContext';
import { PHONE_QUERY, useMediaQuery } from '../../../hooks/useMediaQuery';

const BASE = 'https://tlb-api.reluconsultancy.in';

// A matchMedia whose answer the test controls, with change listeners.
const fakeScreen = (phone: boolean) => {
    const listeners = new Set<() => void>();
    const mql = {
        get matches() {
            return state.phone;
        },
        media: PHONE_QUERY,
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    };
    const state = { phone };
    window.matchMedia = vi.fn(() => mql as unknown as MediaQueryList);
    return {
        resize: (toPhone: boolean) => {
            state.phone = toPhone;
            listeners.forEach((fn) => fn());
        },
    };
};

afterEach(() => {
    delete (window as any).matchMedia;
});

const renderCoupons = () => {
    sessionStorage.setItem('allowedEntities', JSON.stringify(['Events']));
    server.use(
        http.get(`${BASE}/api/v1/partner/coupons/`, () => HttpResponse.json({ success: true, data: [mockCoupon] })),
        http.get(`${BASE}/api/v1/partner/coupons/:id/`, () => HttpResponse.json({ success: true, data: mockCoupon })),
        http.get(`${BASE}/api/v1/partner/coupons/:id/usages/`, () => HttpResponse.json({ success: true, data: [] }))
    );
    return render(
        <PartnerProvider>
            <Coupons onNavigate={vi.fn()} />
        </PartnerProvider>
    );
};

describe('Coupons on a phone (QA: the table only scrolled sideways)', () => {
    it('shows each coupon as a card with its details and actions', async () => {
        fakeScreen(true);
        renderCoupons();

        const cards = await screen.findByLabelText('Coupons');
        expect(within(cards).getByText('MONSOON20')).toBeInTheDocument();
        expect(within(cards).getByText('Applies to')).toBeInTheDocument();
        expect(within(cards).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
        expect(document.querySelector('[class*="min-w-[1000px]"]')).toBeNull();
    });

    it('opens the edit form from a card', async () => {
        fakeScreen(true);
        renderCoupons();
        const cards = await screen.findByLabelText('Coupons');
        await userEvent.click(within(cards).getByRole('button', { name: 'Edit' }));
        expect(await screen.findByRole('dialog', { name: 'Edit coupon' })).toBeInTheDocument();
    });

    it('keeps the full table on wider screens', async () => {
        fakeScreen(false);
        renderCoupons();
        await waitFor(() => expect(screen.getByText('MONSOON20')).toBeInTheDocument());
        expect(screen.queryByLabelText('Coupons')).not.toBeInTheDocument();
        expect(document.querySelector('[class*="min-w-[1000px]"]')).not.toBeNull();
    });
});

describe('useMediaQuery', () => {
    it('follows the screen as it resizes', () => {
        const screenSize = fakeScreen(false);
        const { result } = renderHook(() => useMediaQuery(PHONE_QUERY));
        expect(result.current).toBe(false);
        act(() => screenSize.resize(true));
        expect(result.current).toBe(true);
    });

    it('reports the wide layout where matchMedia does not exist', () => {
        const { result } = renderHook(() => useMediaQuery(PHONE_QUERY));
        expect(result.current).toBe(false);
    });
});
