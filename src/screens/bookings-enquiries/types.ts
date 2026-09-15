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
export type BookingEntity = 'Events' | 'Venues';

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
