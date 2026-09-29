import React from 'react';

interface WizardFieldProps {
    label: string;
    hint?: string;
    required?: boolean;
    /** Required but still empty — makes the field a `scrollToFirstMissingField` target (no visual change). */
    missing?: boolean;
    className?: string;
    children: React.ReactNode;
}

/** Label + hint wrapper for a single wizard input — pairs with `.pt-input` on the field itself. */
export const WizardField: React.FC<WizardFieldProps> = ({ label, hint, required, missing, className = '', children }) => (
    <div className={`pt-field ${className}`} data-field-missing={missing ? true : undefined}>
        <label className="pt-field-k">
            {label}
            {required && <span className="text-tlb-red ml-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="text-[11px] text-tlb-muted">{hint}</p>}
    </div>
);

/** Smooth-scrolls to the first field flagged via `WizardField`'s `missing` (or any element carrying `data-field-missing`). */
export const scrollToFirstMissingField = () => {
    requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('[data-field-missing]');
        el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    });
};
