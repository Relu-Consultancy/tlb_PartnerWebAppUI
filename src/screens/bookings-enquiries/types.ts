import { EnquiryStatus } from '../../types';

// ---------------------------------------------------------------------------
// Bookings/Enquiries — shared types.
//
// Enquiries: Classes and Programs are lead-only; Venues are hybrid (large or
// custom hires arrive as enquiries, hourly/day slots are paid upfront and
// show up under Bookings instead). Events always sell tickets, so they never
// appear here.
//
// Bookings: paid at checkout, nothing to confirm — Event tickets and
// ticketed Venue slots. Classes and Programs never appear here.
// ---------------------------------------------------------------------------

export type EnquiryEntity = 'Classes' | 'Programs' | 'Venues';
/**
 * Every service type can produce a paid booking: Events always do, and Classes,
 * Programs and Venues do whenever the partner set `booking_type: direct_booking`
 * in the wizard. The API's own `booking_type` on a booking is
 * event | class | program | venue.
 */
export type BookingEntity = 'Events' | 'Venues' | 'Classes' | 'Programs';

export interface EnquiryEntry {
    id: string;
    entity: EnquiryEntity;
    listingId: string;
    listingTitle: string;
    /** Enquirer / customer name. */
    name: string;
    /** Batch name, student age, or occasion — whatever the entity's payload carries. */
    detail: string;
    /** Phone number, or 'Hidden' until unlocked. */
    contact: string;
    isUnlocked: boolean;
    status: EnquiryStatus;
    message: string;
    notes: string;
    createdAt: string | null;
}

export type BookingStatus = 'confirmed' | 'awaiting_payment' | 'attended' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'refunded';

/** REQUESTED is very short-lived (flips to processing almost immediately) — rarely seen in practice. */
export type RefundStatus = 'requested' | 'processing' | 'settled' | 'failed';

export interface Refund {
    id: string;
    status: RefundStatus;
    amount: number;
    currency: string;
    requested_at: string;
    settled_at: string | null;
    failed_at: string | null;
}

export interface BookingEntry {
    id: string;
    entity: BookingEntity;
    listingId: string;
    listingTitle: string;
    bookingReference: string;
    customerName: string;
    amount: number;
    currency: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    createdAt: string | null;
    /** The listing's next/only occurrence, when known — drives the "when" bucket and slot label. */
    listingStartsAt: string | null;
    /** When and why it was cancelled, as the backend recorded it — null while it isn't. */
    cancelledAt: string | null;
    cancellationReason: string | null;
    /**
     * The booking's latest refund, from the list's `refund_status`. Null = no
     * refund was ever started (never paid, or still active). This — not
     * `paymentStatus`, which stays "paid" until the refund settles — drives
     * every refund badge.
     */
    refundStatus: RefundStatus | null;
    /** What's being refunded, or null when there's no refund. */
    refundAmount: number | null;
}

/** Bucketed by response state for the Stage filter. */
export type EnquiryStage = 'new' | 'responded';

/** Bucketed by the listing's schedule for the When filter. */
export type BookingWhen = 'today' | 'upcoming' | 'past' | 'cancelled';

export interface ListingGroup<T> {
    listingId: string;
    listingTitle: string;
    entity: EnquiryEntity | BookingEntity;
    rows: T[];
}
