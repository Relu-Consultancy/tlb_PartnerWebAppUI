import React from 'react';

interface WizardFieldProps {
    label: string;
    hint?: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}

/** Label + hint wrapper for a single wizard input — pairs with `.pt-input` on the field itself. */
export const WizardField: React.FC<WizardFieldProps> = ({ label, hint, required, className = '', children }) => (
    <div className={`pt-field ${className}`}>
        <label className="pt-field-k">
            {label}{required && <span className="text-tlb-red ml-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="text-[11px] text-tlb-muted">{hint}</p>}
    </div>
);
