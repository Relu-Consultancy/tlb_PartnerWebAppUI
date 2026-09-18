import { useCallback, useEffect, useState } from 'react';
import {
    Coupon, CreateCouponInput, getCoupon, getCouponUsages, getCoupons, updateCoupon, createCoupon,
} from '../../api/coupons';
import { toast } from '../../components/ui';
import { statusOf } from './model';
import { CouponRow } from './types';

// ---------------------------------------------------------------------------
// Loads every coupon, then enriches each with its full detail (targeting,
// dates, description) — a bounded fan-out, one call per coupon, since the
// list endpoint only returns the summary fields. A second bounded fan-out
// over usage history powers the "discount given" stat.
// ---------------------------------------------------------------------------

const toRow = (c: Coupon, now: Date): CouponRow => ({
    ...c,
    status: statusOf(c, now),
    description: c.description || '',
    max_discount: c.max_discount ?? null,
    min_order_value: c.min_order_value ?? null,
    per_user_limit: c.per_user_limit ?? 1,
    starts_at: c.starts_at ?? null,
    target_listing_ids: (c.target_listings || []).map(l => l.id),
    target_listing_types: c.target_listing_types || [],
    target_genders: c.target_genders || [],
    target_min_age: c.target_min_age ?? null,
    target_max_age: c.target_max_age ?? null,
});

interface State {
    loading: boolean;
    rows: CouponRow[];
    discountGiven: number;
    error: string | null;
}

export const useCouponsData = () => {
    const [state, setState] = useState<State>({ loading: true, rows: [], discountGiven: 0, error: null });

    const load = useCallback(async () => {
        setState({ loading: true, rows: [], discountGiven: 0, error: null });
        const now = new Date();
        try {
            const list = await getCoupons();
            if (list.length === 0) { setState({ loading: false, rows: [], discountGiven: 0, error: null }); return; }

            const details = await Promise.allSettled(list.map(c => getCoupon(c.id)));
            const rows: CouponRow[] = details.map((r, i) =>
                r.status === 'fulfilled' ? toRow(r.value, now) : toRow(list[i] as unknown as Coupon, now));
            setState({ loading: false, rows, discountGiven: 0, error: null });

            const usages = await Promise.allSettled(rows.map(r => getCouponUsages(r.id)));
            const discountGiven = usages.reduce((sum, r) => {
                if (r.status !== 'fulfilled') return sum;
                return sum + r.value.reduce((s, u) => s + (Number(u.discount_applied) || 0), 0);
            }, 0);
            setState(s => ({ ...s, discountGiven }));
        } catch (err: any) {
            console.error('Coupons load failed', err);
            setState({ loading: false, rows: [], discountGiven: 0, error: err?.message || 'Failed to load coupons.' });
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const patch = (id: string, changes: Partial<CouponRow>) =>
        setState(s => ({ ...s, rows: s.rows.map(r => r.id === id ? { ...r, ...changes } : r) }));

    const togglePause = async (row: CouponRow) => {
        const wasActive = row.is_active;
        patch(row.id, { is_active: !wasActive, status: statusOf({ ...row, is_active: !wasActive }, new Date()) });
        try {
            await updateCoupon(row.id, { is_active: !wasActive });
        } catch (err: any) {
            patch(row.id, { is_active: wasActive, status: row.status });
            toast.error(err?.message || 'Couldn’t update the coupon. Please try again.');
        }
    };

    const save = async (input: CreateCouponInput, editingId: string | null): Promise<boolean> => {
        try {
            if (editingId) await updateCoupon(editingId, input);
            else await createCoupon(input);
            await load();
            return true;
        } catch (err: any) {
            toast.error(err?.message || 'Couldn’t save the coupon. Please try again.');
            return false;
        }
    };

    return { loading: state.loading, rows: state.rows, discountGiven: state.discountGiven, error: state.error, reload: load, togglePause, save };
};
