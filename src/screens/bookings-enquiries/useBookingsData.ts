import { useCallback, useEffect, useState } from 'react';
import { EntityType } from '../../types';
import { loadPartnerListings } from '../../api/portalSummary';
import { ApiError, cancelBooking, getAllBookings, markBookingAttended } from '../../api/listings';
import { toast } from '../../components/ui';
import { toNumber } from '../../utils/format';
import { BookingEntity, BookingEntry, BookingStatus, PaymentStatus } from './types';

// ---------------------------------------------------------------------------
// Loads every booking (Event tickets + ticketed Venue slots) and attaches
// each one's listing schedule so the When filter and slot labels have real
// dates behind them, not just the booking's own creation time.
// ---------------------------------------------------------------------------

const BOOKING_TYPE_TO_ENTITY: Record<string, BookingEntity | undefined> = { event: 'Events', venue: 'Venues' };
const UNLINKED = '__unlinked__';

interface State {
    loading: boolean;
    entries: BookingEntry[];
}

export const useBookingsData = (allowedEntities: EntityType[]) => {
    const [state, setState] = useState<State>({ loading: true, entries: [] });
    const scope: BookingEntity[] = (['Events', 'Venues'] as BookingEntity[])
        .filter(e => allowedEntities.length === 0 || allowedEntities.includes(e));
    const scopeKey = scope.join(',');

    const load = useCallback(async () => {
        setState(s => ({ ...s, loading: true }));
        try {
            const [bookings, listings] = await Promise.all([
                getAllBookings().catch(() => []),
                loadPartnerListings(scope),
            ]);
            const startsById = new Map(listings.map(l => [l.id, l.startsAt]));
            const entries: BookingEntry[] = (bookings as any[])
                .map((b): BookingEntry | null => {
                    const entity = BOOKING_TYPE_TO_ENTITY[b?.booking_type];
                    if (!entity || !scope.includes(entity)) return null;
                    const listingId = b?.listing_id ? String(b.listing_id) : UNLINKED;
                    return {
                        id: String(b?.id ?? ''),
                        entity,
                        listingId,
                        listingTitle: b?.listing_title || 'Untitled listing',
                        bookingReference: b?.booking_reference || '',
                        customerName: b?.customer_name || 'Unknown',
                        amount: toNumber(b?.total_amount),
                        currency: b?.currency || 'INR',
                        status: (b?.status || 'confirmed') as BookingStatus,
                        paymentStatus: (b?.payment_status || 'paid') as PaymentStatus,
                        createdAt: b?.created_at || null,
                        listingStartsAt: startsById.get(listingId) ?? null,
                    };
                })
                .filter((e): e is BookingEntry => e !== null);
            setState({ loading: false, entries });
        } catch (err) {
            console.error('Bookings load failed', err);
            setState({ loading: false, entries: [] });
        }
    }, [scopeKey]);

    useEffect(() => { load(); }, [load]);

    const markAttended = async (id: string): Promise<boolean> => {
        try {
            await markBookingAttended(id);
            setState(s => ({ ...s, entries: s.entries.map(e => (e.id === id ? { ...e, status: 'attended' } : e)) }));
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
            await cancelBooking(id, reason);
            setState(s => ({ ...s, entries: s.entries.map(e => (e.id === id ? { ...e, status: 'cancelled' } : e)) }));
            return { success: true };
        } catch (err: any) {
            const code = err instanceof ApiError ? err.code : '';
            return { success: false, code, message: err?.message || 'Failed to cancel this booking. Please try again.' };
        }
    };

    return { loading: state.loading, entries: state.entries, reload: load, markAttended, cancel };
};
