import React from 'react';
import { RotateCcw, Ban, Info, Check } from 'lucide-react';

interface Props {
    /** true = refundable (the backend default when unset). */
    value: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}

/**
 * Refundable / Non-refundable selector for a listing.
 *
 * Note this is an informational label shown to customers before they book — it
 * does not by itself block a refund from being processed on cancellation. The
 * existing cancellation-deadline logic runs regardless, so the helper text
 * below deliberately avoids promising otherwise.
 */
export const RefundPolicyToggle: React.FC<Props> = ({ value, onChange, disabled = false }) => {
    const options: { key: 'refundable' | 'non-refundable'; selected: boolean; icon: React.ElementType; title: string; sub: string }[] = [
        {
            key: 'refundable',
            selected: value,
            icon: RotateCcw,
            title: 'Refundable',
            sub: 'Customers can cancel for a refund before the cut-off.',
        },
        {
            key: 'non-refundable',
            selected: !value,
            icon: Ban,
            title: 'Non-refundable',
            sub: 'Customers are told upfront that payments are not returned.',
        },
    ];

    return (
        <div className="pt-field">
            <label className="pt-field-k">Refund policy type</label>
            <p className="text-[11px] text-tlb-muted -mt-0.5 mb-1">
                Shown as a badge on your listing so customers know before they pay.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map(opt => {
                    const Icon = opt.icon;
                    return (
                        <button
                            key={opt.key}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(opt.key === 'refundable')}
                            aria-pressed={opt.selected}
                            className={`pt-tile pt-tile-wide ${opt.selected ? 'is-on' : ''}`}
                        >
                            {opt.selected && <span className="pt-tile-check"><Check size={11} strokeWidth={3} /></span>}
                            <Icon size={19} strokeWidth={2} className="flex-none mt-0.5" />
                            <span className="min-w-0">
                                <span className="block">{opt.title}</span>
                                <span className="block text-[11px] font-medium text-tlb-muted mt-0.5 leading-snug">{opt.sub}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="pt-note">
                <Info size={13} strokeWidth={2.75} className="flex-none" />
                <p>
                    This sets what customers see on the listing. Cancellation cut-off rules still
                    apply to bookings as normal — set those in your cancellation policy and terms.
                </p>
            </div>
        </div>
    );
};

export default RefundPolicyToggle;
