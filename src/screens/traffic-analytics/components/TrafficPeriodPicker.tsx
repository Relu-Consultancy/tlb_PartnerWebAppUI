import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { useDismiss } from '../../../hooks/useDismiss';
import { TRAFFIC_PERIOD_OPTIONS } from '../presentation';
import { TrafficPeriodState } from '../types';

interface Props {
    value: TrafficPeriodState;
    onChange: (next: TrafficPeriodState) => void;
}

/**
 * Screen-local period picker — deliberately not the global DateRangePicker,
 * which is hardwired to PartnerContext's rolling 7d/30d/90d/1y/all window.
 * This one carries its own state and adds a custom date_from/date_to range.
 */
export const TrafficPeriodPicker: React.FC<Props> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    useDismiss(rootRef, open, () => setOpen(false));

    const label = TRAFFIC_PERIOD_OPTIONS.find(o => o.key === value.key)?.label ?? 'This month';

    return (
        <div ref={rootRef} className="relative flex-none flex items-center gap-2 flex-wrap">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Traffic period: ${label}`}
                className="inline-flex items-center gap-[9px] bg-white border border-tlb-line rounded-[10px] px-3 sm:px-3.5 py-2 text-[13px] font-semibold text-tlb-ink whitespace-nowrap hover:border-tlb-edge transition-colors"
            >
                <CalendarDays size={15} strokeWidth={2.75} className="text-tlb-link" />
                {label}
                <ChevronDown size={13} strokeWidth={3} className="text-tlb-muted" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.ul
                        role="listbox"
                        aria-label="Traffic period"
                        className="pt-popover absolute left-0 top-[46px] z-50 w-[190px] p-[7px]"
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                    >
                        {TRAFFIC_PERIOD_OPTIONS.map(option => {
                            const selected = option.key === value.key;
                            return (
                                <li key={option.key}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        className={`pt-opt ${selected ? 'is-on' : ''}`}
                                        onClick={() => { onChange({ ...value, key: option.key }); setOpen(false); }}
                                    >
                                        {option.label}
                                    </button>
                                </li>
                            );
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>

            {value.key === 'custom' && (
                <div className="flex items-center gap-1.5">
                    <input
                        type="date"
                        aria-label="From date"
                        value={value.dateFrom}
                        max={value.dateTo || undefined}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, dateFrom: e.target.value })}
                        className="pt-input !w-auto !py-2 text-[12.5px]"
                    />
                    <span className="text-tlb-muted text-xs">to</span>
                    <input
                        type="date"
                        aria-label="To date"
                        value={value.dateTo}
                        min={value.dateFrom || undefined}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, dateTo: e.target.value })}
                        className="pt-input !w-auto !py-2 text-[12.5px]"
                    />
                </div>
            )}
        </div>
    );
};
