import { CouponGender, CouponListItem } from '../../api/coupons';

// ---------------------------------------------------------------------------
// Coupons — client mock's shape adapted to the real coupon API. The mock's
// "who can use it" cohorts (first-time / past customers / hand-picked people)
// have no backing endpoint, so this screen targets what the API actually
// supports instead: gender and age range. See model.ts / presentation.ts for
// the full list of adaptations.
// ---------------------------------------------------------------------------

export type CouponStatus = 'active' | 'scheduled' | 'ended' | 'paused';

/** A coupon list row, enriched with the derived display fields the table needs. */
export interface CouponRow extends CouponListItem {
    status: CouponStatus;
    description: string;
    max_discount: number | null;
    min_order_value: number | null;
    per_user_limit: number;
    starts_at: string | null;
    target_listing_ids: string[];
    target_listing_types: string[];
    target_genders: CouponGender[];
    target_min_age: number | null;
    target_max_age: number | null;
}

export interface CouponFormValues {
    code: string;
    description: string;
    discountType: 'percent' | 'fixed';
    discountValue: string;
    maxDiscount: string;
    minOrderValue: string;
    scope: 'all' | 'listings' | 'categories';
    listingIds: string[];
    listingTypes: string[];
    genders: CouponGender[];
    minAge: string;
    maxAge: string;
    usageLimit: string;
    perUserLimit: string;
    startsAt: string;
    expiresAt: string;
}

export const emptyCouponForm = (): CouponFormValues => ({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: '',
    maxDiscount: '',
    minOrderValue: '',
    scope: 'all',
    listingIds: [],
    listingTypes: [],
    genders: [],
    minAge: '',
    maxAge: '',
    usageLimit: '',
    perUserLimit: '1',
    startsAt: '',
    expiresAt: '',
});
