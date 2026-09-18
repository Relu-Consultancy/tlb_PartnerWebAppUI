import { EnquiryStatus } from '../../types';
import { Tone } from '../../components/portal/primitives';
import { BookingEntity, BookingEntry, BookingStatus, EnquiryEntity, RefundStatus } from './types';

export { LISTING_STATUS_META } from '../../components/portal/listingStatus';

// ---------------------------------------------------------------------------
// Display metadata: entity chips, status chips, listing-status dots. Kept
// separate from `model.ts` because it's presentation vocabulary, not a
// derivation — but still pure, so it's just as easy to test or reuse.
// ---------------------------------------------------------------------------

export const ENQUIRY_ENTITY_LABEL: Record<EnquiryEntity, string> = {
    Classes: 'Class',
    Programs: 'Program',
    Venues: 'Venue hire',
};

export const ENQUIRY_ENTITY_TONE: Record<EnquiryEntity, Tone> = {
    Classes: 'green',
    Programs: 'purple',
    Venues: 'blue',
};

export const BOOKING_ENTITY_LABEL: Record<BookingEntity, string> = {
    Events: 'Event',
    Venues: 'Venue hire',
};

export const BOOKING_ENTITY_TONE: Record<BookingEntity, Tone> = {
    Events: 'amber',
    Venues: 'blue',
};

// Real statuses map onto the mock's five-state palette (red = needs you,
// amber = in progress, blue = scheduled, green = converted, neutral = closed).
export const ENQUIRY_STATUS_META: Record<EnquiryStatus, { label: string; tone: Tone }> = {
    new: { label: 'To respond', tone: 'red' },
    contacted: { label: 'Contacted', tone: 'amber' },
    trial_booked: { label: 'Trial booked', tone: 'blue' },
    site_visit_scheduled: { label: 'Site visit', tone: 'blue' },
    enrolled: { label: 'Enrolled', tone: 'green' },
    closed: { label: 'Closed', tone: 'neutral' },
};

/** Status options a partner can move an enquiry through, per entity type. */
export const ENQUIRY_STATUS_OPTIONS: Record<EnquiryEntity, EnquiryStatus[]> = {
    Classes: ['new', 'contacted', 'trial_booked', 'closed'],
    Programs: ['new', 'contacted', 'enrolled', 'closed'],
    Venues: ['new', 'contacted', 'site_visit_scheduled', 'closed'],
};

const bookingStatusMeta = (entry: Pick<BookingEntry, 'status' | 'paymentStatus'>): { label: string; tone: Tone } => {
    if (entry.status === 'cancelled') {
        return entry.paymentStatus === 'refunded' ? { label: 'Refunded', tone: 'blue' } : { label: 'Cancelled', tone: 'red' };
    }
    const META: Record<Exclude<BookingStatus, 'cancelled'>, { label: string; tone: Tone }> = {
        confirmed: { label: 'Confirmed', tone: 'green' },
        awaiting_payment: { label: 'Awaiting payment', tone: 'amber' },
        attended: { label: 'Attended', tone: 'neutral' },
    };
    return META[entry.status];
};
export { bookingStatusMeta };

// A refund is asynchronous (Razorpay can take hours to days) — "processing" is a normal resting
// state, not a stuck request, and must never read as "Refunded" (only "settled" means the money
// has actually landed). "Requested" is included for completeness but is very short-lived in
// practice — it flips to "processing" almost immediately.
export const REFUND_STATUS_META: Record<RefundStatus, { label: string; sub?: string; tone: Tone }> = {
    requested: { label: 'Refund requested', tone: 'amber' },
    processing: { label: 'Refund in progress', sub: 'Usually settles in 3–7 days', tone: 'amber' },
    settled: { label: 'Refunded', tone: 'green' },
    failed: { label: 'Refund failed', sub: 'Needs manual follow-up', tone: 'red' },
};

const AVATAR_PALETTE = ['#3A63C9', '#7C3AED', '#2E9E5B', '#B45309', '#C2410C', '#0891B2'];

/** Deterministic avatar tint so the same name always gets the same colour. */
export const avatarColorOf = (name: string): string => {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};
