import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { defaultTicketCategory, getTicketCategories, isBookingCategory, isBookingRequiredError, ticketCategoryLabel } from '../help';

const BASE = 'https://tlb-api.reluconsultancy.in';
const CATEGORIES_URL = `${BASE}/api/v1/help/tickets/categories/`;

const serveCategories = (data: unknown) => server.use(http.get(CATEGORIES_URL, () => HttpResponse.json({ success: true, data })));

describe('getTicketCategories — labels', () => {
    it('renames the backend’s "Event Review" to "Listing Review" without changing the posted value', async () => {
        serveCategories([{ value: 'event_review', label: 'Event Review' }]);
        const categories = await getTicketCategories();
        const review = categories.find((c) => c.value === 'event_review');
        expect(review?.label).toBe('Listing Review');
    });

    it('renames by the server label too, for deployments that key categories by id', async () => {
        serveCategories([{ id: 4, name: 'Event Review' }]);
        const categories = await getTicketCategories();
        expect(categories[0]).toEqual({ value: '4', label: 'Listing Review' });
    });

    it('offers Listings Issue and Bookings Issue even when the endpoint omits them', async () => {
        serveCategories([
            { value: 'event_review', label: 'Event Review' },
            { value: 'listing_bug', label: 'Listing Bug' },
        ]);
        const labels = (await getTicketCategories()).map((c) => c.label);
        expect(labels).toContain('Listings Issue');
        expect(labels).toContain('Bookings Issue');
        // Listing Bug is a different category and must survive alongside them.
        expect(labels).toContain('Listing Bug');
    });

    it('does not duplicate a category the endpoint already returns', async () => {
        serveCategories([{ value: 'listing_issue', label: 'Listing Issue' }]);
        const categories = await getTicketCategories();
        expect(categories.filter((c) => c.value === 'listing_issue')).toHaveLength(1);
        expect(categories[0].label).toBe('Listings Issue');
    });

    it('still falls back to the default list when the endpoint fails', async () => {
        server.use(http.get(CATEGORIES_URL, () => HttpResponse.json({ error: { message: 'boom' } }, { status: 500 })));
        const categories = await getTicketCategories();
        expect(categories.length).toBeGreaterThan(0);
        expect(categories.map((c) => c.label)).toContain('Bookings Issue');
    });
});

describe('ticketCategoryLabel', () => {
    it('applies the same renames to tickets already filed under the old wording', () => {
        expect(ticketCategoryLabel('event_review')).toBe('Listing Review');
        expect(ticketCategoryLabel('listing_issue')).toBe('Listings Issue');
        expect(ticketCategoryLabel('booking_issue')).toBe('Bookings Issue');
    });

    it('humanizes anything it has no override for', () => {
        expect(ticketCategoryLabel('listing_bug')).toBe('Listing Bug');
        expect(ticketCategoryLabel('')).toBe('');
    });
});

describe('isBookingCategory', () => {
    it('is true only for booking-scoped categories — the ones that show the booking picker', () => {
        expect(isBookingCategory('booking_issue')).toBe(true);
        expect(isBookingCategory('Booking Issue')).toBe(true);
        expect(isBookingCategory('booking_refund')).toBe(true);
    });

    it('is false for every other category', () => {
        expect(isBookingCategory('event_review')).toBe(false);
        expect(isBookingCategory('listing_issue')).toBe(false);
        expect(isBookingCategory('listing_bug')).toBe(false);
        expect(isBookingCategory('')).toBe(false);
    });
});

describe('defaultTicketCategory', () => {
    it('never defaults to the server’s first category when that one is tied to a booking', () => {
        const categories = [
            { value: 'event_review', label: 'Listing Review' },
            { value: 'booking_issue', label: 'Bookings Issue' },
            { value: 'other', label: 'Other' },
        ];
        expect(defaultTicketCategory(categories)).toBe('other');
    });

    it('falls back to the first general category, matching labels for id-keyed deployments', () => {
        expect(
            defaultTicketCategory([
                { value: '1', label: 'Event Review' },
                { value: '2', label: 'Refund Request' },
                { value: '3', label: 'Profile Help' },
            ])
        ).toBe('3');
        expect(
            defaultTicketCategory([
                { value: '9', label: 'Other' },
                { value: '1', label: 'Booking' },
            ])
        ).toBe('9');
    });

    it('uses whatever exists when every category is booking-tied, and nothing when there are none', () => {
        expect(defaultTicketCategory([{ value: 'booking_issue', label: 'Bookings Issue' }])).toBe('booking_issue');
        expect(defaultTicketCategory([])).toBe('');
    });
});

describe('isBookingRequiredError', () => {
    it('recognises the backend’s booking refusal', () => {
        expect(isBookingRequiredError('No booking found or does not belong to you.')).toBe(true);
        expect(isBookingRequiredError('A booking is required for this category')).toBe(true);
    });

    it('leaves other failures alone', () => {
        expect(isBookingRequiredError('Failed to raise ticket (HTTP 500)')).toBe(false);
        expect(isBookingRequiredError(undefined)).toBe(false);
    });
});
