import React, { useEffect, useState } from 'react';
import { AlertCircle, Ban, Check, Loader2, Phone } from 'lucide-react';
import { getBookingDetail, getBookingPaymentDetail } from '../../../api/listings';
import { Pill, PortalModal } from '../../../components/portal';
import { formatRupees } from '../../../utils/format';
import { BookingEntity, BookingEntry, Refund } from '../types';
import { BOOKING_ENTITY_LABEL, BOOKING_ENTITY_TONE, REFUND_STATUS_META, bookingStatusMeta } from '../presentation';
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
    refund?: Refund | null;
}

type CancelResult = { success: true } | { success: false; code: string; message: string };

interface BookingDetailModalProps {
    entry: BookingEntry | null;
    now: Date;
    onClose: () => void;
    onMarkAttended: (id: string) => Promise<boolean>;
    onCancelBooking: (id: string, reason: string) => Promise<CancelResult>;
}

const fmtDateTime = (iso: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// The API rejects a cancel outside these two conditions anyway (BOOKING_NOT_REFUNDABLE) — checking
// client-side too just avoids showing the button somewhere it would only ever fail.
const isCancellable = (entry: BookingEntry): boolean => entry.status === 'confirmed' && entry.paymentStatus === 'paid';

// Maps the API's exact error codes to plain-language copy — see api/listings.ts's cancelBooking doc.
const CANCEL_ERROR_COPY: Record<string, string> = {
    BOOKING_NOT_REFUNDABLE: "This booking isn't confirmed and paid, so it can't be cancelled this way.",
    CANCELLATION_DEADLINE_PASSED: "The cancellation window for this booking has passed — there's no override for partners.",
    INVALID_BOOKING_STATUS: 'This booking has already been cancelled, refunded, or marked attended.',
    BOOKING_NOT_FOUND: 'This booking could not be found.',
};

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ entry, now, onClose, onMarkAttended, onCancelBooking }) => {
    const [detail, setDetail] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelError, setCancelError] = useState<string | null>(null);

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

    // Reset the cancel-flow UI whenever a different booking is opened.
    useEffect(() => {
        setShowCancelForm(false);
        setCancelReason('');
        setCancelError(null);
    }, [entry?.id]);

    if (!entry) return <PortalModal open={false} onClose={onClose} title=""><div /></PortalModal>;

    const isCancelled = entry.status === 'cancelled';
    const refund = detail?.refund ?? null;
    const refundMeta = refund ? REFUND_STATUS_META[refund.status] : null;
    // Once the real refund object has loaded, it's the authoritative status — overrides the coarse
    // paymentStatus-based badge (which can't distinguish "processing" from "settled") so the header
    // Pill never contradicts the detail note just below it.
    const meta = isCancelled && refundMeta ? { label: refundMeta.label, tone: refundMeta.tone } : bookingStatusMeta(entry);

    const handleMarkAttended = async () => {
        setMarking(true);
        await onMarkAttended(entry.id);
        setMarking(false);
    };

    const handleConfirmCancel = async () => {
        if (!cancelReason.trim()) { setCancelError('Please add a short reason — the customer sees this.'); return; }
        setCancelling(true);
        setCancelError(null);
        const result = await onCancelBooking(entry.id, cancelReason.trim());
        setCancelling(false);
        if (result.success) {
            setShowCancelForm(false);
            // Refresh so the real `refund` object (now "processing") shows immediately.
            getBookingDetail(entry.id).then(d => setDetail(prev => ({ ...prev, ...(d?.data ?? d) })));
        } else {
            setCancelError(CANCEL_ERROR_COPY[result.code] || result.message);
        }
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
                refundMeta ? (
                    <div className={`pt-note mb-4 ${refund?.status === 'settled' ? 'bg-tlb-green-soft text-tlb-green' : refund?.status === 'failed' ? 'bg-tlb-red-soft text-tlb-red-deep' : 'bg-tlb-amber-soft text-tlb-gold'}`}>
                        <AlertCircle size={14} strokeWidth={2.75} className="flex-none mt-0.5" aria-hidden="true" />
                        <span>
                            <strong className="font-bold">{refundMeta.label}</strong> — {formatRupees(refund!.amount)}
                            {refundMeta.sub ? `. ${refundMeta.sub}.` : '.'}
                            {refund?.status === 'settled' && refund.settled_at && ` Settled ${fmtDateTime(refund.settled_at)}.`}
                            {refund?.status === 'failed' && refund.failed_at && ` Failed ${fmtDateTime(refund.failed_at)}.`}
                        </span>
                    </div>
                ) : (
                    <div className="pt-note mb-4 bg-tlb-red-soft text-tlb-red-deep">
                        <AlertCircle size={14} strokeWidth={2.75} className="flex-none" aria-hidden="true" />
                        This booking was cancelled. No refund was initiated for it.
                    </div>
                )
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
                            {isCancellable(entry) && !showCancelForm && (
                                <button type="button" onClick={() => setShowCancelForm(true)} className="pt-btn pt-btn-o text-tlb-red-deep">
                                    <Ban size={14} /> Cancel &amp; refund
                                </button>
                            )}
                        </div>
                    </div>

                    {showCancelForm && (
                        <div className="mt-4 pt-4 border-t border-tlb-divider">
                            <p className="pt-eyebrow mb-1.5">Cancel this booking</p>
                            <p className="text-[11.5px] text-tlb-muted mb-2">
                                The customer will be refunded and sees this reason. This can't be undone.
                            </p>
                            <textarea
                                className="pt-input min-h-[70px]"
                                placeholder="e.g. Event rescheduled, customer opted out"
                                value={cancelReason}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setCancelReason(e.target.value); setCancelError(null); }}
                                maxLength={300}
                                disabled={cancelling}
                            />
                            {cancelError && <p className="text-[11.5px] font-semibold text-tlb-red-deep mt-1.5">{cancelError}</p>}
                            <div className="flex items-center gap-2 mt-2.5">
                                <button type="button" onClick={() => { setShowCancelForm(false); setCancelError(null); }} disabled={cancelling} className="pt-btn pt-btn-o">
                                    Back
                                </button>
                                <button type="button" onClick={handleConfirmCancel} disabled={cancelling} className="pt-btn bg-tlb-red text-white">
                                    {cancelling ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                                    Confirm cancellation
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </PortalModal>
    );
};
