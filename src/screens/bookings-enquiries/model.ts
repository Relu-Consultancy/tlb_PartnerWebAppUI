import { parseDate, isSameLocalDay, toNumber, slotLabelOf, startsWithinADay } from '../../utils/format';
import {
    BookingEntity, BookingEntry, BookingStatus, BookingWhen,
    EnquiryEntity, EnquiryEntry, EnquiryStage, ListingGroup,
} from './types';

// ---------------------------------------------------------------------------
// Pure derivations for the Bookings/Enquiries screen — grouping, filtering,
// bucketing and headline stats. No React, no I/O, unit-tested directly.
// ---------------------------------------------------------------------------

export const enquiryStageOf = (entry: EnquiryEntry): EnquiryStage => entry.status === 'new' ? 'new' : 'responded';

/** Groups today/starting-soon by definition; a cancelled booking is always its own bucket. */
export const bookingWhenOf = (entry: BookingEntry, now: Date): BookingWhen => {
    if (entry.status === 'cancelled') return 'cancelled';
    const starts = parseDate(entry.listingStartsAt);
    if (!starts) return 'upcoming';
    if (isSameLocalDay(starts, now)) return 'today';
    return starts.getTime() >= now.getTime() ? 'upcoming' : 'past';
};

export { slotLabelOf, startsWithinADay };

// ── Grouping — first-seen order, matching the mock's listing sections ──────

export const groupByListing = <T extends { listingId: string; listingTitle: string; entity: EnquiryEntity | BookingEntity }>(
    rows: T[],
): ListingGroup<T>[] => {
    const order: string[] = [];
    const byId = new Map<string, T[]>();
    for (const row of rows) {
        if (!byId.has(row.listingId)) { byId.set(row.listingId, []); order.push(row.listingId); }
        byId.get(row.listingId)!.push(row);
    }
    return order.map(listingId => {
        const groupRows = byId.get(listingId)!;
        return { listingId, listingTitle: groupRows[0].listingTitle, entity: groupRows[0].entity, rows: groupRows };
    });
};

// ── Enquiries ────────────────────────────────────────────────────────────────

export interface EnquiryFilters {
    stage: EnquiryStage;
    scope: EnquiryEntity | 'all';
    search: string;
}

const matchesText = (haystacks: string[], query: string): boolean => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return haystacks.some(h => h.toLowerCase().includes(q));
};

export const filterEnquiries = (entries: EnquiryEntry[], filters: EnquiryFilters): EnquiryEntry[] =>
    entries
        .filter(e => enquiryStageOf(e) === filters.stage)
        .filter(e => filters.scope === 'all' || e.entity === filters.scope)
        .filter(e => matchesText([e.name, e.listingTitle, e.contact], filters.search));

export interface EnquiryStats {
    total: number;
    toRespond: number;
    responded: number;
    byEntity: Record<EnquiryEntity, number>;
}

export const enquiryStats = (entries: EnquiryEntry[]): EnquiryStats => ({
    total: entries.length,
    toRespond: entries.filter(e => enquiryStageOf(e) === 'new').length,
    responded: entries.filter(e => enquiryStageOf(e) === 'responded').length,
    byEntity: {
        Classes: entries.filter(e => e.entity === 'Classes').length,
        Programs: entries.filter(e => e.entity === 'Programs').length,
        Venues: entries.filter(e => e.entity === 'Venues').length,
    },
});

// ── Bookings ─────────────────────────────────────────────────────────────────

export interface BookingFilters {
    when: BookingWhen;
    scope: BookingEntity | 'all';
    search: string;
}

export const filterBookings = (entries: BookingEntry[], filters: BookingFilters, now: Date): BookingEntry[] =>
    entries
        .filter(b => bookingWhenOf(b, now) === filters.when)
        .filter(b => filters.scope === 'all' || b.entity === filters.scope)
        .filter(b => matchesText([b.customerName, b.listingTitle, b.bookingReference], filters.search));

export interface BookingStats {
    total: number;
    confirmedCount: number;
    bookingValue: number;
    averageValue: number;
    cancelledCount: number;
    cancelledPct: number;
    refundedAmount: number;
    refundedCount: number;
    byEntity: Record<BookingEntity, number>;
}

const isSettled = (status: BookingStatus): boolean => status === 'confirmed' || status === 'attended';

export const bookingStats = (entries: BookingEntry[]): BookingStats => {
    const settled = entries.filter(e => isSettled(e.status));
    const cancelled = entries.filter(e => e.status === 'cancelled');
    const refunded = entries.filter(e => e.paymentStatus === 'refunded');
    const bookingValue = settled.reduce((sum, e) => sum + e.amount, 0);
    return {
        total: entries.length,
        confirmedCount: settled.length,
        bookingValue,
        averageValue: settled.length > 0 ? bookingValue / settled.length : 0,
        cancelledCount: cancelled.length,
        cancelledPct: entries.length > 0 ? (cancelled.length / entries.length) * 100 : 0,
        refundedAmount: refunded.reduce((sum, e) => sum + e.amount, 0),
        refundedCount: refunded.length,
        byEntity: {
            Events: entries.filter(e => e.entity === 'Events').length,
            Venues: entries.filter(e => e.entity === 'Venues').length,
        },
    };
};

export interface SoonSummary {
    todayCount: number;
    tomorrowCount: number;
    rows: BookingEntry[];
}

/** Bookings for listings starting today or tomorrow — excludes cancelled bookings. */
export const soonBookings = (entries: BookingEntry[], now: Date): SoonSummary => {
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const rows = entries.filter(e => {
        if (e.status === 'cancelled') return false;
        const starts = parseDate(e.listingStartsAt);
        return !!starts && (isSameLocalDay(starts, now) || isSameLocalDay(starts, tomorrow));
    });
    return {
        rows,
        todayCount: rows.filter(e => isSameLocalDay(parseDate(e.listingStartsAt)!, now)).length,
        tomorrowCount: rows.filter(e => isSameLocalDay(parseDate(e.listingStartsAt)!, tomorrow)).length,
    };
};

export { toNumber };
