import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { PartnerListing } from '../../../api/portalSummary';
import { CouponGender } from '../../../api/coupons';
import { PortalModal } from '../../../components/portal';
import { impactPreview } from '../model';
import { CouponFormValues, CouponRow, emptyCouponForm } from '../types';
import { GENDER_OPTIONS, LISTING_TYPE_OPTIONS } from '../presentation';

interface CouponFormModalProps {
    open: boolean;
    editing: CouponRow | null;
    initialValues: CouponFormValues | null;
    listings: PartnerListing[];
    onClose: () => void;
    onSave: (values: CouponFormValues) => Promise<boolean>;
    onTogglePause: (row: CouponRow) => void;
}

const OptionCard: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button type="button" onClick={onClick} className={`opt ${active ? 'is-on' : ''} flex items-center gap-2.5 rounded-[11px] border-[1.5px] px-3.5 py-2.5 text-[12.5px] font-semibold text-left transition-colors ${active ? 'border-tlb-amber bg-tlb-cream' : 'border-tlb-line bg-white hover:border-tlb-edge'}`}>
        <span className={`w-[15px] h-[15px] rounded-full border-[1.5px] flex-none flex items-center justify-center ${active ? 'border-tlb-amber' : 'border-tlb-edge'}`}>
            {active && <span className="w-[7px] h-[7px] rounded-full bg-tlb-amber" />}
        </span>
        {children}
    </button>
);

const CheckOption: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button type="button" onClick={onClick} className={`flex items-center gap-2.5 rounded-[11px] border-[1.5px] px-3.5 py-2.5 text-[12.5px] font-semibold text-left transition-colors ${active ? 'border-tlb-amber bg-tlb-cream' : 'border-tlb-line bg-white hover:border-tlb-edge'}`}>
        <span className={`w-[15px] h-[15px] rounded-[4px] border-[1.5px] flex-none ${active ? 'border-tlb-amber bg-tlb-amber' : 'border-tlb-edge'}`} />
        {children}
    </button>
);

export const CouponFormModal: React.FC<CouponFormModalProps> = ({ open, editing, initialValues, listings, onClose, onSave, onTogglePause }) => {
    const [form, setForm] = useState<CouponFormValues>(emptyCouponForm());
    const [listingSearch, setListingSearch] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) setForm(initialValues || emptyCouponForm());
    }, [open, initialValues]);

    const set = <K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) => setForm(f => ({ ...f, [key]: value }));

    const toggleListingType = (key: string) =>
        setForm(f => ({ ...f, listingTypes: f.listingTypes.includes(key) ? f.listingTypes.filter(k => k !== key) : [...f.listingTypes, key] }));

    const toggleListingId = (id: string) =>
        setForm(f => ({ ...f, listingIds: f.listingIds.includes(id) ? f.listingIds.filter(k => k !== id) : [...f.listingIds, id] }));

    const toggleGender = (g: CouponGender) =>
        setForm(f => ({ ...f, genders: f.genders.includes(g) ? f.genders.filter(k => k !== g) : [...f.genders, g] }));

    const filteredListings = listings.filter(l => !listingSearch.trim() || l.title.toLowerCase().includes(listingSearch.trim().toLowerCase()));

    const canPublish = form.code.trim().length > 0 && Number(form.discountValue) > 0;

    const handleSave = async () => {
        setSaving(true);
        const ok = await onSave(form);
        setSaving(false);
        if (ok) onClose();
    };

    return (
        <PortalModal
            open={open}
            onClose={onClose}
            title={editing ? 'Edit coupon' : 'Create a coupon'}
            subtitle={editing
                ? 'Changes apply to new redemptions straight away — bookings already made keep the discount they got.'
                : 'You set the discount, where it applies and who can use it. It goes live as soon as you publish.'}
            widthClass="max-w-[700px]"
        >
            <div className="flex flex-col gap-[22px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="pt-field">
                        <label className="pt-field-k">Coupon code</label>
                        <input
                            className="pt-input font-mono font-bold tracking-wide uppercase"
                            placeholder="e.g. MONSOON20"
                            value={form.code}
                            disabled={!!editing}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('code', e.target.value.toUpperCase())}
                        />
                    </div>
                    <div className="pt-field">
                        <label className="pt-field-k">Internal note (optional)</label>
                        <input
                            className="pt-input"
                            placeholder="e.g. Monsoon weekday push"
                            value={form.description}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('description', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <p className="pt-eyebrow mb-2.5">Discount — your call, no cap from TLB</p>
                    <div className="grid grid-cols-2 gap-2">
                        <OptionCard active={form.discountType === 'percent'} onClick={() => set('discountType', 'percent')}>Percentage off</OptionCard>
                        <OptionCard active={form.discountType === 'fixed'} onClick={() => set('discountType', 'fixed')}>Flat amount off</OptionCard>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
                        <div className="pt-field">
                            <label className="pt-field-k">{form.discountType === 'percent' ? 'Percentage off' : 'Amount off (Rs)'}</label>
                            <input type="number" min={0} className="pt-input" value={form.discountValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('discountValue', e.target.value)} />
                        </div>
                        {form.discountType === 'percent' && (
                            <div className="pt-field">
                                <label className="pt-field-k">Max discount per booking</label>
                                <input type="number" min={0} placeholder="No ceiling" className="pt-input" value={form.maxDiscount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('maxDiscount', e.target.value)} />
                            </div>
                        )}
                        <div className="pt-field">
                            <label className="pt-field-k">Minimum booking value</label>
                            <input type="number" min={0} placeholder="No minimum" className="pt-input" value={form.minOrderValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('minOrderValue', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div>
                    <p className="pt-eyebrow mb-2.5">Applies to</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <OptionCard active={form.scope === 'all'} onClick={() => set('scope', 'all')}>All active listings</OptionCard>
                        <OptionCard active={form.scope === 'listings'} onClick={() => set('scope', 'listings')}>Pick listings</OptionCard>
                        <OptionCard active={form.scope === 'categories'} onClick={() => set('scope', 'categories')}>A whole category</OptionCard>
                    </div>

                    {form.scope === 'categories' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                            {LISTING_TYPE_OPTIONS.map(opt => (
                                <CheckOption key={opt.key} active={form.listingTypes.includes(opt.key)} onClick={() => toggleListingType(opt.key)}>{opt.label}</CheckOption>
                            ))}
                        </div>
                    )}

                    {form.scope === 'listings' && (
                        <div className="mt-3 border border-tlb-line rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-tlb-chrome border-b border-tlb-line">
                                <input
                                    className="bg-transparent text-[12.5px] outline-none flex-1"
                                    placeholder="Search listings"
                                    value={listingSearch}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setListingSearch(e.target.value)}
                                />
                                <span className="text-[11.5px] text-tlb-muted flex-none">{form.listingIds.length} selected</span>
                            </div>
                            <div className="max-h-[220px] overflow-y-auto">
                                {filteredListings.map(l => {
                                    const on = form.listingIds.includes(l.id);
                                    return (
                                        <button
                                            key={l.id}
                                            type="button"
                                            onClick={() => toggleListingId(l.id)}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-b border-tlb-divider last:border-b-0 text-[12.5px] hover:bg-tlb-wash text-left"
                                        >
                                            <span className={`w-[15px] h-[15px] rounded-[4px] border-[1.5px] flex-none ${on ? 'border-tlb-amber bg-tlb-amber' : 'border-tlb-edge'}`} />
                                            <span className="flex-1 font-semibold text-tlb-ink truncate">{l.title}</span>
                                            <span className="text-[11px] text-tlb-muted flex-none">{l.entityType}</span>
                                        </button>
                                    );
                                })}
                                {filteredListings.length === 0 && <p className="px-3.5 py-3 text-[12px] text-tlb-muted">No listings match.</p>}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <p className="pt-eyebrow mb-2.5">Who can use it</p>
                    <p className="text-[11.5px] text-tlb-muted mb-2.5">
                        The API can restrict by gender and age, not by customer history — leave both blank for anyone with the code.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className="pt-field-k block mb-1.5">Gender (optional)</label>
                            <div className="flex flex-wrap gap-2">
                                {GENDER_OPTIONS.map(opt => (
                                    <CheckOption key={opt.key} active={form.genders.includes(opt.key)} onClick={() => toggleGender(opt.key)}>{opt.label}</CheckOption>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="pt-field">
                                <label className="pt-field-k">Min age</label>
                                <input type="number" min={0} placeholder="Any" className="pt-input" value={form.minAge} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('minAge', e.target.value)} />
                            </div>
                            <div className="pt-field">
                                <label className="pt-field-k">Max age</label>
                                <input type="number" min={0} placeholder="Any" className="pt-input" value={form.maxAge} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('maxAge', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="pt-eyebrow mb-2.5">Limits — set what you want, leave the rest open</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        <div className="pt-field">
                            <label className="pt-field-k">Total uses</label>
                            <input type="number" min={0} placeholder="Unlimited" className="pt-input" value={form.usageLimit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('usageLimit', e.target.value)} />
                        </div>
                        <div className="pt-field">
                            <label className="pt-field-k">Uses per customer</label>
                            <input type="number" min={1} className="pt-input" value={form.perUserLimit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('perUserLimit', e.target.value)} />
                        </div>
                        <div className="pt-field">
                            <label className="pt-field-k">Valid from</label>
                            <input type="date" className="pt-input" value={form.startsAt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('startsAt', e.target.value)} />
                        </div>
                        <div className="pt-field">
                            <label className="pt-field-k">Valid till</label>
                            <input type="date" placeholder="No end date" className="pt-input" value={form.expiresAt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('expiresAt', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="pt-note">{impactPreview(form)}</div>

                <div className="flex items-center gap-2.5 pt-1">
                    <button type="button" onClick={handleSave} disabled={!canPublish || saving} className="pt-btn pt-btn-y">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        {editing ? 'Save changes' : 'Publish coupon'}
                    </button>
                    {editing && editing.status !== 'ended' && (
                        <button type="button" onClick={() => { onTogglePause(editing); onClose(); }} className="pt-btn pt-btn-o">
                            {editing.status === 'paused' ? 'Resume coupon' : 'Pause coupon'}
                        </button>
                    )}
                    <div className="flex-1" />
                    <button type="button" onClick={onClose} className="pt-btn pt-btn-o text-tlb-sub">Cancel</button>
                </div>
            </div>
        </PortalModal>
    );
};
