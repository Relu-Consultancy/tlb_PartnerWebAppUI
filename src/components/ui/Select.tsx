import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ElementType;
    description?: string;
    /** Optional colour dot shown before the label (any tailwind bg-* class). */
    dot?: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    /** Wrapper element class (positioning context). */
    className?: string;
    /** Overrides the default trigger button styling entirely when provided. */
    buttonClassName?: string;
    /** Extra classes appended to the default trigger styling. */
    triggerExtra?: string;
    disabled?: boolean;
    ariaLabel?: string;
    /** 'sm' renders a compact trigger (used for inline pills). */
    size?: 'md' | 'sm';
    /** Align the menu to the trigger's left (default) or right edge. */
    align?: 'left' | 'right';
}

const DEFAULT_TRIGGER =
    'tlb-input w-full flex items-center justify-between gap-2 text-left cursor-pointer';

interface MenuCoords {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    minWidth: number;
    maxHeight: number;
}

const MENU_MARGIN = 12; // gap kept from the viewport edge / the trigger
const MENU_CAP = 320; // never grow past this even when there's room to spare

/**
 * Accessible, animated single-select dropdown — a drop-in replacement for native
 * <select>. The menu is rendered in a portal with fixed positioning so it is
 * never clipped by an overflow/scroll container (tables, cards, etc.), supports
 * keyboard navigation (↑/↓/Home/End/Enter/Esc), click-outside to close, a
 * selected check mark, optional icons and colour dots, and flips upward when
 * there isn't room below.
 */
export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select…',
    className = '',
    buttonClassName,
    triggerExtra = '',
    disabled = false,
    ariaLabel,
    size = 'md',
    align = 'left',
}) => {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [coords, setCoords] = useState<MenuCoords | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const listId = useId();

    const selected = options.find((o) => o.value === value) || null;
    const selectedIndex = options.findIndex((o) => o.value === value);

    const updatePosition = () => {
        const btn = buttonRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        // Always open downward — flipping upward when the trigger sits low on
        // a long page (e.g. below a map) reliably ended up overlapping content
        // further up instead. Cap the height to whatever's actually left below
        // the trigger so the menu scrolls within itself rather than overshoot.
        const spaceBelow = window.innerHeight - r.bottom;
        const maxHeight = Math.max(160, Math.min(MENU_CAP, spaceBelow - MENU_MARGIN));
        setCoords({
            top: r.bottom + 6,
            bottom: undefined,
            left: align === 'left' ? r.left : undefined,
            right: align === 'right' ? window.innerWidth - r.right : undefined,
            minWidth: r.width,
            maxHeight,
        });
    };

    // Position the menu before paint when opening, and keep it pinned to the
    // trigger on scroll/resize while open.
    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
        const onScrollOrResize = () => updatePosition();
        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);
        return () => {
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Close on outside click (account for the portalled menu)
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (wrapperRef.current?.contains(t)) return;
            if (listRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // When opening, set the active option to the current selection
    useEffect(() => {
        if (open) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Keep the active option scrolled into view
    useEffect(() => {
        if (!open || activeIndex < 0) return;
        const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, open]);

    const choose = (val: string) => {
        onChange(val);
        setOpen(false);
        buttonRef.current?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (!open) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                setOpen(false);
                buttonRef.current?.focus();
                break;
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((i) => Math.min(options.length - 1, i + 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
                break;
            case 'Home':
                e.preventDefault();
                setActiveIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setActiveIndex(options.length - 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (activeIndex >= 0 && options[activeIndex]) choose(options[activeIndex].value);
                break;
        }
    };

    const SelectedIcon = selected?.icon;

    const menu = open && coords ? createPortal(
        <AnimatePresence>
            <motion.ul
                ref={listRef}
                id={listId}
                role="listbox"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                    position: 'fixed',
                    top: coords.top,
                    bottom: coords.bottom,
                    left: coords.left,
                    right: coords.right,
                    minWidth: coords.minWidth,
                    maxHeight: coords.maxHeight,
                }}
                className="z-[200] overflow-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-2xl ring-1 ring-black/5"
            >
                {options.map((opt, i) => {
                    const isSelected = opt.value === value;
                    const isActive = i === activeIndex;
                    const OptIcon = opt.icon;
                    return (
                        <li
                            key={opt.value}
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setActiveIndex(i)}
                            onClick={() => choose(opt.value)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                isActive ? 'bg-tlb-yellow/15' : ''
                            } ${isSelected ? 'text-tlb-dark' : 'text-gray-600'}`}
                        >
                            {opt.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />}
                            {OptIcon && <OptIcon size={16} className="shrink-0 text-gray-400" />}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">{opt.label}</p>
                                {opt.description && (
                                    <p className="text-[11px] text-gray-400 truncate">{opt.description}</p>
                                )}
                            </div>
                            {isSelected && <Check size={16} className="shrink-0 text-tlb-dark" />}
                        </li>
                    );
                })}
            </motion.ul>
        </AnimatePresence>,
        document.body,
    ) : null;

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((o) => !o)}
                onKeyDown={onKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                aria-controls={listId}
                className={`${buttonClassName ?? DEFAULT_TRIGGER} ${triggerExtra} ${
                    size === 'sm' ? '!py-2 !text-xs' : ''
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
                <span className={`flex items-center gap-2 min-w-0 ${selected ? '' : 'text-gray-400'}`}>
                    {selected?.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dot}`} />}
                    {SelectedIcon && <SelectedIcon size={size === 'sm' ? 14 : 16} className="shrink-0" />}
                    <span className="truncate">{selected ? selected.label : placeholder}</span>
                </span>
                <ChevronDown
                    size={size === 'sm' ? 14 : 18}
                    className={`shrink-0 text-current opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {menu}
        </div>
    );
};

export default Select;
