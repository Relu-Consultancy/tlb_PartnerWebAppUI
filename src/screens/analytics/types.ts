// ---------------------------------------------------------------------------
// Analytics — the client mock's tab layout (Overview / Revenue / Demand
// funnel / Listings / Customers / Reports) reorganizes this app's existing
// per-entity stats endpoints. See model.ts for the field-by-field mapping
// and every place the mock's numbers had no real backing and were dropped.
// ---------------------------------------------------------------------------

export type AnalyticsTab = 'overview' | 'revenue' | 'funnel' | 'listings' | 'customers' | 'reports';

export interface RevenueTypeSlice {
    type: string;
    label: string;
    amount: number;
    count: number;
    pct: number;
    color: string;
}

export interface TrendPoint {
    label: string;
    revenue: number;
    bookings: number;
}

export interface FunnelStage {
    key: string;
    label: string;
    count: number;
    pctOfFirst: number;
    color: string;
    /** false for a mock stage this API doesn't track at all (shown as a design placeholder, not a fabricated number). */
    available: boolean;
}
