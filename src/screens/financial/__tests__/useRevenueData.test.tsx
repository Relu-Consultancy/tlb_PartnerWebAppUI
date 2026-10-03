import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../test/msw/server';
import { useRevenueData } from '../useRevenueData';
import { DateRangeKey } from '../../../constants/dateRange';

const BASE = 'https://tlb-api.reluconsultancy.in';

const revenue = (gross: string) => ({
    period: '',
    gross_revenue: gross,
    platform_fees: '0',
    refunds: '0',
    net_earnings: gross,
    confirmed_bookings: 1,
    avg_order_value: gross,
    this_month: '0',
    prev_month: '0',
    revenue_growth_pct: 0,
    revenue_by_type: [],
    revenue_trend: [],
});

describe('useRevenueData — period switching', () => {
    it('never lets a slower, superseded period overwrite the one on screen', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/stats/revenue/`, async ({ request }) => {
                const period = new URL(request.url).searchParams.get('period');
                if (period === '7d') {
                    // The old period answers last — the race QA would hit by
                    // flicking the picker 7d -> 30d.
                    await delay(150);
                    return HttpResponse.json({ success: true, data: revenue('700') });
                }
                return HttpResponse.json({ success: true, data: revenue('3000') });
            })
        );

        const { result, rerender } = renderHook(({ range }: { range: DateRangeKey }) => useRevenueData(range), {
            initialProps: { range: '7d' as DateRangeKey },
        });
        rerender({ range: '30d' });

        await waitFor(() => expect(result.current.revenue?.gross_revenue).toBe('3000'));
        // Give the stale 7d response time to arrive, then make sure it was dropped.
        await new Promise((r) => setTimeout(r, 250));
        expect(result.current.revenue?.gross_revenue).toBe('3000');
    });
});
