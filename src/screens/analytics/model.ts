import { EntityType } from '../../types';
import { StatsEnquiries, StatsOverview, StatsRevenue, StatsVenues, RevenueByType } from '../../api/stats';
import { PartnerListing } from '../../api/portalSummary';
import { BookingEntry, EnquiryEntry } from '../bookings-enquiries/types';
import { toNumber } from '../../utils/format';
import { FunnelStage, ListingPerformanceRow, RevenueTypeSlice, TrendPoint } from './types';

// ---------------------------------------------------------------------------
// Pure derivations for Analytics. No React, no I/O, unit-tested directly.
// ---------------------------------------------------------------------------

const TYPE_META: Record<string, { label: string; color: string }> = {
    event: { label: 'Events', color: '#F5B301' },
    class: { label: 'Classes', color: '#1A1917' },
    program: { label: 'Programs', color: '#7C3AED' },
    venue: { label: 'Venues', color: '#2E9E5B' },
};

const typeMeta = (type: string): { label: string; color: string } =>
    TYPE_META[type.toLowerCase()] || { label: type.charAt(0).toUpperCase() + type.slice(1), color: '#8A8880' };

/** Real "revenue by service" breakdown — the mock's own stacked bar, driven by `revenue_by_type`. */
export const revenueTypeSlices = (types: RevenueByType[]): RevenueTypeSlice[] => {
    const amounts = types.map(t => toNumber(t.amount));
    const total = amounts.reduce((a, b) => a + b, 0);
    return types
        .map((t, i) => {
            const meta = typeMeta(t.type);
            return {
                type: t.type,
                label: meta.label,
                color: meta.color,
                amount: amounts[i],
                count: t.count,
                pct: total > 0 ? Math.round((amounts[i] / total) * 100) : 0,
            };
        })
        .sort((a, b) => b.amount - a.amount);
};

/** Monthly revenue + booking-count trend — real monthly buckets, not the mock's fabricated weekly ones. */
export const trendPoints = (revenue: Pick<StatsRevenue, 'revenue_trend'>): TrendPoint[] =>
    (revenue.revenue_trend || []).map(r => ({
        label: (r.month || '').split(' ')[0] || r.month,
        revenue: toNumber(r.earnings),
        bookings: r.count ?? 0,
    }));

// ── Demand funnel — real 4-stage funnel from profile views + the enquiry CRM funnel ──

// Mirrors the mock's 5-row funnel shape exactly. "Detail opens" has no
// backing event anywhere in this app (no per-listing click-through tracking)
// so it renders as a design placeholder, not a fabricated count; every other
// row is real.
export const funnelStages = (
    overview: Pick<StatsOverview, 'profile_views'> | null,
    enquiries: Pick<StatsEnquiries, 'conversion_funnel'> | null,
): FunnelStage[] => {
    const views = overview?.profile_views ?? 0;
    const funnel = enquiries?.conversion_funnel;
    const stages: { key: string; label: string; count: number; color: string; available: boolean }[] = [
        { key: 'views', label: 'Profile views', count: views, color: '#1A1917', available: true },
        { key: 'detail', label: 'Detail opens', count: 0, color: '#6E6C66', available: false },
        { key: 'leads', label: 'Enquiries sent', count: funnel?.new_leads ?? 0, color: '#F5B301', available: true },
        { key: 'contacted', label: 'Replied to enquiry', count: funnel?.contacted ?? 0, color: '#3A63C9', available: true },
        { key: 'converted', label: 'Bookings confirmed', count: funnel?.converted ?? 0, color: '#2E9E5B', available: true },
    ];
    const first = stages[0].count || 1;
    return stages.map(s => ({ ...s, pctOfFirst: s.available ? Math.round((s.count / first) * 100) : 0 }));
};

/** Real, computed "money still on the table" — uncontacted leads × average order value. Never a fabricated figure. */
export const uncontactedLeadValue = (
    enquiries: Pick<StatsEnquiries, 'conversion_funnel'> | null,
    revenue: Pick<StatsRevenue, 'avg_order_value'> | null,
): { uncontacted: number; value: number } => {
    const funnel = enquiries?.conversion_funnel;
    const uncontacted = Math.max(0, (funnel?.new_leads ?? 0) - (funnel?.contacted ?? 0));
    const aov = toNumber(revenue?.avg_order_value);
    return { uncontacted, value: uncontacted * aov };
};

/** Whichever real repeat/retention metric applies to this partner's services — never a blended, fabricated single number. */
export const retentionMetric = (
    allowedEntities: EntityType[],
    venues: Pick<StatsVenues, 'repeat_clients'> | null,
    enquiries: Pick<StatsEnquiries, 'student_retention_pct'> | null,
): { label: string; value: string } => {
    const hasClassOrProgram = allowedEntities.includes('Classes') || allowedEntities.includes('Programs');
    if (hasClassOrProgram && enquiries?.student_retention_pct != null) {
        return { label: 'student retention', value: `${Math.round(enquiries.student_retention_pct)}%` };
    }
    if (allowedEntities.includes('Venues') && venues?.repeat_clients != null) {
        return { label: 'repeat venue clients', value: String(venues.repeat_clients) };
    }
    return { label: 'no repeat-customer data yet', value: '—' };
};

// ── Per-listing performance — real bookings/enquiries/revenue rollup ───────

export const listingPerformance = (
    listings: PartnerListing[],
    bookings: BookingEntry[],
    enquiries: EnquiryEntry[],
): ListingPerformanceRow[] => {
    const rows = listings.map((l): ListingPerformanceRow => {
        const listingBookings = bookings.filter(b => b.listingId === l.id && b.status !== 'cancelled');
        const listingEnquiries = enquiries.filter(e => e.listingId === l.id);
        return {
            id: l.id,
            title: l.title,
            entityType: l.entityType,
            bookings: listingBookings.length,
            enquiries: listingEnquiries.length,
            revenue: listingBookings.reduce((sum, b) => sum + b.amount, 0),
        };
    });
    return rows.sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings);
};
