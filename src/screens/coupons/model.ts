import { Coupon, CouponGender, CreateCouponInput } from '../../api/coupons';
import { parseDate, toNumber } from '../../utils/format';
import { CouponFormValues, CouponRow, CouponStatus, emptyCouponForm } from './types';

// ---------------------------------------------------------------------------
// Pure derivations for Coupons — status, display labels, form <-> API
// mapping, filtering and the redeemed/discount-given rollup. No React, no
// I/O, unit-tested directly.
// ---------------------------------------------------------------------------

/** A coupon's real lifecycle state — the mock's Active/Scheduled/Ended plus
 * the real `is_active` toggle (Paused), which the mock's demo data never showed. */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A coupon date in local time. The form sends bare dates ("2026-10-06"), which
 * `new Date()` reads as UTC midnight — 05:30 in India — so a coupon "valid till
 * 6 Oct" showed as Ended from 5:30 am on the 6th. A bare valid-till date means
 * through the end of that day; a bare valid-from date, from its start.
 */
export const couponDate = (value: string | null | undefined, edge: 'start' | 'end'): Date | null => {
    const m = DATE_ONLY.exec(String(value ?? ''));
    if (!m) return parseDate(value);
    const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
    return edge === 'end' ? new Date(y, mo, d, 23, 59, 59, 999) : new Date(y, mo, d);
};

/** YYYY-MM-DD for a date input, in local time (toISOString would give the UTC day). */
export const localDateKey = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const statusOf = (c: Pick<Coupon, 'is_active' | 'starts_at' | 'expires_at'>, now: Date): CouponStatus => {
    const expires = couponDate(c.expires_at, 'end');
    if (expires && expires.getTime() < now.getTime()) return 'ended';
    if (!c.is_active) return 'paused';
    const starts = couponDate(c.starts_at, 'start');
    if (starts && starts.getTime() > now.getTime()) return 'scheduled';
    return 'active';
};

export const rupees = (n: number): string => `Rs ${Math.round(n).toLocaleString('en-IN')}`;

export const discountLabel = (c: Pick<Coupon, 'discount_type' | 'discount_value'>): string =>
    c.discount_type === 'percent' ? `${toNumber(c.discount_value)}% off` : `${rupees(toNumber(c.discount_value))} off`;

export const capLabel = (c: Pick<Coupon, 'max_discount' | 'min_order_value'>): string => {
    if (c.max_discount) return `max ${rupees(toNumber(c.max_discount))}`;
    if (c.min_order_value) return `min booking ${rupees(toNumber(c.min_order_value))}`;
    return 'no ceiling';
};

export const usedLabel = (c: Pick<Coupon, 'usage_limit'>): string => (c.usage_limit ? `of ${c.usage_limit} uses` : 'unlimited');

const shortDate = (iso: string | null): string => {
    const d = parseDate(iso);
    if (!d) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const windowLabel = (c: Pick<Coupon, 'starts_at' | 'expires_at'>): string => {
    const from = shortDate(c.starts_at);
    const till = shortDate(c.expires_at);
    if (!from && !till) return 'no start date set';
    if (from && till) return `${from} – ${till}`;
    if (till) return `till ${till}`;
    return `from ${from}`;
};

// ── Applies to / Who can use it — real targeting fields ────────────────────

const LISTING_TYPE_LABEL: Record<string, string> = { event: 'Events', venue: 'Venues', class: 'Classes', program: 'Programs' };

export const scopeLabel = (
    c: Pick<CouponRow, 'target_listing_ids' | 'target_listing_types'>,
    listingTitleOf: (id: string) => string | undefined
): { scope: string; meta: string } => {
    if (c.target_listing_types.length > 0) {
        const names = c.target_listing_types.map((t) => LISTING_TYPE_LABEL[t] || t);
        return { scope: names.join(', '), meta: `whole categor${names.length > 1 ? 'ies' : 'y'}` };
    }
    if (c.target_listing_ids.length > 0) {
        if (c.target_listing_ids.length === 1) {
            return { scope: listingTitleOf(c.target_listing_ids[0]) || '1 listing', meta: '1 listing' };
        }
        return { scope: `${c.target_listing_ids.length} listings`, meta: 'picked listings' };
    }
    return { scope: 'All active listings', meta: 'every listing' };
};

const GENDER_LABEL: Record<CouponGender, string> = { male: 'Men', female: 'Women', other: 'Other' };

export const audienceLabel = (c: Pick<CouponRow, 'target_genders' | 'target_min_age' | 'target_max_age'>): string => {
    const parts: string[] = [];
    if (c.target_genders.length > 0) parts.push(c.target_genders.map((g) => GENDER_LABEL[g]).join(' & '));
    if (c.target_min_age != null && c.target_max_age != null) parts.push(`ages ${c.target_min_age}–${c.target_max_age}`);
    else if (c.target_min_age != null) parts.push(`ages ${c.target_min_age}+`);
    else if (c.target_max_age != null) parts.push(`up to age ${c.target_max_age}`);
    return parts.length ? parts.join(', ') : 'Anyone with the code';
};

// ── Live discount-impact preview, computed off the form's own values ───────

export const impactPreview = (
    form: Pick<CouponFormValues, 'discountType' | 'discountValue' | 'maxDiscount'>,
    sampleAmount = 1100
): string => {
    const value = toNumber(form.discountValue);
    if (!value) return 'Set a discount amount to preview its impact.';
    if (form.discountType === 'percent') {
        let off = Math.round((sampleAmount * value) / 100);
        const cap = toNumber(form.maxDiscount);
        if (cap && off > cap) off = cap;
        return `On a ${rupees(sampleAmount)} booking, ${value}% takes ${rupees(off)} off — the customer pays ${rupees(sampleAmount - off)}. TLB commission is still charged on the full ${rupees(sampleAmount)}.`;
    }
    return `A flat ${rupees(value)} comes off every qualifying booking, out of your share. TLB commission is still charged on the full listing price.`;
};

// ── Form <-> API mapping ────────────────────────────────────────────────────

export const formToInput = (form: CouponFormValues): CreateCouponInput => ({
    code: form.code.trim().toUpperCase(),
    discount_type: form.discountType,
    discount_value: toNumber(form.discountValue),
    max_discount: form.discountType === 'percent' && form.maxDiscount ? toNumber(form.maxDiscount) : null,
    description: form.description.trim() || undefined,
    min_order_value: form.minOrderValue ? toNumber(form.minOrderValue) : null,
    usage_limit: form.usageLimit ? Math.round(toNumber(form.usageLimit)) : null,
    per_user_limit: form.perUserLimit ? Math.round(toNumber(form.perUserLimit)) : 1,
    starts_at: form.startsAt || null,
    expires_at: form.expiresAt || null,
    target_listing_ids: form.scope === 'listings' ? form.listingIds : [],
    target_listing_types: (form.scope === 'categories' ? form.listingTypes : []) as CreateCouponInput['target_listing_types'],
    target_genders: form.genders.length ? form.genders : undefined,
    target_min_age: form.minAge ? Math.round(toNumber(form.minAge)) : null,
    target_max_age: form.maxAge ? Math.round(toNumber(form.maxAge)) : null,
});

// Local day, never the UTC one: a stored "6 Oct 00:00 IST" is 5 Oct in UTC, and
// editing would have shown — and re-saved — the day before, every time.
const toDateInput = (iso: string | null | undefined): string => {
    if (iso && DATE_ONLY.test(iso)) return iso;
    const d = parseDate(iso);
    return d ? localDateKey(d) : '';
};

export interface LimitErrors {
    usageLimit?: string;
    perUserLimit?: string;
    expiresAt?: string;
}

const wholeAtLeastOne = (v: string) => /^\d+$/.test(v.trim()) && Number(v) >= 1;

/**
 * The Limits row is optional — blank means unlimited / once per customer /
 * live now / never expires — but what is filled in must make a usable coupon.
 * A 0 there used to save a coupon nobody could ever redeem.
 */
export const limitErrors = (
    form: Pick<CouponFormValues, 'usageLimit' | 'perUserLimit' | 'startsAt' | 'expiresAt'>,
    { today, originalExpiresAt }: { today: string; originalExpiresAt?: string }
): LimitErrors => {
    const errors: LimitErrors = {};
    if (form.usageLimit.trim() && !wholeAtLeastOne(form.usageLimit)) errors.usageLimit = 'At least 1 — or leave blank for unlimited.';
    if (form.perUserLimit.trim() && !wholeAtLeastOne(form.perUserLimit)) errors.perUserLimit = 'At least 1 — or leave blank for once each.';
    else if (
        !errors.usageLimit &&
        form.usageLimit.trim() &&
        form.perUserLimit.trim() &&
        Number(form.perUserLimit) > Number(form.usageLimit)
    )
        errors.perUserLimit = 'Can’t be more than the total uses.';
    if (form.expiresAt) {
        if (form.startsAt && form.expiresAt < form.startsAt) errors.expiresAt = 'Must be on or after the start date.';
        // An already-past end date only matters when it's being set now, not on a coupon that has simply ended.
        else if (form.expiresAt < today && form.expiresAt !== originalExpiresAt) errors.expiresAt = 'That date has already passed.';
    }
    return errors;
};

export const couponToForm = (c: CouponRow): CouponFormValues => ({
    ...emptyCouponForm(),
    code: c.code,
    description: c.description || '',
    discountType: c.discount_type,
    discountValue: c.discount_value != null ? String(c.discount_value) : '',
    maxDiscount: c.max_discount != null ? String(c.max_discount) : '',
    minOrderValue: c.min_order_value != null ? String(c.min_order_value) : '',
    scope: c.target_listing_types.length > 0 ? 'categories' : c.target_listing_ids.length > 0 ? 'listings' : 'all',
    listingIds: c.target_listing_ids,
    listingTypes: c.target_listing_types,
    genders: c.target_genders,
    minAge: c.target_min_age != null ? String(c.target_min_age) : '',
    maxAge: c.target_max_age != null ? String(c.target_max_age) : '',
    usageLimit: c.usage_limit != null ? String(c.usage_limit) : '',
    perUserLimit: c.per_user_limit != null ? String(c.per_user_limit) : '1',
    startsAt: toDateInput(c.starts_at),
    expiresAt: toDateInput(c.expires_at),
});

// ── Filtering ────────────────────────────────────────────────────────────────

export interface CouponFilters {
    status: CouponStatus | 'all';
    search: string;
}

export const filterCoupons = (rows: CouponRow[], filters: CouponFilters): CouponRow[] =>
    rows
        .filter((r) => filters.status === 'all' || r.status === filters.status)
        .filter((r) => {
            const q = filters.search.trim().toLowerCase();
            if (!q) return true;
            return r.code.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
        });

// ── Headline stats ──────────────────────────────────────────────────────────

export interface CouponStats {
    redeemed: number;
    activeCount: number;
    discountGiven: number;
}

export const couponStats = (rows: CouponRow[], discountGiven: number): CouponStats => ({
    redeemed: rows.reduce((sum, r) => sum + (r.usage_count || 0), 0),
    activeCount: rows.filter((r) => r.status === 'active').length,
    discountGiven,
});
