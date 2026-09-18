import { describe, it, expect } from 'vitest';
import {
    demandOf, enrichFromDetail, filterListings, listingStateCounts, modelOf, synthListingCode,
} from '../model';
import { BookingEntry, EnquiryEntry } from '../../bookings-enquiries/types';
import { ListingRow } from '../types';

const NOW = new Date(2026, 8, 15, 10, 0, 0); // 15 Sep 2026, 10:00 local

describe('synthListingCode', () => {
    it('is stable for the same id and looks like LST-XXXXXX', () => {
        const a = synthListingCode('abc-123');
        const b = synthListingCode('abc-123');
        expect(a).toBe(b);
        expect(a).toMatch(/^LST-\d{6}$/);
    });

    it('differs for different ids', () => {
        expect(synthListingCode('one')).not.toBe(synthListingCode('two'));
    });
});

describe('modelOf', () => {
    it('is always ticketed for Events regardless of payload', () => {
        expect(modelOf('Events', { booking_type: 'enquiry' })).toBe('ticketed');
    });

    it('reads booking_type for Classes/Programs/Venues, defaulting to enquiry', () => {
        expect(modelOf('Classes', { booking_type: 'direct_booking' })).toBe('ticketed');
        expect(modelOf('Classes', { booking_type: 'enquiry' })).toBe('enquiry');
        expect(modelOf('Venues', {})).toBe('enquiry');
    });

    it('falls back to a nested service.booking_type for Classes', () => {
        expect(modelOf('Classes', { service: { booking_type: 'direct_booking' } })).toBe('ticketed');
    });
});

describe('enrichFromDetail — Events', () => {
    it('shows Free + capacity for a free event', () => {
        const r = enrichFromDetail('Events', { price_type: 'free', capacity: 50, city: 'Mumbai', area: 'Bandra' }, null, NOW);
        expect(r.priceLabel).toBe('Free');
        expect(r.capacityLabel).toBe('50 seats');
        expect(r.location).toBe('Bandra, Mumbai');
    });

    it('shows the lowest ticket price, "From" when there are multiple tiers', () => {
        const r = enrichFromDetail('Events', {
            price_type: 'paid',
            tickets: [{ price: 500, total_quantity: 20 }, { price: 900, total_quantity: 10 }],
        }, null, NOW);
        expect(r.priceLabel).toBe('From Rs 500');
        expect(r.capacityLabel).toBe('30 seats');
    });

    it('shows a plain price for a single ticket tier', () => {
        const r = enrichFromDetail('Events', { price_type: 'paid', tickets: [{ price: 500, total_quantity: 20 }] }, null, NOW);
        expect(r.priceLabel).toBe('Rs 500');
    });
});

describe('enrichFromDetail — Venues', () => {
    it('prices from the cheapest package, "By enquiry" when there are none', () => {
        const withPkgs = enrichFromDetail('Venues', { packages: [{ price: '5000.00' }, { price: '3000.00' }] }, null, NOW);
        expect(withPkgs.priceLabel).toBe('Rs 3,000');
        const withoutPkgs = enrichFromDetail('Venues', { packages: [] }, null, NOW);
        expect(withoutPkgs.priceLabel).toBe('By enquiry');
    });

    it('formats capacity as a range, a ceiling, or a floor depending on what is known', () => {
        expect(enrichFromDetail('Venues', { min_capacity: 10, max_capacity: 100 }, null, NOW).capacityLabel).toBe('10–100 guests');
        expect(enrichFromDetail('Venues', { max_capacity: 100 }, null, NOW).capacityLabel).toBe('Up to 100 guests');
        expect(enrichFromDetail('Venues', { min_capacity: 10 }, null, NOW).capacityLabel).toBe('10+ guests');
        expect(enrichFromDetail('Venues', {}, null, NOW).capacityLabel).toBe('—');
    });

    it('picks the earliest upcoming availability slot over the fallback date', () => {
        const r = enrichFromDetail('Venues', {
            availability: [{ date: '2026-09-01' }, { date: '2026-09-20' }],
        }, '2099-01-01T00:00:00Z', NOW);
        expect(r.startsAt).toBe(new Date('2026-09-20').toISOString());
    });
});

describe('enrichFromDetail — Classes and Programs', () => {
    it('uses the listing price field when present', () => {
        const r = enrichFromDetail('Classes', { price: '1200', batches: [{ total_seats: 12, is_active: true }] }, null, NOW);
        expect(r.priceLabel).toBe('Rs 1,200');
        expect(r.capacityLabel).toBe('12 places');
    });

    it('falls back to the first active batch fee when there is no listing-level price', () => {
        const r = enrichFromDetail('Classes', { batches: [{ fee: '500.00', total_seats: 20, is_active: true }] }, null, NOW);
        expect(r.priceLabel).toBe('Rs 500');
    });

    it('uses max_capacity for Programs, falling back to the batch size', () => {
        expect(enrichFromDetail('Programs', { max_capacity: 30, batches: [] }, null, NOW).capacityLabel).toBe('30 places');
        expect(enrichFromDetail('Programs', { batches: [{ total_seats: 15, is_active: true }] }, null, NOW).capacityLabel).toBe('15 places');
    });

    it('reads price/city from a nested `service` object when present', () => {
        const r = enrichFromDetail('Classes', { service: { price: '900', city: 'Mumbai', area: 'Andheri', batches: [] } }, null, NOW);
        expect(r.priceLabel).toBe('Rs 900');
        expect(r.location).toBe('Andheri, Mumbai');
    });
});

describe('enrichFromDetail — is_refundable', () => {
    it('defaults to refundable when the field is absent, across every entity type', () => {
        expect(enrichFromDetail('Events', {}, null, NOW).isRefundable).toBe(true);
        expect(enrichFromDetail('Venues', {}, null, NOW).isRefundable).toBe(true);
        expect(enrichFromDetail('Classes', {}, null, NOW).isRefundable).toBe(true);
        expect(enrichFromDetail('Programs', {}, null, NOW).isRefundable).toBe(true);
    });

    it('reads is_refundable: false, across every entity type', () => {
        expect(enrichFromDetail('Events', { is_refundable: false }, null, NOW).isRefundable).toBe(false);
        expect(enrichFromDetail('Venues', { is_refundable: false }, null, NOW).isRefundable).toBe(false);
        expect(enrichFromDetail('Classes', { is_refundable: false }, null, NOW).isRefundable).toBe(false);
        expect(enrichFromDetail('Programs', { is_refundable: false }, null, NOW).isRefundable).toBe(false);
    });
});

describe('filterListings', () => {
    const row = (overrides: Partial<ListingRow> = {}): ListingRow => ({
        id: '1', title: 'Pottery Term', entityType: 'Classes', code: 'LST-100000', state: 'live',
        coverUrl: null, createdAt: null, reviewMessage: '', startsAt: null, enriched: true,
        model: 'enquiry', priceLabel: '—', capacityLabel: '—', location: '—', category: '',
        description: '', galleryUrls: [], isRefundable: true, ...overrides,
    });
    const rows = [
        row({ id: 'a', title: 'Pottery Term', entityType: 'Classes', state: 'live' }),
        row({ id: 'b', title: 'Indigo Dyeing Evening', entityType: 'Events', state: 'pending' }),
        row({ id: 'c', title: 'Creative Studio', entityType: 'Venues', state: 'live' }),
    ];

    it('filters by scope, status and text search over title/code', () => {
        expect(filterListings(rows, { scope: 'Classes', status: 'any', search: '' }).map(r => r.id)).toEqual(['a']);
        expect(filterListings(rows, { scope: 'all', status: 'pending', search: '' }).map(r => r.id)).toEqual(['b']);
        expect(filterListings(rows, { scope: 'all', status: 'any', search: 'studio' }).map(r => r.id)).toEqual(['c']);
    });
});

describe('demandOf', () => {
    const enquiry = (overrides: Partial<EnquiryEntry> = {}): EnquiryEntry => ({
        id: '1', entity: 'Classes', listingId: 'l1', listingTitle: '', name: '', detail: '', contact: '',
        isUnlocked: false, status: 'new', message: '', notes: '', createdAt: NOW.toISOString(), ...overrides,
    });
    const booking = (overrides: Partial<BookingEntry> = {}): BookingEntry => ({
        id: '1', entity: 'Events', listingId: 'l1', listingTitle: '', bookingReference: '', customerName: '',
        amount: 0, currency: 'INR', status: 'confirmed', paymentStatus: 'paid', createdAt: NOW.toISOString(),
        listingStartsAt: null, ...overrides,
    });

    it('counts enquiries in range for an enquiry-model listing', () => {
        const enquiries = [enquiry({ id: 'a', listingId: 'l1' }), enquiry({ id: 'b', listingId: 'l1' }), enquiry({ id: 'c', listingId: 'l2' })];
        const d = demandOf({ id: 'l1', model: 'enquiry' }, enquiries, [], '30d', NOW);
        expect(d.count).toBe(2);
        expect(d.label).toBe('2 enquiries');
    });

    it('counts non-cancelled bookings in range for a ticketed listing', () => {
        const bookings = [booking({ id: 'a', listingId: 'l1' }), booking({ id: 'b', listingId: 'l1', status: 'cancelled' })];
        const d = demandOf({ id: 'l1', model: 'ticketed' }, [], bookings, '30d', NOW);
        expect(d.count).toBe(1);
        expect(d.label).toBe('1 booking');
    });

    it('excludes records outside the selected date range', () => {
        const old = enquiry({ id: 'a', listingId: 'l1', createdAt: new Date(2020, 0, 1).toISOString() });
        expect(demandOf({ id: 'l1', model: 'enquiry' }, [old], [], '30d', NOW).count).toBe(0);
    });
});

describe('listingStateCounts', () => {
    it('tallies each state plus a total', () => {
        const rows = ['live', 'live', 'pending', 'paused'].map((state, i) => ({ id: String(i), state } as ListingRow));
        const counts = listingStateCounts(rows);
        expect(counts).toMatchObject({ live: 2, pending: 1, paused: 1, draft: 0, rejected: 0, archived: 0, total: 4 });
    });
});
