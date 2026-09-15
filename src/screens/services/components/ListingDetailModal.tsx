import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, Star } from 'lucide-react';
import { Screen } from '../../../types';
import { getListingReviews, PartnerReview } from '../../../api/reviews';
import { LISTING_STATUS_META, Pill, PortalModal } from '../../../components/portal';
import { formatRupees } from '../../../utils/format';
import { BookingEntry, EnquiryEntry } from '../../bookings-enquiries/types';
import { ENQUIRY_STATUS_META } from '../../bookings-enquiries/presentation';
import { ListingDemand, ListingRow } from '../types';
import { SERVICE_LABEL, SERVICE_TONE, MODEL_LABEL } from '../presentation';

interface ListingDetailModalProps {
    row: ListingRow | null;
    enquiries: EnquiryEntry[];
    bookings: BookingEntry[];
    demand: ListingDemand | null;
    onClose: () => void;
    onNavigate: (screen: Screen) => void;
    onEdit: (row: ListingRow) => void;
    onTogglePause: (row: ListingRow) => void;
    onToggleArchive: (row: ListingRow) => void;
}

const fmtDate = (iso: string | null): string => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
    row, enquiries, bookings, demand, onClose, onNavigate, onEdit, onTogglePause, onToggleArchive,
}) => {
    const [reviews, setReviews] = useState<PartnerReview[] | null>(null);

    useEffect(() => {
        if (!row) { setReviews(null); return; }
        let cancelled = false;
        getListingReviews(row.id).then(r => { if (!cancelled) setReviews(r); }).catch(() => { if (!cancelled) setReviews([]); });
        return () => { cancelled = true; };
    }, [row?.id]);

    if (!row) return <PortalModal open={false} onClose={onClose} title=""><div /></PortalModal>;

    const buyers = bookings.filter(b => b.listingId === row.id).slice(0, 8);
    const leads = enquiries.filter(e => e.listingId === row.id).slice(0, 8);
    const canPause = row.state === 'live' || row.state === 'paused';
    const canArchive = row.state === 'live' || row.state === 'paused' || row.state === 'archived';
    const editable = row.state !== 'archived';

    return (
        <PortalModal open onClose={onClose} title={row.title} widthClass="max-w-[640px]">
            <div className="flex flex-wrap items-center gap-2 -mt-1 mb-1">
                <Pill tone={SERVICE_TONE[row.entityType]}>{SERVICE_LABEL[row.entityType]}</Pill>
                <Pill tone={LISTING_STATUS_META[row.state].tone}>{LISTING_STATUS_META[row.state].label}</Pill>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4 text-[12.5px] text-tlb-sub">
                <span className="pt-code">{row.code}</span>
                <span>{row.location}</span>
            </div>

            {row.state === 'rejected' && row.reviewMessage && (
                <div className="pt-note mb-4 bg-tlb-red-soft text-tlb-red-deep">
                    <AlertCircle size={14} strokeWidth={2.75} className="flex-none mt-0.5" aria-hidden="true" />
                    <span><strong className="font-bold">Rejected — </strong>{row.reviewMessage}</span>
                </div>
            )}

            {row.galleryUrls.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                    {row.galleryUrls.slice(0, 5).map((url, i) => (
                        <img key={i} src={url} alt="" className="w-28 h-20 flex-none rounded-[10px] object-cover border border-tlb-line" />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pb-4 border-b border-tlb-divider">
                <div><p className="pt-eyebrow mb-1">Model</p><p className="text-[13px] font-semibold text-tlb-ink">{MODEL_LABEL[row.model]}</p></div>
                <div><p className="pt-eyebrow mb-1">Price</p><p className="text-[13px] font-semibold text-tlb-ink">{row.priceLabel}</p></div>
                <div><p className="pt-eyebrow mb-1">Capacity</p><p className="text-[13px] font-semibold text-tlb-ink">{row.capacityLabel}</p></div>
                <div><p className="pt-eyebrow mb-1">This period</p><p className="text-[13px] font-semibold text-tlb-ink">{demand ? demand.label : '—'}</p></div>
                <div><p className="pt-eyebrow mb-1">Listed on</p><p className="text-[13px] font-semibold text-tlb-ink">{fmtDate(row.createdAt)}</p></div>
            </div>

            {row.description && (
                <div className="mt-4">
                    <p className="pt-eyebrow mb-1.5">About this listing</p>
                    <p className="text-[12.5px] leading-relaxed text-tlb-body">{row.description}</p>
                </div>
            )}

            {row.model === 'ticketed' && buyers.length > 0 && (
                <div className="mt-5">
                    <p className="pt-eyebrow mb-2">Recent bookings</p>
                    <div className="rounded-xl border border-tlb-divider overflow-hidden">
                        {buyers.map(b => (
                            <div key={b.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-tlb-divider last:border-b-0 text-[12.5px]">
                                <span className="font-medium text-tlb-ink truncate">{b.customerName}</span>
                                <span className="pt-code flex-none">{b.bookingReference || `BKG-${b.id}`}</span>
                                <span className="font-bold text-tlb-ink flex-none">{formatRupees(b.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {row.model === 'enquiry' && leads.length > 0 && (
                <div className="mt-5">
                    <p className="pt-eyebrow mb-2">Recent enquiries</p>
                    <div className="rounded-xl border border-tlb-divider overflow-hidden">
                        {leads.map(e => (
                            <div key={e.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-tlb-divider last:border-b-0 text-[12.5px]">
                                <span className="font-medium text-tlb-ink truncate">{e.name}</span>
                                <Pill tone={ENQUIRY_STATUS_META[e.status].tone}>{ENQUIRY_STATUS_META[e.status].label}</Pill>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {reviews === null ? (
                <div className="flex items-center justify-center py-4 text-tlb-muted"><Loader2 size={16} className="animate-spin" /></div>
            ) : reviews.length > 0 && (
                <div className="mt-5">
                    <p className="pt-eyebrow mb-2">Customer reviews</p>
                    <div className="rounded-xl border border-tlb-divider overflow-hidden">
                        {reviews.slice(0, 3).map(r => (
                            <div key={r.id} className="px-3.5 py-2.5 border-b border-tlb-divider last:border-b-0">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[12px] font-bold text-tlb-ink">{r.reviewer_name}</span>
                                    <span className="flex items-center gap-0.5 text-tlb-amber text-[11px] font-bold">
                                        <Star size={11} fill="currentColor" strokeWidth={0} /> {r.rating}
                                    </span>
                                </div>
                                {r.comment && <p className="text-[11.5px] text-tlb-body mt-1 leading-relaxed">{r.comment}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-tlb-divider">
                <button type="button" onClick={() => onEdit(row)} disabled={!editable} className="pt-btn pt-btn-y">
                    {editable ? 'Edit listing' : 'Locked'}
                </button>
                <button type="button" onClick={() => onNavigate('BOOKINGS_ENQUIRIES')} className="pt-btn pt-btn-o">
                    Manage bookings/enquiries <ArrowRight size={13} />
                </button>
                {canPause && (
                    <button type="button" onClick={() => onTogglePause(row)} className="pt-btn pt-btn-o">
                        {row.state === 'paused' ? 'Resume' : 'Pause'}
                    </button>
                )}
                <div className="flex-1" />
                {canArchive && (
                    <button type="button" onClick={() => onToggleArchive(row)} className="pt-btn pt-btn-o text-tlb-sub">
                        {row.state === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                )}
            </div>
        </PortalModal>
    );
};
