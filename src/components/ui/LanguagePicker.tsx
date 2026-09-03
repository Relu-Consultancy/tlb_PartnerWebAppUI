import React from 'react';
import { Check, Languages } from 'lucide-react';

export type LanguageAccent = 'blue' | 'amber' | 'emerald' | 'yellow' | 'purple';

export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'other', label: 'Other' },
];

/**
 * Mirrors the server rule: `other_language` is required whenever "other" is
 * one of the selected languages. An empty selection is "not specified yet",
 * not an error — the backend defaults `languages` to [] on a new listing.
 */
export const validateLanguages = (languages: string[], otherLanguage: string): string | null => {
    if (languages.includes('other') && !otherLanguage.trim()) {
        return 'Please name the other language this listing is conducted in.';
    }
    return null;
};

interface Props {
    languages: string[];
    otherLanguage: string;
    /** Emits both values together so de-selecting "Other" can clear the free text. */
    onChange: (languages: string[], otherLanguage: string) => void;
    accent?: LanguageAccent;
    error?: string;
    disabled?: boolean;
}

const ACCENT: Record<LanguageAccent, { chip: string; ring: string }> = {
    blue:    { chip: 'bg-blue-500 text-white border-blue-500',        ring: 'focus:border-blue-300' },
    amber:   { chip: 'bg-amber-500 text-white border-amber-500',      ring: 'focus:border-amber-300' },
    emerald: { chip: 'bg-emerald-500 text-white border-emerald-500',  ring: 'focus:border-emerald-300' },
    yellow:  { chip: 'bg-tlb-yellow text-tlb-dark border-tlb-yellow', ring: 'focus:border-tlb-yellow' },
    purple:  { chip: 'bg-purple-500 text-white border-purple-500',    ring: 'focus:border-purple-300' },
};

export const LanguagePicker: React.FC<Props> = ({
    languages, otherLanguage, onChange, accent = 'blue', error, disabled = false,
}) => {
    const a = ACCENT[accent];
    const hasOther = languages.includes('other');

    const toggle = (value: string) => {
        const next = languages.includes(value)
            ? languages.filter(l => l !== value)
            : [...languages, value];
        // Dropping "Other" also drops the free text it was describing.
        onChange(next, next.includes('other') ? otherLanguage : '');
    };

    return (
        <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Languages size={12} /> Language(s)
            </label>
            <p className="text-[11px] text-gray-400 mb-3">
                Which language is this conducted in? Customers see this on your listing.
            </p>

            <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(opt => {
                    const selected = languages.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            role="checkbox"
                            aria-checked={selected}
                            disabled={disabled}
                            onClick={() => toggle(opt.value)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all disabled:opacity-60 ${
                                selected
                                    ? `${a.chip} shadow-sm`
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                        >
                            {selected && <Check size={13} />}
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {hasOther && (
                <div className="mt-3">
                    <input
                        className={`tlb-input w-full ${a.ring} ${error ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                        placeholder="Which language? e.g. Marathi"
                        maxLength={100}
                        value={otherLanguage}
                        disabled={disabled}
                        onChange={(e) => onChange(languages, e.target.value)}
                    />
                </div>
            )}

            {error && <p className="text-xs font-semibold text-red-500 mt-2">{error}</p>}
        </div>
    );
};

export default LanguagePicker;

/**
 * Human-readable language line for customer-facing surfaces, e.g.
 * ["english","other"] + "Marathi" -> "English, Marathi". Returns '' when
 * nothing has been specified yet so callers can omit the row entirely.
 */
export const formatLanguages = (languages?: string[] | null, otherLanguage?: string | null): string => {
    if (!Array.isArray(languages) || languages.length === 0) return '';
    return languages
        .map(l => {
            if (l === 'other') return (otherLanguage || '').trim();
            return LANGUAGE_OPTIONS.find(o => o.value === l)?.label || l;
        })
        .filter(Boolean)
        .join(', ');
};
