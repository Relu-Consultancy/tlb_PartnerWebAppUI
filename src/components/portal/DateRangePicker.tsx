import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';
import { DATE_RANGE_OPTIONS, getDateRangeOption } from '../../constants/dateRange';
import { useDismiss } from '../../hooks/useDismiss';

/** Top-bar reporting window selector; the choice lives in PartnerContext. */
export const DateRangePicker: React.FC = () => {
    const { dateRange, setDateRange } = usePartner();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    useDismiss(rootRef, open, () => setOpen(false));

    return (
        <div ref={rootRef} className="relative flex-none">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Reporting period: ${getDateRangeOption(dateRange).label}`}
                className="inline-flex items-center gap-[9px] bg-white border border-tlb-line rounded-[10px] px-3 sm:px-3.5 py-2 text-[13px] font-semibold text-tlb-ink whitespace-nowrap hover:border-tlb-edge transition-colors"
            >
                <CalendarDays size={15} strokeWidth={2.75} className="text-tlb-link" />
                {getDateRangeOption(dateRange).label}
                <ChevronDown size={13} strokeWidth={3} className="text-tlb-muted" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.ul
                        role="listbox"
                        aria-label="Reporting period"
                        className="pt-popover absolute left-0 top-[46px] z-50 w-[210px] p-[7px]"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                    >
                        {DATE_RANGE_OPTIONS.map(option => {
                            const selected = option.key === dateRange;
                            return (
                                <li key={option.key}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        className={`pt-opt ${selected ? 'is-on' : ''}`}
                                        onClick={() => { setDateRange(option.key); setOpen(false); }}
                                    >
                                        {option.label}
                                    </button>
                                </li>
                            );
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};
