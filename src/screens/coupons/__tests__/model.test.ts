import { describe, it, expect } from 'vitest';
import {
    audienceLabel, capLabel, couponStats, couponToForm, discountLabel, filterCoupons,
    formToInput, impactPreview, scopeLabel, statusOf, usedLabel, windowLabel,
} from '../model';
import { CouponRow, emptyCouponForm } from '../types';

const NOW = new Date(2026, 8, 15, 10, 0, 0); // 15 Sep 2026

const row = (overrides: Partial<CouponRow> = {}): CouponRow => ({
    id: '1', code: 'TEST10', discount_type: 'percent', discount_value: 10, is_active: true,
    usage_count: 0, usage_limit: null, expires_at: null, status: 'active', description: '',
    max_discount: null, min_order_value: null, per_user_limit: 1, starts_at: null,
    target_listing_ids: [], target_listing_types: [], target_genders: [], target_min_age: null, target_max_age: null,
    ...overrides,
});

describe('statusOf', () => {
    it('is ended once expires_at is in the past, regardless of is_active', () => {
        expect(statusOf({ is_active: true, starts_at: null, expires_at: '2020-01-01' }, NOW)).toBe('ended');
        expect(statusOf({ is_active: false, starts_at: null, expires_at: '2020-01-01' }, NOW)).toBe('ended');
    });

    it('is paused when inactive but not yet ended', () => {
        expect(statusOf({ is_active: false, starts_at: null, expires_at: null }, NOW)).toBe('paused');
    });

    it('is scheduled when starts_at is in the future', () => {
        expect(statusOf({ is_active: true, starts_at: '2099-01-01', expires_at: null }, NOW)).toBe('scheduled');
    });

    it('is active otherwise', () => {
        expect(statusOf({ is_active: true, starts_at: '2020-01-01', expires_at: null }, NOW)).toBe('active');
        expect(statusOf({ is_active: true, starts_at: null, expires_at: null }, NOW)).toBe('active');
    });
});

describe('discountLabel / capLabel / usedLabel / windowLabel', () => {
    it('formats percent and fixed discounts', () => {
        expect(discountLabel({ discount_type: 'percent', discount_value: 20 })).toBe('20% off');
        expect(discountLabel({ discount_type: 'fixed', discount_value: 300 })).toBe('Rs 300 off');
    });

    it('prefers a max-discount ceiling over a minimum-booking floor', () => {
        expect(capLabel({ max_discount: 400, min_order_value: 1000 })).toBe('max Rs 400');
        expect(capLabel({ max_discount: null, min_order_value: 1000 })).toBe('min booking Rs 1,000');
        expect(capLabel({ max_discount: null, min_order_value: null })).toBe('no ceiling');
    });

    it('shows unlimited when there is no usage_limit', () => {
        expect(usedLabel({ usage_limit: 100 })).toBe('of 100 uses');
        expect(usedLabel({ usage_limit: null })).toBe('unlimited');
    });

    it('formats the validity window from whichever dates are set', () => {
        expect(windowLabel({ starts_at: '2026-08-01', expires_at: '2026-08-31' })).toBe('1 Aug – 31 Aug');
        expect(windowLabel({ starts_at: '2026-07-12', expires_at: null })).toBe('from 12 Jul');
        expect(windowLabel({ starts_at: null, expires_at: '2026-09-30' })).toMatch(/^till 30 Sep/);
        expect(windowLabel({ starts_at: null, expires_at: null })).toBe('no start date set');
    });
});

describe('scopeLabel', () => {
    const titleOf = (id: string) => ({ l1: 'Pottery Term' } as Record<string, string>)[id];

    it('reads a category when target_listing_types is set', () => {
        expect(scopeLabel({ target_listing_ids: [], target_listing_types: ['event', 'class'] }, titleOf))
            .toEqual({ scope: 'Events, Classes', meta: 'whole categories' });
    });

    it('names the single listing when there is exactly one', () => {
        expect(scopeLabel({ target_listing_ids: ['l1'], target_listing_types: [] }, titleOf))
            .toEqual({ scope: 'Pottery Term', meta: '1 listing' });
    });

    it('counts multiple picked listings', () => {
        expect(scopeLabel({ target_listing_ids: ['l1', 'l2'], target_listing_types: [] }, titleOf))
            .toEqual({ scope: '2 listings', meta: 'picked listings' });
    });

    it('falls back to "All active listings" with no targeting at all', () => {
        expect(scopeLabel({ target_listing_ids: [], target_listing_types: [] }, titleOf))
            .toEqual({ scope: 'All active listings', meta: 'every listing' });
    });
});

describe('audienceLabel', () => {
    it('describes gender and/or age targeting, defaulting to "Anyone"', () => {
        expect(audienceLabel({ target_genders: [], target_min_age: null, target_max_age: null })).toBe('Anyone with the code');
        expect(audienceLabel({ target_genders: ['female'], target_min_age: null, target_max_age: null })).toBe('Women');
        expect(audienceLabel({ target_genders: [], target_min_age: 18, target_max_age: 30 })).toBe('ages 18–30');
        expect(audienceLabel({ target_genders: ['male'], target_min_age: 18, target_max_age: null })).toBe('Men, ages 18+');
    });
});

describe('impactPreview', () => {
    it('computes the customer payout and caps it at the max discount', () => {
        const uncapped = impactPreview({ discountType: 'percent', discountValue: '20', maxDiscount: '' });
        expect(uncapped).toContain('Rs 220 off');
        const capped = impactPreview({ discountType: 'percent', discountValue: '50', maxDiscount: '100' });
        expect(capped).toContain('Rs 100 off');
    });

    it('describes a flat discount without needing a sample amount', () => {
        expect(impactPreview({ discountType: 'fixed', discountValue: '300', maxDiscount: '' })).toContain('flat Rs 300');
    });

    it('asks for an amount when none is set', () => {
        expect(impactPreview({ discountType: 'percent', discountValue: '', maxDiscount: '' })).toMatch(/set a discount/i);
    });
});

describe('formToInput / couponToForm round-trip', () => {
    it('maps scope "categories" to target_listing_types and clears listing ids', () => {
        const form = { ...emptyCouponForm(), code: 'x', discountValue: '10', scope: 'categories' as const, listingTypes: ['event'], listingIds: ['ignored'] };
        const input = formToInput(form);
        expect(input.target_listing_types).toEqual(['event']);
        expect(input.target_listing_ids).toEqual([]);
    });

    it('maps scope "listings" to target_listing_ids and clears listing types', () => {
        const form = { ...emptyCouponForm(), code: 'x', discountValue: '10', scope: 'listings' as const, listingIds: ['l1'], listingTypes: ['event'] };
        const input = formToInput(form);
        expect(input.target_listing_ids).toEqual(['l1']);
        expect(input.target_listing_types).toEqual([]);
    });

    it('round-trips a coupon row into form values', () => {
        const r = row({ code: 'ABC', discount_type: 'fixed', discount_value: 300, target_listing_types: ['event'], usage_limit: 50 });
        const form = couponToForm(r);
        expect(form).toMatchObject({ code: 'ABC', discountType: 'fixed', discountValue: '300', scope: 'categories', listingTypes: ['event'], usageLimit: '50' });
    });
});

describe('filterCoupons', () => {
    const rows = [
        row({ id: 'a', code: 'ACTIVE1', status: 'active' }),
        row({ id: 'b', code: 'ENDED1', status: 'ended', description: 'old promo' }),
    ];

    it('filters by status and by code/description search', () => {
        expect(filterCoupons(rows, { status: 'active', search: '' }).map(r => r.id)).toEqual(['a']);
        expect(filterCoupons(rows, { status: 'all', search: 'old promo' }).map(r => r.id)).toEqual(['b']);
    });
});

describe('couponStats', () => {
    it('sums redemptions and counts active coupons', () => {
        const rows = [row({ usage_count: 10, status: 'active' }), row({ usage_count: 5, status: 'ended' })];
        expect(couponStats(rows, 1200)).toEqual({ redeemed: 15, activeCount: 1, discountGiven: 1200 });
    });
});
