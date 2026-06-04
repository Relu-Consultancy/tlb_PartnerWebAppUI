import React, { useMemo, useState } from 'react';
import {
    Ticket, Percent, IndianRupee, Tag, CalendarClock, Users,
    CheckCircle2, AlertCircle, Sparkles, ArrowLeft, Layers, CalendarDays, GraduationCap, MapPin,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../../types';
import { createCoupon, CouponAppliesTo, CouponDiscountType, CreateCouponInput } from '../../api/coupons';
import { Select, SelectOption } from '../../components/ui';

const APPLIES_TO_OPTIONS: SelectOption[] = [
    { value: 'all_listings', label: 'All Listings', icon: Layers, description: 'Coupon works on everything you offer' },
    { value: 'specific_listing', label: 'Specific Listing', icon: Tag, description: 'Limit to a single listing' },
    { value: 'category', label: 'Category', icon: GraduationCap, description: 'Limit to one offering type' },
];

// Main offering categories a coupon can target
const CATEGORY_OPTIONS: SelectOption[] = [
    { value: 'Events', label: 'Events', icon: CalendarDays },
    { value: 'Classes', label: 'Classes', icon: GraduationCap },
    { value: 'Programs', label: 'Programs', icon: Layers },
    { value: 'Venues', label: 'Venues', icon: MapPin },
];

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface FormState {
    code: string;
    description: string;
    discountType: CouponDiscountType;
    discountValue: string;
    maxDiscount: string;
    minOrderValue: string;
    usageLimit: string;
    appliesTo: CouponAppliesTo;
    targetId: string;
    startsAt: string;
    expiresAt: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
    code: '', description: '', discountType: 'percentage', discountValue: '',
    maxDiscount: '', minOrderValue: '', usageLimit: '', appliesTo: 'all_listings',
    targetId: '', startsAt: '', expiresAt: '',
};

const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2';

export const CreateCoupon: React.FC<Props> = ({ onNavigate, onOpenSidebar }) => {
    const [form, setForm] = useState<FormState>(INITIAL);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
        if (banner) setBanner(null);
    };

    const validate = (): boolean => {
        const e: FieldErrors = {};
        const code = form.code.trim();
        if (!code) e.code = 'Coupon code is required.';
        else if (!/^[A-Z0-9_-]{3,20}$/.test(code)) e.code = 'Use 3–20 chars: A–Z, 0–9, - or _.';

        const val = Number(form.discountValue);
        if (!form.discountValue.trim()) e.discountValue = 'Discount value is required.';
        else if (Number.isNaN(val) || val <= 0) e.discountValue = 'Enter a value greater than 0.';
        else if (form.discountType === 'percentage' && val > 100) e.discountValue = 'Percentage cannot exceed 100.';

        if (form.maxDiscount && Number(form.maxDiscount) <= 0) e.maxDiscount = 'Must be greater than 0.';
        if (form.minOrderValue && Number(form.minOrderValue) < 0) e.minOrderValue = 'Cannot be negative.';
        if (form.usageLimit && (!Number.isInteger(Number(form.usageLimit)) || Number(form.usageLimit) < 1))
            e.usageLimit = 'Enter a whole number ≥ 1.';
        if (form.startsAt && form.expiresAt && form.startsAt > form.expiresAt)
            e.expiresAt = 'Expiry must be after the start date.';
        if (form.appliesTo !== 'all_listings' && !form.targetId.trim())
            e.targetId = form.appliesTo === 'specific_listing' ? 'Listing ID is required.' : 'Category is required.';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const buildPayload = (): CreateCouponInput => ({
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        discount_type: form.discountType,
        discount_value: Number(form.discountValue),
        max_discount: form.discountType === 'percentage' && form.maxDiscount ? Number(form.maxDiscount) : null,
        min_order_value: form.minOrderValue ? Number(form.minOrderValue) : null,
        usage_limit: form.usageLimit ? Number(form.usageLimit) : null,
        applies_to: form.appliesTo,
        target_id: form.appliesTo === 'all_listings' ? null : form.targetId.trim(),
        starts_at: form.startsAt || null,
        expires_at: form.expiresAt || null,
    });

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        setBanner(null);
        try {
            await createCoupon(buildPayload());
            setBanner({ type: 'success', text: `Coupon "${form.code.trim().toUpperCase()}" created successfully.` });
            setForm(INITIAL);
        } catch (err: any) {
            const raw = err?.message || '';
            const notConnected = /HTTP (404|5\d\d)|Failed to fetch|NetworkError/i.test(raw);
            setBanner({
                type: 'error',
                text: notConnected
                    ? 'The coupons API is not connected yet. Your coupon could not be saved.'
                    : raw || 'Something went wrong while creating the coupon.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const previewCode = form.code.trim().toUpperCase() || 'YOURCODE';
    const previewDiscount = useMemo(() => {
        const v = Number(form.discountValue);
        if (!form.discountValue || Number.isNaN(v)) return form.discountType === 'percentage' ? '0%' : '₹0';
        return form.discountType === 'percentage' ? `${v}%` : `₹${v}`;
    }, [form.discountValue, form.discountType]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white/90 backdrop-blur-sm px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                <button
                    onClick={() => onNavigate('ALL_COUPONS')}
                    className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-900"
                    aria-label="Back to coupons"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline text-sm font-bold">Coupons</span>
                </button>
                <div className="flex-1">
                    <h1 className="tlb-page-title">Create Coupon</h1>
                    <p className="tlb-page-sub">Set up a new discount or promotional code</p>
                </div>
            </header>

            <main className="p-5 md:p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {banner && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium border ${
                                banner.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                            {banner.type === 'success'
                                ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                                : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                            <span>{banner.text}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Fields */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="tlb-card space-y-5">
                                <h3 className="tlb-label">Coupon Details</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Coupon Code *</label>
                                        <input
                                            type="text" value={form.code}
                                            onChange={(e) => set('code', e.target.value.toUpperCase())}
                                            placeholder="e.g. SAVE20"
                                            className={`tlb-input font-mono ${errors.code ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.code && <p className="text-xs text-red-500 mt-1.5">{errors.code}</p>}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Discount Type *</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {([
                                                { v: 'percentage' as const, label: 'Percent', icon: Percent },
                                                { v: 'fixed' as const, label: 'Fixed ₹', icon: IndianRupee },
                                            ]).map(({ v, label, icon: Icon }) => {
                                                const active = form.discountType === v;
                                                return (
                                                    <button
                                                        key={v} type="button" onClick={() => set('discountType', v)}
                                                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                                            active ? 'bg-tlb-yellow border-tlb-yellow text-tlb-dark'
                                                                   : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        <Icon size={15} /> {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Description</label>
                                    <input
                                        type="text" value={form.description}
                                        onChange={(e) => set('description', e.target.value)}
                                        placeholder="Shown to customers (optional)"
                                        className="tlb-input"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>{form.discountType === 'percentage' ? 'Discount % *' : 'Discount ₹ *'}</label>
                                        <input
                                            type="number" min="0" value={form.discountValue}
                                            onChange={(e) => set('discountValue', e.target.value)}
                                            placeholder={form.discountType === 'percentage' ? '20' : '500'}
                                            className={`tlb-input ${errors.discountValue ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.discountValue && <p className="text-xs text-red-500 mt-1.5">{errors.discountValue}</p>}
                                    </div>
                                    {form.discountType === 'percentage' && (
                                        <div>
                                            <label className={labelCls}>Max Discount ₹</label>
                                            <input
                                                type="number" min="0" value={form.maxDiscount}
                                                onChange={(e) => set('maxDiscount', e.target.value)}
                                                placeholder="Cap (optional)"
                                                className={`tlb-input ${errors.maxDiscount ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                            />
                                            {errors.maxDiscount && <p className="text-xs text-red-500 mt-1.5">{errors.maxDiscount}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="tlb-card space-y-5">
                                <h3 className="tlb-label">Rules & Limits</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Min Order Value ₹</label>
                                        <input
                                            type="number" min="0" value={form.minOrderValue}
                                            onChange={(e) => set('minOrderValue', e.target.value)}
                                            placeholder="No minimum"
                                            className={`tlb-input ${errors.minOrderValue ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.minOrderValue && <p className="text-xs text-red-500 mt-1.5">{errors.minOrderValue}</p>}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Usage Limit</label>
                                        <input
                                            type="number" min="1" value={form.usageLimit}
                                            onChange={(e) => set('usageLimit', e.target.value)}
                                            placeholder="Unlimited"
                                            className={`tlb-input ${errors.usageLimit ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.usageLimit && <p className="text-xs text-red-500 mt-1.5">{errors.usageLimit}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Starts On</label>
                                        <input type="date" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} className="tlb-input" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Expires On</label>
                                        <input
                                            type="date" value={form.expiresAt}
                                            onChange={(e) => set('expiresAt', e.target.value)}
                                            className={`tlb-input ${errors.expiresAt ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.expiresAt && <p className="text-xs text-red-500 mt-1.5">{errors.expiresAt}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Apply To</label>
                                    <Select
                                        value={form.appliesTo}
                                        onChange={(v) => {
                                            set('appliesTo', v as CouponAppliesTo);
                                            set('targetId', ''); // reset target when scope changes
                                        }}
                                        options={APPLIES_TO_OPTIONS}
                                        ariaLabel="Apply coupon to"
                                    />
                                </div>

                                {form.appliesTo === 'category' && (
                                    <div>
                                        <label className={labelCls}>Category *</label>
                                        <Select
                                            value={form.targetId}
                                            onChange={(v) => set('targetId', v)}
                                            options={CATEGORY_OPTIONS}
                                            placeholder="Select a category"
                                            ariaLabel="Coupon category"
                                            triggerExtra={errors.targetId ? 'border-red-300 ring-1 ring-red-200' : ''}
                                        />
                                        {errors.targetId && <p className="text-xs text-red-500 mt-1.5">{errors.targetId}</p>}
                                    </div>
                                )}

                                {form.appliesTo === 'specific_listing' && (
                                    <div>
                                        <label className={labelCls}>Listing ID *</label>
                                        <input
                                            type="text" value={form.targetId}
                                            onChange={(e) => set('targetId', e.target.value)}
                                            placeholder="Listing ID"
                                            className={`tlb-input ${errors.targetId ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.targetId && <p className="text-xs text-red-500 mt-1.5">{errors.targetId}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview + submit */}
                        <div className="space-y-6">
                            <div className="tlb-card space-y-4">
                                <h3 className="tlb-label">Preview</h3>
                                <div className="relative bg-gradient-to-br from-tlb-dark to-gray-900 rounded-2xl p-5 text-white overflow-hidden">
                                    <Sparkles size={64} className="absolute -right-3 -top-3 text-tlb-yellow/20" />
                                    <div className="flex items-center gap-2 mb-3 relative z-10">
                                        <div className="w-11 h-11 bg-tlb-yellow/15 border border-tlb-yellow/30 rounded-xl flex items-center justify-center">
                                            <span className="text-sm font-black text-tlb-yellow">{previewDiscount}</span>
                                        </div>
                                        <div>
                                            <p className="font-mono font-bold tracking-wider">{previewCode}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                                                {form.discountType === 'percentage' ? 'Percentage off' : 'Flat discount'}
                                            </p>
                                        </div>
                                    </div>
                                    {form.description && <p className="text-xs text-gray-300 mb-2 relative z-10">{form.description}</p>}
                                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider relative z-10">
                                        <span className="flex items-center gap-1"><CalendarClock size={12} /> {form.expiresAt || 'No expiry'}</span>
                                        <span className="flex items-center gap-1"><Users size={12} /> {form.usageLimit ? `${form.usageLimit} uses` : 'Unlimited'}</span>
                                        <span className="flex items-center gap-1">
                                            <Tag size={12} /> {form.appliesTo === 'all_listings' ? 'All listings' : form.appliesTo === 'specific_listing' ? 'Listing' : 'Category'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={submitting}
                                    className="tlb-button w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-tlb-dark/30 border-t-tlb-dark rounded-full animate-spin" />
                                            Creating…
                                        </>
                                    ) : (
                                        <><Ticket size={18} /> Generate Coupon</>
                                    )}
                                </button>
                                <button
                                    type="button" onClick={() => onNavigate('ALL_COUPONS')}
                                    className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateCoupon;
