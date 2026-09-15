import React from 'react';

// Shared layout pieces for My Profile section cards.

interface SectionCardProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, action, children }) => (
    <div className="pt-card px-5 sm:px-6 py-5">
        <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
                <h2 className="pt-h-sec">{title}</h2>
                {subtitle && <p className="text-xs text-tlb-muted mt-0.5">{subtitle}</p>}
            </div>
            {action && <div className="flex-none flex items-center gap-2">{action}</div>}
        </div>
        {children}
    </div>
);

interface FieldViewProps {
    label: string;
    value?: string | null;
    placeholder?: string;
    /** Trailing element for read-only fields (e.g. a status pill). */
    trailing?: React.ReactNode;
    locked?: boolean;
    className?: string;
}

export const FieldView: React.FC<FieldViewProps> = ({
    label, value, placeholder = 'Not added', trailing, locked = false, className = '',
}) => (
    <div className={`pt-field ${className}`}>
        <span className="pt-field-k">{label}</span>
        <div className={`pt-field-v ${locked ? 'is-locked' : ''} ${value ? '' : 'is-empty'}`}>
            <span className="min-w-0">{value || placeholder}</span>
            {trailing}
        </div>
    </div>
);

interface FieldInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'tel' | 'url' | 'email';
    multiline?: boolean;
    maxLength?: number;
    className?: string;
}

export const FieldInput: React.FC<FieldInputProps> = ({
    id, label, value, onChange, placeholder, type = 'text', multiline = false, maxLength, className = '',
}) => (
    <div className={`pt-field ${className}`}>
        <label htmlFor={id} className="pt-field-k">{label}</label>
        {multiline ? (
            <textarea
                id={id}
                className="pt-input"
                value={value}
                placeholder={placeholder}
                maxLength={maxLength}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
            />
        ) : (
            <input
                id={id}
                type={type}
                className="pt-input"
                value={value}
                placeholder={placeholder}
                maxLength={maxLength}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            />
        )}
    </div>
);
