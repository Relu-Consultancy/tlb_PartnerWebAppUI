import React, { useEffect, useState } from 'react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { loadPartnerListings, PartnerListing } from '../../api/portalSummary';
import { SearchField, SegBar } from '../../components/portal';
import { Skeleton } from '../../components/ui';
import { formatCount } from '../../utils/format';
import { useCouponsData } from './useCouponsData';
import { couponStats, couponToForm, filterCoupons, formToInput } from './model';
import { CouponFormValues, CouponRow } from './types';
import { COUPON_STATUS_META, COUPON_STATUS_ORDER } from './presentation';
import { StatsStrip } from './components/StatsStrip';
import { CouponsTable } from './components/CouponsTable';
import { CouponFormModal } from './components/CouponFormModal';

interface Props {
    onNavigate: (screen: Screen) => void;
}

const SkeletonBody: React.FC = () => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4" aria-busy="true" aria-label="Loading coupons">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-72 rounded-[14px]" />
    </div>
);

type StatusFilter = 'all' | typeof COUPON_STATUS_ORDER[number];

export const Coupons: React.FC<Props> = ({ onNavigate }) => {
    const { allowedEntities } = usePartner();
    const [status, setStatus] = useState<StatusFilter>('all');
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<CouponRow | null>(null);
    const [listings, setListings] = useState<PartnerListing[]>([]);

    const coupons = useCouponsData();

    useEffect(() => {
        loadPartnerListings(allowedEntities).then(setListings).catch(() => setListings([]));
    }, [allowedEntities.join(',')]);

    if (coupons.loading) return <SkeletonBody />;

    if (coupons.error) {
        return (
            <div className="px-4 sm:px-[26px] pt-5 pb-9">
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{coupons.error}</div>
            </div>
        );
    }

    const stats = couponStats(coupons.rows, coupons.discountGiven);
    const filtered = filterCoupons(coupons.rows, { status, search });
    const listingTitleOf = (id: string) => listings.find(l => l.id === id)?.title;

    const scopeOptions = [
        { key: 'all' as StatusFilter, label: 'All coupons', count: coupons.rows.length },
        ...COUPON_STATUS_ORDER.map(s => ({ key: s as StatusFilter, label: COUPON_STATUS_META[s].label, count: coupons.rows.filter(r => r.status === s).length })),
    ];

    const openCreate = () => { setEditing(null); setFormOpen(true); };
    const openEdit = (row: CouponRow) => { setEditing(row); setFormOpen(true); };

    const handleSave = async (values: CouponFormValues) => coupons.save(formToInput(values), editing?.id ?? null);

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                        <button type="button" onClick={() => onNavigate('HOME')} className="text-tlb-link hover:text-tlb-gold transition-colors">Dashboard</button>
                        {' · '}Coupons
                    </nav>
                    <h1 className="pt-h1 text-[24px]">Coupons</h1>
                    <p className="text-[13.5px] text-tlb-sub mt-[3px] max-w-2xl">
                        Discount codes on your listings — any amount, any listing, anyone you choose. Live the moment you publish.
                    </p>
                </div>
                <button type="button" onClick={openCreate} className="pt-btn pt-btn-d flex-none">+ Create coupon</button>
            </div>

            <StatsStrip stats={stats} />

            <div className="pt-note">
                Coupons go live the moment you publish them — no TLB approval needed. The discount comes out of your share; TLB commission is still calculated on the full listing price.
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
                <SegBar options={scopeOptions} value={status} onChange={setStatus} />
                <div className="flex-1" />
                <SearchField value={search} onChange={setSearch} placeholder="Search coupons" />
            </div>

            <div className="flex items-center justify-end px-1">
                <span className="text-xs text-tlb-muted">Showing {formatCount(filtered.length)} of {formatCount(coupons.rows.length)} coupons</span>
            </div>

            {filtered.length > 0 ? (
                <CouponsTable rows={filtered} listingTitleOf={listingTitleOf} onOpen={openEdit} onTogglePause={coupons.togglePause} />
            ) : (
                <div className="pt-card flex flex-col items-center justify-center text-center py-16 px-6">
                    <p className="text-sm font-bold text-tlb-sub">{coupons.rows.length === 0 ? 'No coupons yet' : 'No coupons match these filters'}</p>
                    {coupons.rows.length === 0 && (
                        <button type="button" onClick={openCreate} className="pt-btn pt-btn-y mt-4">+ Create your first coupon</button>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between px-1">
                <span className="text-xs text-tlb-muted">Showing {formatCount(filtered.length)} of {formatCount(coupons.rows.length)} coupons</span>
                <button type="button" onClick={() => onNavigate('ANALYTICS')} className="pt-link">See what coupons earned →</button>
            </div>

            <CouponFormModal
                open={formOpen}
                editing={editing}
                initialValues={editing ? couponToForm(editing) : null}
                listings={listings}
                onClose={() => setFormOpen(false)}
                onSave={handleSave}
                onTogglePause={coupons.togglePause}
            />
        </div>
    );
};
