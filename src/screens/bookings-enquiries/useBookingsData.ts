import { useCallback, useEffect, useState } from 'react';
import { EntityType } from '../../types';
import { loadPartnerListings } from '../../api/portalSummary';
import { ApiError, cancelBooking, getAllBookings, markBookingAttended } from '../../api/listings';
import { toast } from '../../components/ui';
import { toNumber } from '../../utils/format';
import { BookingEntity, BookingEntry, BookingStatus, PaymentStatus, RefundStatus } from './types';

// ---------------------------------------------------------------------------
// Loads every booking (Event tickets + ticketed Venue slots) and attaches
// each one's listing schedule so the When filter and slot labels have real
// dates behind them, not just the booking's own creation time.
// ---------------------------------------------------------------------------

// The API's booking_type is event | class | program | venue. Classes and
// Programs were missing here, so a paid booking on a direct-booking class or
// program was dropped on the floor — it showed up nowhere in the portal.
const BOOKING_TYPE_TO_ENTITY: Record<string, BookingEntity | undefined> = {
    event: 'Events',
    venue: 'Venues',
    class: 'Classes',
    program: 'Programs',
};
const UNLINKED = '__unlinked__';

const REFUND_STATUSES: RefundStatus[] = ['requested', 'processing', 'settled', 'failed'];

/**
 * A booking's refund state from the list row. `refund_status` is additive —
 * an older or cached response without it means "no refund". A payment the API
 * already marks "refunded" has settled by definition (it only flips once the
 * money is back), so that still reads as Refunded.
 */
export const refundStatusOf = (rawRefundStatus: unknown, paymentStatus: PaymentStatus): RefundStatus | null => {
    const s = String(rawRefundStatus ?? '').toLowerCase() as RefundStatus;
    if (REFUND_STATUSES.includes(s)) return s;
    return paymentStatus === 'refunded' ? 'settled' : null;
};

/**
 * The backend's booking statuses, mapped onto the four this screen buckets by
 * (the customer app's own grouping): a payment hold is awaiting payment, a
 * failed payment is a cancellation, and a refunded booking is a cancelled one
 * whose money went back. Unmapped, a `payment_failed` booking was filed under
 * Upcoming, and any status outside the four crashed the row.
 */
export const normalizeBookingStatus = (
    rawStatus: unknown,
    rawPayment: unknown
): { status: BookingStatus; paymentStatus: PaymentStatus; reasonFallback: string | null } => {
    const status = String(rawStatus || 'confirmed').toLowerCase();
    const payment = String(rawPayment || 'paid').toLowerCase() as PaymentStatus;
    switch (status) {
        case 'confirmed':
        case 'awaiting_payment':
        case 'attended':
        case 'cancelled':
            return { status, paymentStatus: payment, reasonFallback: null };
        case 'hold':
            return { status: 'awaiting_payment', paymentStatus: payment, reasonFallback: null };
        case 'payment_failed':
            return {
                status: 'cancelled',
                paymentStatus: payment === 'paid' ? 'pending' : payment,
                reasonFallback: 'The customer’s payment failed',
            };
        case 'refunded':
            return { status: 'cancelled', paymentStatus: 'refunded', reasonFallback: null };
        default:
            // Unknown: shown under its own name (neutral pill), never claimed as confirmed.
            return { status: status as BookingStatus, paymentStatus: payment, reasonFallback: null };
    }
};

interface State {
    loading: boolean;
    entries: BookingEntry[];
}

export const useBookingsData = (allowedEntities: EntityType[]) => {
    const [state, setState] = useState<State>({ loading: true, entries: [] });
    const scope: BookingEntity[] = (['Events', 'Venues', 'Classes', 'Programs'] as BookingEntity[]).filter(
        (e) => allowedEntities.length === 0 || allowedEntities.includes(e)
    );
    const scopeKey = scope.join(',');

    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true }));
        try {
            const [bookings, listings] = await Promise.all([getAllBookings().catch(() => []), loadPartnerListings(scope)]);
            const startsById = new Map(listings.map((l) => [l.id, l.startsAt]));
            const entityById = new Map<string, BookingEntity>(listings.map((l) => [l.id, l.entityType as BookingEntity]));
            // Bookings don't always carry `listing_title` — the partner's own
            // listings name it when the payload doesn't.
            const titleById = new Map(listings.map((l) => [l.id, l.title]));
            const entries: BookingEntry[] = (bookings as any[])
                .map((b): BookingEntry | null => {
                    const listingId = b?.listing_id ? String(b.listing_id) : UNLINKED;
                    // Fall back to the listing's own type: a booking must never
                    // vanish just because booking_type was missing or unfamiliar.
                    const entity = BOOKING_TYPE_TO_ENTITY[b?.booking_type] ?? entityById.get(listingId);
                    if (!entity || !scope.includes(entity)) return null;
                    const { status, paymentStatus, reasonFallback } = normalizeBookingStatus(b?.status, b?.payment_status);
                    return {
                        id: String(b?.id ?? ''),
                        entity,
                        listingId,
                        listingTitle: b?.listing_title || titleById.get(listingId) || 'Untitled listing',
                        bookingReference: b?.booking_reference || '',
                        customerName: b?.customer_name || 'Unknown',
                        amount: toNumber(b?.total_amount),
                        currency: b?.currency || 'INR',
                        status,
                        paymentStatus,
                        createdAt: b?.created_at || null,
                        listingStartsAt: startsById.get(listingId) ?? null,
                        cancelledAt: b?.cancelled_at || null,
                        cancellationReason: b?.cancellation_reason || reasonFallback,
                        refundStatus: refundStatusOf(b?.refund_status, paymentStatus),
                        refundAmount: b?.refund_amount != null && b.refund_amount !== '' ? toNumber(b.refund_amount) : null,
                    };
                })
                .filter((e): e is BookingEntry => e !== null);
            setState({ loading: false, entries });
        } catch (err) {
            console.error('Bookings load failed', err);
            setState({ loading: false, entries: [] });
        }
    }, [scopeKey]);

    useEffect(() => {
        load();
    }, [load]);

    const markAttended = async (id: string): Promise<boolean> => {
        try {
            await markBookingAttended(id);
            setState((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, status: 'attended' } : e)) }));
            return true;
        } catch (err: any) {
            toast.error(err?.message || 'Couldn’t mark this booking as attended. Please try again.');
            return false;
        }
    };

    // Returns a result rather than throwing/toasting — the cancel confirmation UI shows
    // code-specific inline messaging (deadline passed, not refundable, etc.), not just a toast.
    const cancel = async (id: string, reason: string): Promise<{ success: true } | { success: false; code: string; message: string }> => {
        try {
            const res: any = await cancelBooking(id, reason);
            // The response is the booking detail with its new refund (status
            // "processing") — show that straight away rather than a bare "Cancelled".
            const refund = (res?.data ?? res)?.refund;
            setState((s) => ({
                ...s,
                entries: s.entries.map((e) =>
                    e.id === id
                        ? {
                              ...e,
                              status: 'cancelled',
                              cancelledAt: e.cancelledAt ?? new Date().toISOString(),
                              refundStatus: refundStatusOf(refund?.status, e.paymentStatus) ?? 'processing',
                              refundAmount: refund?.amount != null ? toNumber(refund.amount) : e.amount,
                          }
                        : e
                ),
            }));
            return { success: true };
        } catch (err: any) {
            const code = err instanceof ApiError ? err.code : '';
            return { success: false, code, message: err?.message || 'Failed to cancel this booking. Please try again.' };
        }
    };

    return { loading: state.loading, entries: state.entries, reload: load, markAttended, cancel };
};
