import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Partner coupons / discount codes
// Base: /api/v1/partner/coupons/
//
// NOTE: the partner coupons API is not live yet. These functions are written
// against the expected contract so the screen can be wired in one line each
// once the backend ships. Until then, `createCoupon` will reject and the screen
// surfaces a friendly "not connected yet" message.
// ---------------------------------------------------------------------------

export type CouponDiscountType = 'percentage' | 'fixed';
export type CouponAppliesTo = 'all_listings' | 'specific_listing' | 'category';

export interface Coupon {
    id: string;
    code: string;
    description: string;
    discount_type: CouponDiscountType;
    /** Percent (0–100) when type=percentage, or rupee amount when type=fixed. */
    discount_value: number;
    /** Optional cap on the rupee value of a percentage discount. */
    max_discount: number | null;
    /** Minimum order value required to apply the coupon. */
    min_order_value: number | null;
    usage_limit: number | null;
    used_count: number;
    applies_to: CouponAppliesTo;
    /** Set when applies_to=specific_listing / category. */
    target_id: string | null;
    starts_at: string | null;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

export interface CreateCouponInput {
    code: string;
    description?: string;
    discount_type: CouponDiscountType;
    discount_value: number;
    max_discount?: number | null;
    min_order_value?: number | null;
    usage_limit?: number | null;
    applies_to: CouponAppliesTo;
    target_id?: string | null;
    starts_at?: string | null;
    expires_at?: string | null;
}

// ── Helper: unwrap { success, data } envelope ──
const unwrap = async <T>(response: Response, fallbackErr: string): Promise<T> => {
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        const serverMsg = err?.error?.message || err?.message;
        throw new Error(serverMsg || `${fallbackErr} (HTTP ${response.status})`);
    }
    const json = await response.json();
    return (json?.data ?? json) as T;
};

/** GET /partner/coupons/ — list this partner's coupons. */
export const getCoupons = async (): Promise<Coupon[]> => {
    const res = await apiClient('/api/v1/partner/coupons/');
    const data = await unwrap<{ results?: Coupon[] } | Coupon[]>(res, 'Failed to load coupons');
    return Array.isArray(data) ? data : (data.results ?? []);
};

/** GET /partner/coupons/{id}/ — single coupon detail. */
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

/** PATCH /partner/coupons/{id}/ — partial update (e.g. toggle active). */
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

/** DELETE /partner/coupons/{id}/ — remove a coupon. */
export const deleteCoupon = async (couponId: string): Promise<void> => {
    const res = await apiClient(`/api/v1/partner/coupons/${couponId}/`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || `Failed to delete coupon (HTTP ${res.status})`);
    }
};
