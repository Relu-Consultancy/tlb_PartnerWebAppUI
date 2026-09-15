import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ListFilter } from 'lucide-react';
import { ListingState } from '../../api/portalSummary';
import { useDismiss } from '../../hooks/useDismiss';
import { LISTING_STATUS_META, LISTING_STATUS_ORDER } from './listingStatus';

interface ListingStatusFilterProps {
    value: ListingState | 'any';
    onChange: (value: ListingState | 'any') => void;
    /** Count of visible rows for each listing state, in the current staged set. */
    countOf: (state: ListingState | 'any') => number;
}

/** "All listings" dropdown — filters a table by the listing's own status. */
export const ListingStatusFilter: React.FC<ListingStatusFilterProps> = ({ value, onChange, countOf }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    useDismiss(rootRef, open, () => setOpen(false));

    const label = value === 'any' ? 'All listings' : `${LISTING_STATUS_META[value].label} listings`;

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="inline-flex items-center gap-[9px] bg-white border border-tlb-line rounded-full px-[15px] py-2 text-[12.5px] font-semibold text-tlb-ink whitespace-nowrap hover:border-tlb-edge transition-colors"
            >
                <ListFilter size={14} strokeWidth={2.75} className="text-tlb-link" />
                {label}
                <ChevronDown size={12} strokeWidth={3} className="text-tlb-muted" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.ul
                        role="listbox"
                        className="pt-popover absolute left-0 top-11 z-40 w-[230px] p-[7px]"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                    >
                        <li>
                            <button type="button" role="option" aria-selected={value === 'any'} className={`pt-opt ${value === 'any' ? 'is-on' : ''}`} onClick={() => { onChange('any'); setOpen(false); }}>
                                <span className="w-[7px] h-[7px] rounded-full mr-[9px] flex-none" style={{ background: '#D6D2C8' }} />
                                All listings
                                <span className="ml-auto text-[11px] text-tlb-muted">{countOf('any')}</span>
                            </button>
                        </li>
                        {LISTING_STATUS_ORDER.map(state => (
                            <li key={state}>
                                <button type="button" role="option" aria-selected={value === state} className={`pt-opt ${value === state ? 'is-on' : ''}`} onClick={() => { onChange(state); setOpen(false); }}>
                                    <span className="w-[7px] h-[7px] rounded-full mr-[9px] flex-none" style={{ background: LISTING_STATUS_META[state].dot }} />
                                    {LISTING_STATUS_META[state].label} listings
                                    <span className="ml-auto text-[11px] text-tlb-muted">{countOf(state)}</span>
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};
