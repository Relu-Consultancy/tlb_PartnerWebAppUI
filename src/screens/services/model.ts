import { EntityType } from '../../types';
import { ListingState } from '../../api/portalSummary';
import { formatRupees, parseDate, slotLabelOf, toNumber } from '../../utils/format';
import { BookingEntry, EnquiryEntry } from '../bookings-enquiries/types';
import { BookingModel, ListingDemand, ListingRow } from './types';
import { DateRangeKey, isWithinRange } from '../../constants/dateRange';

// ---------------------------------------------------------------------------
// Pure derivations for My Listings — code synthesis, per-entity price/capacity
// parsing from a listing's detail payload, filtering/search, demand, and
// headline stats. No React, no I/O, unit-tested directly.
// ---------------------------------------------------------------------------

/** Stable "LST-XXXXXX" code from the listing's real id (never a fabricated reference). */
export const synthListingCode = (id: string): string => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return `LST-${100000 + (h % 900000)}`;
};

const locationOf = (...sources: any[]): string => {
    for (const src of sources) {
        const line = [src?.area, src?.city].filter(Boolean).join(', ');
        if (line) return line;
    }
    return sources.map(s => s?.address).find(Boolean) || '—';
};

const isActive = (batch: any): boolean => batch?.is_active !== false;

/** A listing's booking model — real `booking_type` field; Events are always ticketed. */
export const modelOf = (entityType: EntityType, raw: any): BookingModel => {
    if (entityType === 'Events') return 'ticketed';
    const service = raw?.service || {};
    const bookingType = service.booking_type || raw?.booking_type;
    return bookingType === 'direct_booking' ? 'ticketed' : 'enquiry';
};

interface EnrichedFields {
    priceLabel: string;
    capacityLabel: string;
    location: string;
    startsAt: string | null;
    description: string;
    galleryUrls: string[];
    isRefundable: boolean;
}

const earliestUpcoming = (dates: (string | null | undefined)[], now: Date): string | null => {
    const future = dates
        .map(d => parseDate(d))
        .filter((d): d is Date => !!d && d.getTime() >= now.getTime())
        .sort((a, b) => a.getTime() - b.getTime());
    return future[0]?.toISOString() ?? null;
};

const galleryUrlsOf = (media: any[]): string[] =>
    media.filter(m => m?.media_type !== 'cover').map(m => m?.file_url).filter(Boolean);

/** Parses a listing's full detail payload into the table's price/capacity/location/next-slot fields. */
export const enrichFromDetail = (entityType: EntityType, raw: any, fallbackStartsAt: string | null, now: Date): EnrichedFields => {
    const location = locationOf(raw);
    const description = raw?.description || raw?.short_description || '';
    // Partner-set, defaults to true — purely informational, doesn't affect refund processing itself.
    const isRefundable = raw?.is_refundable !== false;

    if (entityType === 'Events') {
        const tickets: any[] = raw?.tickets || [];
        const prices = tickets.map(t => toNumber(t?.price)).filter(p => p >= 0);
        const priceLabel = raw?.price_type === 'free'
            ? 'Free'
            : prices.length
                ? (prices.length > 1 ? `From ${formatRupees(Math.min(...prices))}` : formatRupees(prices[0]))
                : '—';
        const seats = raw?.price_type === 'free'
            ? raw?.capacity
            : tickets.reduce((sum, t) => sum + (toNumber(t?.total_quantity) || 0), 0) || null;
        return {
            priceLabel,
            capacityLabel: seats != null ? `${seats} seats` : '—',
            location,
            startsAt: raw?.start_datetime || fallbackStartsAt,
            description,
            galleryUrls: galleryUrlsOf(raw?.media || []),
            isRefundable,
        };
    }

    if (entityType === 'Venues') {
        const packages: any[] = raw?.packages || [];
        const prices = packages.map(p => toNumber(p?.price)).filter(p => p > 0);
        const priceLabel = prices.length ? formatRupees(Math.min(...prices)) : 'By enquiry';
        const minCap = raw?.min_capacity, maxCap = raw?.max_capacity;
        const capacityLabel = minCap != null && maxCap != null
            ? `${minCap}–${maxCap} guests`
            : maxCap != null ? `Up to ${maxCap} guests` : minCap != null ? `${minCap}+ guests` : '—';
        const slots: any[] = raw?.availability || [];
        const startsAt = earliestUpcoming(slots.map(s => s?.date), now) || fallbackStartsAt;
        return { priceLabel, capacityLabel, location, startsAt, description, galleryUrls: galleryUrlsOf(raw?.media || []), isRefundable };
    }

    // Classes and Programs share the batch-based shape (fee + total_seats per batch).
    const service = raw?.service || {};
    const batches: any[] = service.batches || raw?.batches || [];
    const activeBatches = batches.filter(isActive);
    const firstBatch = activeBatches[0] || batches[0];
    const price = entityType === 'Classes'
        ? (raw?.price ?? service.price ?? raw?.fee ?? service.fee)
        : (raw?.price ?? raw?.fee);
    const priceLabel = price != null
        ? (toNumber(price) > 0 ? formatRupees(toNumber(price)) : 'Free')
        : (firstBatch?.fee != null ? formatRupees(toNumber(firstBatch.fee)) : '—');
    const capacity = entityType === 'Programs' ? (raw?.max_capacity ?? firstBatch?.total_seats) : firstBatch?.total_seats;
    const startsAt = earliestUpcoming(activeBatches.map(b => b?.start_date), now) || fallbackStartsAt;
    return {
        priceLabel,
        capacityLabel: capacity != null ? `${capacity} places` : '—',
        location: locationOf(service, raw),
        startsAt,
        description: description || service.description || '',
        galleryUrls: galleryUrlsOf(service.media || raw?.media || []),
        isRefundable,
    };
};

// ── Filtering ────────────────────────────────────────────────────────────────

export interface ListingFilters {
    scope: EntityType | 'all';
    status: ListingState | 'any';
    search: string;
}

export const filterListings = (rows: ListingRow[], filters: ListingFilters): ListingRow[] =>
    rows
        .filter(r => filters.scope === 'all' || r.entityType === filters.scope)
        .filter(r => filters.status === 'any' || r.state === filters.status)
        .filter(r => {
            const q = filters.search.trim().toLowerCase();
            if (!q) return true;
            return r.title.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
        });

// ── Next slot — shared by the table row and the detail modal ───────────────

export const nextSlotLabel = (row: Pick<ListingRow, 'enriched' | 'state' | 'startsAt'>, now: Date): string => {
    if (!row.enriched) return '…';
    if (row.state !== 'live' && row.state !== 'pending') return '—';
    return slotLabelOf(row.startsAt, now);
};

// ── Demand — bookings/enquiries for a listing within the reporting window ──

export const demandOf = (
    row: Pick<ListingRow, 'id' | 'model'>,
    enquiries: EnquiryEntry[],
    bookings: BookingEntry[],
    range: DateRangeKey,
    now: Date,
): ListingDemand => {
    if (row.model === 'enquiry') {
        const count = enquiries.filter(e => e.listingId === row.id && isWithinRange(parseDate(e.createdAt), range, now)).length;
        return { count, label: `${count} ${count === 1 ? 'enquiry' : 'enquiries'}` };
    }
    const count = bookings.filter(b => b.listingId === row.id && b.status !== 'cancelled' && isWithinRange(parseDate(b.createdAt), range, now)).length;
    return { count, label: `${count} ${count === 1 ? 'booking' : 'bookings'}` };
};

// ── Headline stats — six tiles: five real states + settled revenue ─────────

export interface ListingStateCounts {
    live: number;
    pending: number;
    paused: number;
    draft: number;
    rejected: number;
    archived: number;
    total: number;
}

export const listingStateCounts = (rows: ListingRow[]): ListingStateCounts => {
    const counts: ListingStateCounts = { live: 0, pending: 0, paused: 0, draft: 0, rejected: 0, archived: 0, total: 0 };
    for (const row of rows) { counts[row.state] += 1; counts.total += 1; }
    return counts;
};
