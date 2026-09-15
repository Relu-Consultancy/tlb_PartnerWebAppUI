import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, Phone } from 'lucide-react';
import { getBookingDetail, getBookingPaymentDetail } from '../../../api/listings';
import { Pill, PortalModal } from '../../../components/portal';
import { formatRupees, toNumber } from '../../../utils/format';
import { BookingEntity, BookingEntry } from '../types';
import { BOOKING_ENTITY_LABEL, BOOKING_ENTITY_TONE, bookingStatusMeta } from '../presentation';
import { slotLabelOf } from '../model';

interface LineItem {
    id: number;
    quantity: number;
    ticket_name: string | null;
    package_name: string | null;
    batch_name: string | null;
    item_type: string;
}

interface Detail {
    customer_phone?: string;
    customer_email?: string;
    line_items?: LineItem[];
    refund_amount?: number | null;
}

interface BookingDetailModalProps {
    entry: BookingEntry | null;
    now: Date;
    onClose: () => void;
    onMarkAttended: (id: string) => Promise<boolean>;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ entry, now, onClose, onMarkAttended }) => {
    const [detail, setDetail] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        if (!entry) { setDetail(null); return; }
        let cancelled = false;
        setLoading(true);
        Promise.allSettled([getBookingDetail(entry.id), getBookingPaymentDetail(entry.id)]).then(([d, p]) => {
            if (cancelled) return;
            const base = d.status === 'fulfilled' ? (d.value?.data ?? d.value) : {};
            const payment = p.status === 'fulfilled' ? (p.value?.data ?? p.value) : {};
            setDetail({ ...base, ...payment });
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [entry?.id]);

    if (!entry) return <PortalModal open={false} onClose={onClose} title=""><div /></PortalModal>;

    const meta = bookingStatusMeta(entry);
    const isCancelled = entry.status === 'cancelled';
    const refundNote = entry.paymentStatus === 'refunded'
        ? `This booking was cancelled and ${formatRupees(toNumber(detail?.refund_amount) || entry.amount)} has been refunded to the customer.`
        : 'This booking was cancelled. No refund has been processed yet.';

    const handleMarkAttended = async () => {
        setMarking(true);
        await onMarkAttended(entry.id);
        setMarking(false);
    };

    return (
        <PortalModal open={!!entry} onClose={onClose} title={entry.customerName} widthClass="max-w-[560px]">
            <div className="flex flex-wrap items-center gap-2 -mt-1 mb-1">
                <Pill tone={BOOKING_ENTITY_TONE[entry.entity as BookingEntity]}>{BOOKING_ENTITY_LABEL[entry.entity as BookingEntity]}</Pill>
                <Pill tone={meta.tone}>{meta.label}</Pill>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4 text-[12.5px] text-tlb-sub">
                <span className="pt-eyebrow">Booking</span>
                <span className="pt-code">{entry.bookingReference || `BKG-${entry.id}`}</span>
                <span>{entry.listingTitle}</span>
            </div>

            {isCancelled && (
                <div className="pt-note mb-4 bg-tlb-red-soft text-tlb-red-deep">
                    <AlertCircle size={14} strokeWidth={2.75} className="flex-none" aria-hidden="true" />
                    {refundNote}
                </div>
            )}

            <div className="grid grid-cols-3 gap-3.5 pb-4 border-b border-tlb-divider">
                <div>
                    <p className="pt-eyebrow mb-1">Slot</p>
                    <p className="text-[13px] font-semibold text-tlb-ink">{slotLabelOf(entry.listingStartsAt, now)}</p>
                </div>
                <div>
                    <p className="pt-eyebrow mb-1">Amount</p>
                    <p className="text-[13px] font-semibold text-tlb-ink">{formatRupees(entry.amount)}</p>
                </div>
                <div>
                    <p className="pt-eyebrow mb-1">Booked</p>
                    <p className="text-[13px] font-semibold text-tlb-ink">{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-6 text-tlb-muted">
                    <Loader2 size={18} className="animate-spin" />
                </div>
            ) : (
                <>
                    {!!detail?.line_items?.length && (
                        <div className="mt-4">
                            <p className="pt-eyebrow mb-2">What was booked</p>
                            <div className="rounded-xl border border-tlb-divider overflow-hidden">
                                {detail.line_items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between px-3.5 py-2.5 border-b border-tlb-divider last:border-b-0 text-[13px]">
                                        <span className="text-tlb-ink font-medium">{item.ticket_name || item.package_name || item.batch_name || item.item_type}</span>
                                        <span className="text-tlb-muted font-semibold">Qty {item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-5 pt-4 border-t border-tlb-divider">
                        <p className="pt-eyebrow mb-2">Customer</p>
                        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                            <div>
                                <p className="pt-eyebrow mb-1">Phone</p>
                                <p className="text-[13px] font-semibold text-tlb-ink">{detail?.customer_phone || '—'}</p>
                            </div>
                            <div>
                                <p className="pt-eyebrow mb-1">Email</p>
                                <p className="text-[13px] font-semibold text-tlb-ink truncate">{detail?.customer_email || '—'}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {detail?.customer_phone && (
                                <a href={`tel:${detail.customer_phone}`} className="pt-btn pt-btn-d">
                                    <Phone size={14} /> Call customer
                                </a>
                            )}
                            {entry.status === 'confirmed' && (
                                <button type="button" onClick={handleMarkAttended} disabled={marking} className="pt-btn pt-btn-o">
                                    {marking ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    Mark attended
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </PortalModal>
    );
};
