import React from 'react';
import { RotateCcw, Ban, Info } from 'lucide-react';

export type RefundToggleAccent = 'blue' | 'amber' | 'emerald' | 'yellow' | 'purple';

interface Props {
    /** true = refundable (the backend default when unset). */
    value: boolean;
    onChange: (value: boolean) => void;
    /** Accent colour matching the wizard theme. */
    accent?: RefundToggleAccent;
    disabled?: boolean;
}

const ACCENT: Record<RefundToggleAccent, { border: string; bg: string; text: string; badge: string }> = {
    blue:    { border: 'border-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700' },
    amber:   { border: 'border-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' },
    emerald: { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    yellow:  { border: 'border-tlb-yellow',  bg: 'bg-tlb-yellow/10', text: 'text-amber-600', badge: 'bg-tlb-yellow/20 text-amber-700' },
    purple:  { border: 'border-purple-400',  bg: 'bg-purple-50',  text: 'text-purple-600',  badge: 'bg-purple-100 text-purple-700' },
};

/**
 * Refundable / Non-refundable selector for a listing.
 *
 * Note this is an informational label shown to customers before they book — it
 * does not by itself block a refund from being processed on cancellation. The
 * existing cancellation-deadline logic runs regardless, so the helper text
 * below deliberately avoids promising otherwise.
 */
export const RefundPolicyToggle: React.FC<Props> = ({ value, onChange, accent = 'blue', disabled = false }) => {
    const a = ACCENT[accent];

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
        <div className="space-y-3">
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                    Refund Policy Type
                </label>
                <p className="text-[11px] text-gray-400">
                    Shown as a badge on your listing so customers know before they pay.
                </p>
            </div>

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
                            className={`text-left p-4 rounded-2xl border-2 transition-all disabled:opacity-60 ${
                                opt.selected
                                    ? `${a.border} ${a.bg}`
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    opt.selected ? a.badge : 'bg-gray-100 text-gray-400'
                                }`}>
                                    <Icon size={15} />
                                </div>
                                <span className={`text-sm font-black ${opt.selected ? a.text : 'text-gray-600'}`}>
                                    {opt.title}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-snug">{opt.sub}</p>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-snug">
                    This sets what customers see on the listing. Cancellation cut-off rules still
                    apply to bookings as normal — set those in your cancellation policy and terms.
                </p>
            </div>
        </div>
    );
};

export default RefundPolicyToggle;
