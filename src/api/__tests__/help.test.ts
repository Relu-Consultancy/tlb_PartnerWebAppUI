import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { getTicketCategories, isBookingCategory, ticketCategoryLabel } from '../help';

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
