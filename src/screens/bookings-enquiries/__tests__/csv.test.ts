import { describe, it, expect } from 'vitest';
import { buildBookingEntriesCsv, buildEnquiriesCsv } from '../csv';
import { BookingEntry, EnquiryEntry } from '../types';

const enquiry: EnquiryEntry = {
    id: '1', entity: 'Venues', listingId: 'l1', listingTitle: 'Creative Studio — Weekend hire',
    name: 'Neha Rao', detail: '30 people', contact: '+91 98450 22114', isUnlocked: true,
    status: 'new', message: 'Is the studio free on 23 Aug?', notes: '', createdAt: '2026-08-21T10:00:00Z',
};

const booking: BookingEntry = {
    id: '1', entity: 'Events', listingId: 'l2', listingTitle: 'Indigo Dyeing Evening',
    bookingReference: 'BKG-4492', customerName: 'Divya Suresh', amount: 2200, currency: 'INR',
    status: 'confirmed', paymentStatus: 'paid', createdAt: '2026-09-15T09:00:00Z', listingStartsAt: null,
};

describe('buildEnquiriesCsv', () => {
    it('writes a header row and one row per enquiry', () => {
        const rows = buildEnquiriesCsv([enquiry]).split('\r\n');
        expect(rows[0]).toContain('Listing');
        expect(rows[1]).toContain('Creative Studio — Weekend hire');
        expect(rows[1]).toContain('Neha Rao');
    });
});

describe('buildBookingEntriesCsv', () => {
    it('writes a header row and formats the amount in rupees', () => {
        const rows = buildBookingEntriesCsv([booking]).split('\r\n');
        expect(rows[0]).toContain('Booking reference');
        expect(rows[1]).toContain('BKG-4492');
        expect(rows[1]).toContain('Rs 2,200');
    });
});
