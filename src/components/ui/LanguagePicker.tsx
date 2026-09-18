import React from 'react';
import { Languages } from 'lucide-react';

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
    error?: string;
    disabled?: boolean;
}

export const LanguagePicker: React.FC<Props> = ({
    languages, otherLanguage, onChange, error, disabled = false,
}) => {
    const hasOther = languages.includes('other');

    const toggle = (value: string) => {
        const next = languages.includes(value)
            ? languages.filter(l => l !== value)
            : [...languages, value];
        // Dropping "Other" also drops the free text it was describing.
        onChange(next, next.includes('other') ? otherLanguage : '');
    };

    return (
        <div className="pt-field">
            <label className="pt-field-k flex items-center gap-1.5">
                <Languages size={12} strokeWidth={2.75} /> Language(s)
            </label>
            <p className="text-[11px] text-tlb-muted -mt-0.5">
                Which language is this conducted in? Customers see this on your listing.
            </p>

            <div className="flex flex-wrap gap-2 mt-1">
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
                            className={`pt-scope ${selected ? 'is-active' : ''}`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {hasOther && (
                <input
                    className="pt-input mt-2"
                    placeholder="Which language? e.g. Marathi"
                    maxLength={100}
                    value={otherLanguage}
                    disabled={disabled}
                    onChange={(e) => onChange(languages, e.target.value)}
                />
            )}

            {error && <p className="text-[11px] font-semibold text-tlb-red-deep mt-1.5">{error}</p>}
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
