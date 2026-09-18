import { apiClient } from './client';
import { RevenuePeriod } from './stats';

// ---------------------------------------------------------------------------
// Partner CSV report downloads — each returns a raw CSV file directly on the
// request (Content-Type: text/csv, Content-Disposition: attachment), not the
// usual { success, data } envelope. No job/poll step — the file comes back
// on this one GET. All 4 accept the same rolling ?period= used across
// stats/* (7d/30d/90d/1y/all) — not arbitrary dates or fiscal quarters.
//
// GST summary has no endpoint (no GST computation exists anywhere in the
// backend) — its Reports-panel row stays Coming Soon, no function here.
// ---------------------------------------------------------------------------

export interface DownloadedReport {
    filename: string;
    content: string;
}

const parseFilename = (disposition: string | null, fallback: string): string => {
    if (!disposition) return fallback;
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    return match ? decodeURIComponent(match[1]) : fallback;
};

const downloadCsvReport = async (endpoint: string, period: RevenuePeriod, fallbackName: string): Promise<DownloadedReport> => {
    const res = await apiClient(`${endpoint}?period=${period}`);
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Failed to download report');
    }
    const content = await res.text();
    const filename = parseFilename(res.headers.get('content-disposition'), fallbackName);
    return { filename, content };
};

/** period_start, period_end, gross_amount, commission_percent, commission_amount ("Platform fee"),
 * net_payable, status, paid_at. No TDS column — no TDS rate/deduction exists in the backend. */
export const getEarningsStatementReport = (period: RevenuePeriod): Promise<DownloadedReport> =>
    downloadCsvReport('/api/v1/partner/reports/earnings-statement/', period, `earnings-statement_${period}.csv`);

/** booking_reference, created_at, customer_name, customer_email, listing_title, booking_type,
 * status, total_amount. No "slot" (date/time) column — no unified way to render one across
 * event/venue/program/class bookings exists yet. */
export const getBookingRegisterReport = (period: RevenuePeriod): Promise<DownloadedReport> =>
    downloadCsvReport('/api/v1/partner/reports/booking-register/', period, `booking-register_${period}.csv`);

/** service_type, listing_title, attendee_name, status, created_at, responded_at, response_hours
 * (blank if not yet responded), within_sla (strict response_hours<=24 pass/fail — false, not blank,
 * for an unanswered enquiry). No per-team-member column — a Partner is one business entity here. */
export const getEnquiryResponseLogReport = (period: RevenuePeriod): Promise<DownloadedReport> =>
    downloadCsvReport('/api/v1/partner/reports/enquiry-response-log/', period, `enquiry-response-log_${period}.csv`);

/** listing_title, rating, comment, created_at. No reply-status column — no partner-reply-to-review
 * feature exists anywhere yet. */
export const getReviewsExportReport = (period: RevenuePeriod): Promise<DownloadedReport> =>
    downloadCsvReport('/api/v1/partner/reports/reviews-export/', period, `reviews-export_${period}.csv`);
