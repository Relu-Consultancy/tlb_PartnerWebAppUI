import { toCsv } from '../../utils/csv';
import { formatRupees } from '../../utils/format';
import { BookingEntry, EnquiryEntry } from './types';

// ---------------------------------------------------------------------------
// CSV export for the Enquiries and Bookings tabs (the mock's "Export
// enquiries" / "Export CSV" / "Download list" buttons).
// ---------------------------------------------------------------------------

const ENQUIRY_HEADER = ['Listing', 'Service', 'Name', 'Contact', 'Status', 'Message', 'Received'];

export const buildEnquiriesCsv = (rows: EnquiryEntry[]): string =>
    toCsv(ENQUIRY_HEADER, rows.map(r => [
        r.listingTitle, r.entity, r.name, r.contact, r.status, r.message, r.createdAt ?? '',
    ]));

const BOOKING_HEADER = ['Booking reference', 'Listing', 'Service', 'Customer', 'Amount', 'Status', 'Booked'];

export const buildBookingEntriesCsv = (rows: BookingEntry[]): string =>
    toCsv(BOOKING_HEADER, rows.map(r => [
        r.bookingReference, r.listingTitle, r.entity, r.customerName,
        formatRupees(r.amount), r.status, r.createdAt ?? '',
    ]));
