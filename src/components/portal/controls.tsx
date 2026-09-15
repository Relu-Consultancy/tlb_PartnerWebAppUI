import React from 'react';
import { Search, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Small reusable controls shared across portal list screens (Bookings /
// Enquiries, My Listings): a search box, pill/segmented scope toggles, and a
// "load more" footer row.
// ---------------------------------------------------------------------------

export const SearchField: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({
    value, onChange, placeholder,
}) => (
    <label className="inline-flex items-center gap-2 bg-white border border-tlb-line rounded-full px-[15px] py-2 min-w-[220px] flex-1 sm:flex-none">
        <Search size={14} strokeWidth={2.75} className="text-tlb-muted flex-none" aria-hidden="true" />
        <span className="sr-only">{placeholder}</span>
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-[12.5px] outline-none placeholder:text-tlb-faint"
        />
        {value && (
            <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="text-tlb-muted hover:text-tlb-ink flex-none">
                <X size={13} />
            </button>
        )}
    </label>
);

export interface ScopeOption<K extends string> { key: K; label: string; count?: number }

/** Rounded pill toggle group — Stage (To respond / Responded) and When (Today / Upcoming / …). */
export function ScopePills<K extends string>({ options, value, onChange }: {
    options: ScopeOption<K>[]; value: K; onChange: (key: K) => void;
}) {
    return (
        <>
            {options.map(opt => (
                <button
                    key={opt.key}
                    type="button"
                    className={`pt-scope ${value === opt.key ? 'is-active' : ''}`}
                    aria-pressed={value === opt.key}
                    onClick={() => onChange(opt.key)}
                >
                    {opt.label}
                    {opt.count != null && (
                        <span
                            className="rounded-full px-1.5 text-[10px] font-bold leading-[18px]"
                            style={value === opt.key ? { background: 'rgba(255,255,255,0.22)' } : { background: 'var(--color-tlb-hover)', color: 'var(--color-tlb-muted)' }}
                        >
                            {opt.count}
                        </span>
                    )}
                </button>
            ))}
        </>
    );
}

/** Amber-fill segmented bar — service scope (All / Classes / Venues …). */
export function SegBar<K extends string>({ options, value, onChange }: {
    options: ScopeOption<K>[]; value: K; onChange: (key: K) => void;
}) {
    return (
        <div className="pt-segbar" role="tablist">
            {options.map(opt => (
                <button
                    key={opt.key}
                    type="button"
                    role="tab"
                    aria-selected={value === opt.key}
                    className={`pt-seg ${value === opt.key ? 'is-active' : ''}`}
                    onClick={() => onChange(opt.key)}
                >
                    {opt.label}
                    {opt.count != null && <span className="pt-seg-count">{opt.count}</span>}
                </button>
            ))}
        </div>
    );
}

export const LoadMoreRow: React.FC<{ shown: number; total: number; noun: string; onLoadMore: () => void }> = ({
    shown, total, noun, onLoadMore,
}) => (
    <div className="flex items-center justify-between px-[17px] py-[13px]">
        <span className="text-xs text-tlb-muted">
            {total === 0 ? `0 ${noun}` : `Showing ${shown} of ${total} ${noun}`}
        </span>
        {shown < total && <button type="button" onClick={onLoadMore} className="pt-link">Load more →</button>}
    </div>
);
