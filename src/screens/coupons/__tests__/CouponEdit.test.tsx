import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { mockCoupon } from '../../../test/msw/handlers';
import { Coupons } from '../Coupons';
import { PartnerProvider } from '../../../context/PartnerContext';
import { toast } from '../../../components/ui';

const BASE = 'https://tlb-api.reluconsultancy.in';

// The coupon from QA's screenshot: 30% off, women only, with a note.
const womenOnly = {
    ...mockCoupon,
    id: 'coupon-w',
    code: 'PERCNETOFFGENDERWOMEN',
    discount_type: 'percent',
    discount_value: 30,
    max_discount: 15,
    min_order_value: 100,
    description: 'Women weekday push',
    target_genders: ['female'],
};

const serve = (opts: { detailFails?: 'always' | 'first' } = {}) => {
    const calls: { patches: any[]; detailCalls: number } = { patches: [], detailCalls: 0 };
    server.use(
        http.get(`${BASE}/api/v1/partner/coupons/`, () => HttpResponse.json({ success: true, data: [womenOnly] })),
        http.get(`${BASE}/api/v1/partner/coupons/:id/usages/`, () => HttpResponse.json({ success: true, data: [] })),
        http.get(`${BASE}/api/v1/partner/coupons/:id/`, () => {
            calls.detailCalls += 1;
            const fail = opts.detailFails === 'always' || (opts.detailFails === 'first' && calls.detailCalls === 1);
            return fail
                ? HttpResponse.json({ error: { message: 'boom' } }, { status: 500 })
                : HttpResponse.json({ success: true, data: womenOnly });
        }),
        http.patch(`${BASE}/api/v1/partner/coupons/:id/`, async ({ request }) => {
            calls.patches.push(await request.json());
            return HttpResponse.json({ success: true, data: womenOnly });
        })
    );
    return calls;
};

const renderScreen = () => {
    sessionStorage.setItem('allowedEntities', JSON.stringify(['Events']));
    return render(
        <PartnerProvider>
            <Coupons onNavigate={vi.fn()} />
        </PartnerProvider>
    );
};

const openEdit = async (user: ReturnType<typeof userEvent.setup>) => {
    await waitFor(() => expect(screen.getByText('PERCNETOFFGENDERWOMEN')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Edit' }));
};

beforeEach(() => {
    sessionStorage.clear();
});

describe('Coupons — editing', () => {
    it('opening a women-only coupon to everyone saves the change (it used to stay women-only)', async () => {
        const calls = serve();
        renderScreen();
        const user = userEvent.setup();
        await openEdit(user);
        const dialog = await screen.findByRole('dialog', { name: 'Edit coupon' });

        await user.click(within(dialog).getByRole('button', { name: 'Women' }));
        await user.click(within(dialog).getByRole('button', { name: /Save changes/i }));

        await waitFor(() => expect(calls.patches).toHaveLength(1));
        expect(calls.patches[0].target_genders).toEqual([]);
    });

    it('clearing the internal note saves the change', async () => {
        const calls = serve();
        renderScreen();
        const user = userEvent.setup();
        await openEdit(user);
        const dialog = await screen.findByRole('dialog', { name: 'Edit coupon' });

        await user.clear(within(dialog).getByPlaceholderText('e.g. Monsoon weekday push'));
        await user.click(within(dialog).getByRole('button', { name: /Save changes/i }));

        await waitFor(() => expect(calls.patches).toHaveLength(1));
        expect(calls.patches[0].description).toBe('');
    });

    it('an untouched edit sends no clears it did not ask for', async () => {
        const calls = serve();
        renderScreen();
        const user = userEvent.setup();
        await openEdit(user);
        const dialog = await screen.findByRole('dialog', { name: 'Edit coupon' });

        await user.click(within(dialog).getByRole('button', { name: /Save changes/i }));

        await waitFor(() => expect(calls.patches).toHaveLength(1));
        expect(calls.patches[0]).toMatchObject({ description: 'Women weekday push', target_genders: ['female'] });
    });

    it('shows the code as locked, and says why', async () => {
        serve();
        renderScreen();
        const user = userEvent.setup();
        await openEdit(user);
        const dialog = await screen.findByRole('dialog', { name: 'Edit coupon' });

        const code = within(dialog).getByDisplayValue('PERCNETOFFGENDERWOMEN');
        expect(code).toBeDisabled();
        expect(code).toHaveAccessibleDescription(/Codes can’t be changed once published/);
    });
});

describe('Coupons — never edits from a half-loaded coupon', () => {
    it('fetches the full coupon first when only its summary loaded, then edits the real values', async () => {
        const calls = serve({ detailFails: 'first' });
        renderScreen();
        const user = userEvent.setup();
        await openEdit(user);

        const dialog = await screen.findByRole('dialog', { name: 'Edit coupon' });
        expect(within(dialog).getByPlaceholderText('e.g. Monsoon weekday push')).toHaveValue('Women weekday push');
        expect(calls.detailCalls).toBe(2);
    });

    it('refuses to open the form when the coupon still can’t be read — no defaults saved over it', async () => {
        const toastError = vi.spyOn(toast, 'error');
        const calls = serve({ detailFails: 'always' });
        renderScreen();
        const user = userEvent.setup();
        await openEdit(user);

        await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/can’t be edited safely/)));
        expect(screen.queryByRole('dialog', { name: 'Edit coupon' })).not.toBeInTheDocument();
        expect(calls.patches).toHaveLength(0);
        toastError.mockRestore();
    });
});
