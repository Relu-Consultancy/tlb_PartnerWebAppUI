import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Partner Statistics endpoints
// Base: /api/v1/partner/stats/
// All require Authorization: Bearer <token> (partner with status=approved)
// ---------------------------------------------------------------------------

export interface StatsOverview {
    profile_views: number;
    followers: number;
    new_enquiries: number;
    active_batches: number;
}

export interface WeeklyTicketDay {
    day: string;       // "Mon" .. "Sun"
    date: string;      // ISO date
    count: number;
}

export interface MonthlyBucket {
    month: string;     // "Dec 2025"
    year?: number;
    count: number;
    earnings?: string; // stringified decimal — present on enquiry/event trends
}

export interface RevenueBucket {
    month: string;
    year?: number;
    count?: number;
    earnings: string;  // stringified decimal — "24500.00"
}

export interface CategoryBucket {
    category: string;
    count: number;
    amount?: string;   // stringified decimal — revenue attributed to the category
}

export interface StatsEvents {
    upcoming: number;
    tickets_sold: number;
    registrations: number;
    event_reach: number;
    engagement_rate: number | null;  // always null until likes/comments tracked
    booking_conv_rate: number;
    this_month_tickets: number;
    prev_month_tickets: number;
    ticket_growth_pct: number;
    weekly_ticket_sales: WeeklyTicketDay[];
    ticket_sales_trend: MonthlyBucket[];
    by_category: CategoryBucket[];
}

export interface StatsVenues {
    total_bookings: number;
    upcoming: number;
    monthly_earnings: string;        // decimal as string
    occupancy_rate: number;
    avg_duration_minutes: number | null;
    repeat_clients: number;
    revenue_trend: RevenueBucket[];
}

export interface ConversionFunnel {
    new_leads: number;
    contacted: number;
    converted: number;
    conversion_rate: number;
}

export interface StatsEnquiries {
    conversion_funnel: ConversionFunnel;
    trial_requests: number;
    avg_response_hours: number | null;  // null until first responded enquiry exists
    student_retention_pct: number | null;
    monthly_enrolments: number;
    monthly_trend: MonthlyBucket[];
}

// ── Revenue (period-aware) ──
export type RevenuePeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export interface RevenueByType {
    type: string;
    amount: string;   // decimal as string
    count: number;
}

export interface StatsRevenue {
    period: string;
    gross_revenue: string;
    platform_fees: string;
    refunds: string;
    net_earnings: string;
    confirmed_bookings: number;
    avg_order_value: string;
    this_month: string;
    prev_month: string;
    revenue_growth_pct: number;
    revenue_by_type: RevenueByType[];
    revenue_trend: RevenueBucket[];
}

// ── Reviews ──
export interface RatingBucket {
    rating: number;
    count: number;
}

export interface RatingTrendBucket {
    month: string;
    avg_rating: number | null;
    count: number;
}

export interface RecentReview {
    rating: number;
    comment: string;
    listing_title: string;
    created_at: string;
}

export interface StatsReviews {
    avg_rating: number | null;
    total_reviews: number;
    reviews_this_month: number;
    reviews_prev_month: number;
    rating_distribution: RatingBucket[];
    avg_rating_trend: RatingTrendBucket[];
    recent_reviews: RecentReview[];
}

// ── Helper: unwrap { success, data } envelope ──
const unwrap = async <T>(response: Response, fallbackErr: string): Promise<T> => {
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || fallbackErr);
    }
    const json = await response.json();
    return (json?.data ?? json) as T;
};

export const getStatsOverview = async (): Promise<StatsOverview> => {
    const res = await apiClient('/api/v1/partner/stats/overview/');
    return unwrap<StatsOverview>(res, 'Failed to load overview stats');
};

export const getStatsEvents = async (): Promise<StatsEvents> => {
    const res = await apiClient('/api/v1/partner/stats/events/');
    return unwrap<StatsEvents>(res, 'Failed to load event stats');
};

export const getStatsVenues = async (): Promise<StatsVenues> => {
    const res = await apiClient('/api/v1/partner/stats/venues/');
    return unwrap<StatsVenues>(res, 'Failed to load venue stats');
};

export const getStatsEnquiries = async (): Promise<StatsEnquiries> => {
    const res = await apiClient('/api/v1/partner/stats/enquiries/');
    return unwrap<StatsEnquiries>(res, 'Failed to load enquiry stats');
};

export const getStatsRevenue = async (period: RevenuePeriod = '30d'): Promise<StatsRevenue> => {
    const res = await apiClient(`/api/v1/partner/stats/revenue/?period=${period}`);
    return unwrap<StatsRevenue>(res, 'Failed to load revenue stats');
};

export const getStatsReviews = async (): Promise<StatsReviews> => {
    const res = await apiClient('/api/v1/partner/stats/reviews/');
    return unwrap<StatsReviews>(res, 'Failed to load review stats');
};

// ── POST /api/v1/partner/<partner_id>/track-view/ ──
// No auth required. Call on every public profile page load.
// Returns 200 on success; we treat failure as best-effort silent fail.
export const trackProfileView = async (partnerId: string): Promise<void> => {
    try {
        await apiClient(`/api/v1/partner/${partnerId}/track-view/`, { method: 'POST' });
    } catch {
        // Best-effort — never break the page if tracking fails.
    }
};
