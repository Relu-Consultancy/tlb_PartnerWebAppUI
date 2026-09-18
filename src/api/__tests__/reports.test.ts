import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import {
    getEarningsStatementReport, getBookingRegisterReport, getEnquiryResponseLogReport, getReviewsExportReport,
} from '../reports';

const BASE = 'https://tlb-api.reluconsultancy.in';

describe('CSV report downloads', () => {
    it('getEarningsStatementReport returns the raw CSV content and the server-provided filename', async () => {
        const report = await getEarningsStatementReport('30d');
        expect(report.filename).toBe('earnings-statement_20260917.csv');
        expect(report.content).toContain('period_start,period_end,gross_amount');
        expect(report.content).toContain('commission_amount');
    });

    it('sends the period as a query param', async () => {
        let captured: string | null = null;
        server.use(http.get(`${BASE}/api/v1/partner/reports/earnings-statement/`, ({ request }) => {
            captured = new URL(request.url).searchParams.get('period');
            return new HttpResponse('a,b\n1,2', { headers: { 'Content-Type': 'text/csv' } });
        }));
        await getEarningsStatementReport('90d');
        expect(captured).toBe('90d');
    });

    it('falls back to a local filename when the server sends no Content-Disposition header', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/reports/booking-register/`, () =>
            new HttpResponse('a,b\n1,2', { headers: { 'Content-Type': 'text/csv' } })));
        const report = await getBookingRegisterReport('30d');
        expect(report.filename).toBe('booking-register_30d.csv');
    });

    it('getEnquiryResponseLogReport works now that the endpoint is live', async () => {
        const report = await getEnquiryResponseLogReport('30d');
        expect(report.content).toContain('within_sla');
    });

    it('getReviewsExportReport returns real CSV content', async () => {
        const report = await getReviewsExportReport('30d');
        expect(report.content).toContain('listing_title,rating,comment,created_at');
    });

    it('throws a real error message on failure instead of downloading a broken file', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/reports/earnings-statement/`, () =>
            HttpResponse.json({ error: { message: 'Report generation failed' } }, { status: 500 })));
        await expect(getEarningsStatementReport('30d')).rejects.toThrow('Report generation failed');
    });

    it('rejects an invalid period the same way the backend would (400 VALIDATION_ERROR)', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/reports/reviews-export/`, () =>
            HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid period' } }, { status: 400 })));
        await expect(getReviewsExportReport('30d' as any)).rejects.toThrow('Invalid period');
    });
});
