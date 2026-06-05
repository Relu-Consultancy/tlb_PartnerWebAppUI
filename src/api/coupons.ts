import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Partner coupons / discount codes
// Base: /api/v1/partner/coupons/
// Requires an APPROVED partner (IsApprovedPartner).
//
// Discount rules (applied server-side):
//   percent: final = amount - (amount × discount_value / 100), capped at max_discount
//   fixed:   final = amount - discount_value
//   Coupons are blocked on ₹0 (free) bookings.
// ---------------------------------------------------------------------------

export type CouponDiscountType = 'percent' | 'fixed';
export type CouponListingType = 'event' | 'venue' | 'program' | 'class';
export type CouponGender = 'male' | 'female' | 'other';

export interface CreateCouponInput {
    code: string;
    discount_type: CouponDiscountType;
    discount_value: number;
    /** Cap in ₹ (percent only). */
    max_discount?: number | null;
    description?: string;
    /** Minimum booking total required to apply. */
    min_order_value?: number | null;
    /** Total redemptions allowed; null = unlimited. */
    usage_limit?: number | null;
    /** Redemptions allowed per user (default 1). */
    per_user_limit?: number;
    starts_at?: string | null;
    expires_at?: string | null;
    // Targeting (all optional)
    target_listing_ids?: string[];
    target_event_category_ids?: number[];
    target_listing_types?: CouponListingType[];
    target_genders?: CouponGender[];
    target_min_age?: number | null;
    target_max_age?: number | null;
}

/** Shape returned by the list endpoint. */
export interface CouponListItem {
    id: string;
    code: string;
    discount_type: CouponDiscountType;
    discount_value: number;
    is_active: boolean;
    usage_count: number;
    usage_limit: number | null;
    expires_at: string | null;
}

/** Full coupon detail. */
export interface Coupon extends CouponListItem {
    description?: string;
    max_discount?: number | null;
    min_order_value?: number | null;
    per_user_limit?: number;
    starts_at?: string | null;
    target_listings?: Array<{ id: string; title?: string }>;
    target_event_categories?: Array<{ id: number; name?: string }>;
    target_listing_types?: CouponListingType[];
    target_genders?: CouponGender[];
    target_min_age?: number | null;
    target_max_age?: number | null;
    created_at?: string;
}

export interface CouponUsage {
    coupon_code: string;
    customer_email: string;
    booking_reference: string;
    discount_applied: number;
    used_at: string;
}

export interface ListCouponsParams {
    is_active?: boolean;
    discount_type?: CouponDiscountType;
}

// ── Helper: unwrap { success, data } / paginated { results } envelope ──
const unwrap = async <T>(response: Response, fallbackErr: string): Promise<T> => {
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        const serverMsg = err?.error?.message || err?.message || err?.detail;
        throw new Error(serverMsg || `${fallbackErr} (HTTP ${response.status})`);
    }
    const json = await response.json();
    return (json?.data ?? json) as T;
};

const unwrapList = async <T>(response: Response, fallbackErr: string): Promise<T[]> => {
    const data = await unwrap<{ results?: T[] } | T[]>(response, fallbackErr);
    return Array.isArray(data) ? data : (data.results ?? []);
};

/** GET /partner/coupons/ — list this partner's coupons (optionally filtered). */
export const getCoupons = async (params?: ListCouponsParams): Promise<CouponListItem[]> => {
    const qs = new URLSearchParams();
    if (params?.is_active !== undefined) qs.set('is_active', String(params.is_active));
    if (params?.discount_type) qs.set('discount_type', params.discount_type);
    const query = qs.toString();
    const res = await apiClient(`/api/v1/partner/coupons/${query ? `?${query}` : ''}`);
    return unwrapList<CouponListItem>(res, 'Failed to load coupons');
};

/** GET /partner/coupons/{id}/ — full coupon detail. */
export const getCoupon = async (couponId: string): Promise<Coupon> => {
    const res = await apiClient(`/api/v1/partner/coupons/${couponId}/`);
    return unwrap<Coupon>(res, 'Failed to load coupon');
};

/** POST /partner/coupons/ — create a coupon. */
export const createCoupon = async (input: CreateCouponInput): Promise<Coupon> => {
    const res = await apiClient('/api/v1/partner/coupons/', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    return unwrap<Coupon>(res, 'Failed to create coupon');
};

/** PATCH /partner/coupons/{id}/ — partial update (any subset of create fields). */
export const updateCoupon = async (
    couponId: string,
    input: Partial<CreateCouponInput> & { is_active?: boolean },
): Promise<Coupon> => {
    const res = await apiClient(`/api/v1/partner/coupons/${couponId}/`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
    return unwrap<Coupon>(res, 'Failed to update coupon');
};

/** DELETE /partner/coupons/{id}/ — soft delete (is_active → false; code stays reserved). */
export const deactivateCoupon = async (couponId: string): Promise<{ message: string }> => {
    const res = await apiClient(`/api/v1/partner/coupons/${couponId}/`, { method: 'DELETE' });
    return unwrap<{ message: string }>(res, 'Failed to deactivate coupon');
};

/** GET /partner/coupons/{id}/usages/ — redemption history. */
export const getCouponUsages = async (couponId: string): Promise<CouponUsage[]> => {
    const res = await apiClient(`/api/v1/partner/coupons/${couponId}/usages/`);
    return unwrapList<CouponUsage>(res, 'Failed to load coupon usage history');
};
