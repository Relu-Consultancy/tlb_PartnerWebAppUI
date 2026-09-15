import { formatRupees, toNumber } from '../../utils/format';
import { toCsv } from '../../utils/csv';

// ---------------------------------------------------------------------------
// Booking list → CSV for the "Events live today or tomorrow" download.
// Booking payload field names vary across endpoints, so each column probes
// the known spellings.
// ---------------------------------------------------------------------------

export const BOOKING_CSV_HEADER = ['Booking #', 'Customer', 'Phone', 'Email', 'Tickets', 'Amount', 'Status'];

const pick = (...values: unknown[]): string => {
    const found = values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
    return found === undefined ? '' : String(found);
};

export const bookingToRow = (b: any): string[] => {
    const amount = pick(b?.total_amount, b?.final_amount, b?.amount);
    const userName = [b?.user?.first_name, b?.user?.last_name].filter(Boolean).join(' ');
    return [
        pick(b?.booking_reference, b?.reference, b?.booking_number, b?.id),
        pick(b?.customer_name, b?.attendee_name, b?.user_name, b?.user?.name, userName),
        pick(b?.customer_phone, b?.phone, b?.user?.phone),
        pick(b?.customer_email, b?.email, b?.user?.email),
        pick(b?.quantity, b?.tickets_count, b?.ticket_count, b?.seats, b?.attendee_count),
        amount ? formatRupees(toNumber(amount)) : '',
        pick(b?.status),
    ];
};

export const buildBookingsCsv = (bookings: any[]): string =>
    toCsv(BOOKING_CSV_HEADER, bookings.map(bookingToRow));

/** "Sketching Walk — Cubbon Park" → "Sketching-Walk-Cubbon-Park" */
export const fileSafeName = (title: string): string =>
    title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'listing';
