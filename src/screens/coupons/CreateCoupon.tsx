import React, { useEffect, useMemo, useState } from 'react';
import {
    Ticket, Percent, IndianRupee, Tag, CalendarClock, Users,
    CheckCircle2, AlertCircle, Sparkles, ArrowLeft, Layers, CalendarDays, GraduationCap, MapPin,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import {
    createCoupon, CouponDiscountType, CouponGender, CouponListingType, CreateCouponInput,
} from '../../api/coupons';
import { getEventListings, getClassListings, getProgramListings, getVenueListings } from '../../api/listings';
import { Select, SelectOption } from '../../components/ui';

type AppliesTo = 'all_listings' | 'specific_listing' | 'category';

const APPLIES_TO_OPTIONS: SelectOption[] = [
    { value: 'all_listings', label: 'All Listings', icon: Layers, description: 'Coupon works on everything you offer' },
    { value: 'specific_listing', label: 'Specific Listing', icon: Tag, description: 'Limit to a single listing' },
    { value: 'category', label: 'Category', icon: GraduationCap, description: 'Limit to one offering type' },
];

// Main offering categories → API listing_type
const CATEGORY_OPTIONS: SelectOption[] = [
    { value: 'Events', label: 'Events', icon: CalendarDays },
    { value: 'Classes', label: 'Classes', icon: GraduationCap },
    { value: 'Programs', label: 'Programs', icon: Layers },
    { value: 'Venues', label: 'Venues', icon: MapPin },
];

const LISTING_TYPE_BY_CATEGORY: Record<string, CouponListingType> = {
    Events: 'event', Classes: 'class', Programs: 'program', Venues: 'venue',
};

const LISTING_ICON: Record<EntityType, React.ElementType> = {
    Events: CalendarDays, Classes: GraduationCap, Programs: Layers, Venues: MapPin,
};
const LISTING_TYPE_LABEL: Record<EntityType, string> = {
    Events: 'Event', Classes: 'Class', Programs: 'Program', Venues: 'Venue',
};
const LISTING_FETCHERS: Record<EntityType, () => Promise<any>> = {
    Events: getEventListings, Classes: getClassListings, Programs: getProgramListings, Venues: getVenueListings,
};

const GENDERS: { value: CouponGender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
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
    perUserLimit: string;
    appliesTo: AppliesTo;
    targetId: string;
    startsAt: string;
    expiresAt: string;
    genders: CouponGender[];
    minAge: string;
    maxAge: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
    code: '', description: '', discountType: 'percent', discountValue: '',
    maxDiscount: '', minOrderValue: '', usageLimit: '', perUserLimit: '1',
    appliesTo: 'all_listings', targetId: '', startsAt: '', expiresAt: '',
    genders: [], minAge: '', maxAge: '',
};

const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2';

export const CreateCoupon: React.FC<Props> = ({ onNavigate }) => {
    const { allowedEntities } = usePartner();
    const [form, setForm] = useState<FormState>(INITIAL);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [listingOptions, setListingOptions] = useState<SelectOption[]>([]);
    const [listingsLoading, setListingsLoading] = useState(true);

    // Load the partner's listings to populate the "Specific Listing" dropdown
    useEffect(() => {
        const fetchListings = async () => {
            setListingsLoading(true);
            const wanted: EntityType[] = allowedEntities.length > 0
                ? allowedEntities
                : ['Events', 'Classes', 'Programs', 'Venues'];
            const results = await Promise.allSettled(
                wanted.map(ent => LISTING_FETCHERS[ent]().then((res: any) => {
                    const data = res?.data || res;
                    return Array.isArray(data)
                        ? data.map((item: any) => ({
                            value: String(item.id || ''),
                            label: item.title || 'Untitled',
                            icon: LISTING_ICON[ent],
                            description: LISTING_TYPE_LABEL[ent],
                        } as SelectOption))
                        : [];
                }).catch(() => [] as SelectOption[])),
            );
            const opts: SelectOption[] = [];
            results.forEach(r => { if (r.status === 'fulfilled') opts.push(...r.value); });
            setListingOptions(opts.filter(o => o.value));
            setListingsLoading(false);
        };
        fetchListings();
    }, [allowedEntities]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
        if (banner) setBanner(null);
    };

    const toggleGender = (g: CouponGender) => {
        setForm(prev => ({
            ...prev,
            genders: prev.genders.includes(g) ? prev.genders.filter(x => x !== g) : [...prev.genders, g],
        }));
        if (banner) setBanner(null);
    };

    const isPercent = form.discountType === 'percent';

    const validate = (): boolean => {
        const e: FieldErrors = {};
        const code = form.code.trim();
        if (!code) e.code = 'Coupon code is required.';
        else if (!/^[A-Z0-9_-]{3,20}$/.test(code)) e.code = 'Use 3–20 chars: A–Z, 0–9, - or _.';

        const val = Number(form.discountValue);
        if (!form.discountValue.trim()) e.discountValue = 'Discount value is required.';
        else if (Number.isNaN(val) || val <= 0) e.discountValue = 'Enter a value greater than 0.';
        else if (isPercent && val > 100) e.discountValue = 'Percentage cannot exceed 100.';

        if (form.maxDiscount && Number(form.maxDiscount) <= 0) e.maxDiscount = 'Must be greater than 0.';
        if (form.minOrderValue && Number(form.minOrderValue) < 0) e.minOrderValue = 'Cannot be negative.';
        if (form.usageLimit && (!Number.isInteger(Number(form.usageLimit)) || Number(form.usageLimit) < 1))
            e.usageLimit = 'Enter a whole number ≥ 1.';
        if (form.perUserLimit && (!Number.isInteger(Number(form.perUserLimit)) || Number(form.perUserLimit) < 1))
            e.perUserLimit = 'Enter a whole number ≥ 1.';
        if (form.startsAt && form.expiresAt && form.startsAt > form.expiresAt)
            e.expiresAt = 'Expiry must be after the start date.';
        if (form.appliesTo !== 'all_listings' && !form.targetId.trim())
            e.targetId = form.appliesTo === 'specific_listing' ? 'Listing ID is required.' : 'Category is required.';
        if (form.minAge && (!Number.isInteger(Number(form.minAge)) || Number(form.minAge) < 0))
            e.minAge = 'Enter a valid age.';
        if (form.maxAge && (!Number.isInteger(Number(form.maxAge)) || Number(form.maxAge) < 0))
            e.maxAge = 'Enter a valid age.';
        if (form.minAge && form.maxAge && Number(form.minAge) > Number(form.maxAge))
            e.maxAge = 'Max age must be ≥ min age.';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const buildPayload = (): CreateCouponInput => {
        const payload: CreateCouponInput = {
            code: form.code.trim().toUpperCase(),
            discount_type: form.discountType,
            discount_value: Number(form.discountValue),
            description: form.description.trim() || undefined,
            max_discount: isPercent && form.maxDiscount ? Number(form.maxDiscount) : null,
            min_order_value: form.minOrderValue ? Number(form.minOrderValue) : null,
            usage_limit: form.usageLimit ? Number(form.usageLimit) : null,
            per_user_limit: form.perUserLimit ? Number(form.perUserLimit) : 1,
            starts_at: form.startsAt || null,
            expires_at: form.expiresAt || null,
        };
        if (form.appliesTo === 'specific_listing' && form.targetId.trim()) {
            payload.target_listing_ids = [form.targetId.trim()];
        } else if (form.appliesTo === 'category') {
            const lt = LISTING_TYPE_BY_CATEGORY[form.targetId];
            if (lt) payload.target_listing_types = [lt];
        }
        if (form.genders.length) payload.target_genders = form.genders;
        if (form.minAge) payload.target_min_age = Number(form.minAge);
        if (form.maxAge) payload.target_max_age = Number(form.maxAge);
        return payload;
    };

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
            const notApproved = /not approved|approv|permission|forbidden|HTTP 403/i.test(raw);
            setBanner({
                type: 'error',
                text: notApproved
                    ? 'Your partner account must be approved before you can create coupons.'
                    : raw || 'Something went wrong while creating the coupon.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const previewCode = form.code.trim().toUpperCase() || 'YOURCODE';
    const previewDiscount = useMemo(() => {
        const v = Number(form.discountValue);
        if (!form.discountValue || Number.isNaN(v)) return isPercent ? '0%' : '₹0';
        return isPercent ? `${v}%` : `₹${v}`;
    }, [form.discountValue, isPercent]);

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
                                                { v: 'percent' as const, label: 'Percent', icon: Percent },
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
                                        <label className={labelCls}>{isPercent ? 'Discount % *' : 'Discount ₹ *'}</label>
                                        <input
                                            type="number" min="0" value={form.discountValue}
                                            onChange={(e) => set('discountValue', e.target.value)}
                                            placeholder={isPercent ? '20' : '500'}
                                            className={`tlb-input ${errors.discountValue ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.discountValue && <p className="text-xs text-red-500 mt-1.5">{errors.discountValue}</p>}
                                    </div>
                                    {isPercent && (
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

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                    <div>
                                        <label className={labelCls}>Per-User Limit</label>
                                        <input
                                            type="number" min="1" value={form.perUserLimit}
                                            onChange={(e) => set('perUserLimit', e.target.value)}
                                            placeholder="1"
                                            className={`tlb-input ${errors.perUserLimit ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.perUserLimit && <p className="text-xs text-red-500 mt-1.5">{errors.perUserLimit}</p>}
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
                                            set('appliesTo', v as AppliesTo);
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
                                        <label className={labelCls}>Listing *</label>
                                        {listingsLoading ? (
                                            <div className="tlb-input flex items-center gap-2 text-gray-400">
                                                <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                                                Loading your listings…
                                            </div>
                                        ) : listingOptions.length > 0 ? (
                                            <Select
                                                value={form.targetId}
                                                onChange={(v) => set('targetId', v)}
                                                options={listingOptions}
                                                placeholder="Select a listing"
                                                ariaLabel="Coupon listing"
                                                triggerExtra={errors.targetId ? 'border-red-300 ring-1 ring-red-200' : ''}
                                            />
                                        ) : (
                                            <input
                                                type="text" value={form.targetId}
                                                onChange={(e) => set('targetId', e.target.value)}
                                                placeholder="Listing ID"
                                                className={`tlb-input ${errors.targetId ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                            />
                                        )}
                                        {!listingsLoading && listingOptions.length === 0 && (
                                            <p className="text-[11px] text-gray-400 mt-1.5">No listings found — enter a listing ID manually.</p>
                                        )}
                                        {errors.targetId && <p className="text-xs text-red-500 mt-1.5">{errors.targetId}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Audience targeting (optional) */}
                            <div className="tlb-card space-y-5">
                                <div className="flex items-center gap-2">
                                    <Users size={15} className="text-gray-400" />
                                    <h3 className="tlb-label !mb-0">Audience <span className="font-medium normal-case tracking-normal text-gray-400">(optional)</span></h3>
                                </div>

                                <div>
                                    <label className={labelCls}>Gender</label>
                                    <div className="flex flex-wrap gap-2">
                                        {GENDERS.map(({ value, label }) => {
                                            const active = form.genders.includes(value);
                                            return (
                                                <button
                                                    key={value} type="button" onClick={() => toggleGender(value)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                                        active ? 'bg-tlb-yellow border-tlb-yellow text-tlb-dark'
                                                               : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1.5">Leave empty to allow all genders.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Min Age</label>
                                        <input
                                            type="number" min="0" value={form.minAge}
                                            onChange={(e) => set('minAge', e.target.value)}
                                            placeholder="Any"
                                            className={`tlb-input ${errors.minAge ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.minAge && <p className="text-xs text-red-500 mt-1.5">{errors.minAge}</p>}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Max Age</label>
                                        <input
                                            type="number" min="0" value={form.maxAge}
                                            onChange={(e) => set('maxAge', e.target.value)}
                                            placeholder="Any"
                                            className={`tlb-input ${errors.maxAge ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                        />
                                        {errors.maxAge && <p className="text-xs text-red-500 mt-1.5">{errors.maxAge}</p>}
                                    </div>
                                </div>
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
                                                {isPercent ? 'Percentage off' : 'Flat discount'}
                                            </p>
                                        </div>
                                    </div>
                                    {form.description && <p className="text-xs text-gray-300 mb-2 relative z-10">{form.description}</p>}
                                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider relative z-10">
                                        <span className="flex items-center gap-1"><CalendarClock size={12} /> {form.expiresAt || 'No expiry'}</span>
                                        <span className="flex items-center gap-1"><Users size={12} /> {form.usageLimit ? `${form.usageLimit} uses` : 'Unlimited'}</span>
                                        <span className="flex items-center gap-1">
                                            <Tag size={12} /> {form.appliesTo === 'all_listings' ? 'All listings' : form.appliesTo === 'specific_listing' ? 'Listing' : (form.targetId || 'Category')}
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
