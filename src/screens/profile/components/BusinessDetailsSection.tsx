import React from 'react';
import { Pill } from '../../../components/portal';
import { BusinessFields } from '../useProfileForm';
import { FieldInput, FieldView, SectionCard } from './fields';

interface BusinessDetailsSectionProps {
    fields: BusinessFields;
    editing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onChange: (key: keyof BusinessFields, value: string) => void;
    email: string;
    gstin: string | null;
    pan: string | null;
    verified: boolean;
}

export const BusinessDetailsSection: React.FC<BusinessDetailsSectionProps> = ({
    fields, editing, onEdit, onCancel, onChange, email, gstin, pan, verified,
}) => {
    const kycPill = <Pill tone={verified ? 'green' : 'amber'}>{verified ? 'Verified' : 'Submitted'}</Pill>;

    const text = (key: keyof BusinessFields, label: string, extra: Partial<React.ComponentProps<typeof FieldInput>> = {}) =>
        editing
            ? <FieldInput id={`profile-${key}`} label={label} value={fields[key]} onChange={v => onChange(key, v)} {...extra} />
            : <FieldView label={label} value={fields[key]} className={extra.className} />;

    return (
        <SectionCard
            title="Business details"
            subtitle="Shown to customers on your public page"
            action={editing
                ? <button type="button" className="pt-btn pt-btn-o" onClick={onCancel}>Cancel</button>
                : <button type="button" className="pt-btn pt-btn-o" onClick={onEdit}>Edit</button>}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {text('businessName', 'Business name', { maxLength: 120 })}
                {text('contactName', 'Owner name', { maxLength: 120 })}
                {text('contactNumber', 'Phone', { type: 'tel', placeholder: '+91 98765 43210', maxLength: 20 })}
                <FieldView label="Email" value={email} locked placeholder="—" />
                {text('address', 'Address', { className: 'sm:col-span-2', placeholder: 'Full address of your studio or space' })}
                {gstin && <FieldView label="GSTIN" value={gstin} locked trailing={kycPill} />}
                {pan && <FieldView label="PAN" value={pan} locked trailing={kycPill} />}
                {text('bio', 'About your business', {
                    className: 'sm:col-span-2', multiline: true, maxLength: 1500,
                    placeholder: 'Tell customers what makes your business special',
                })}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {text('websiteUrl', 'Website', { type: 'url', placeholder: 'https://' })}
                    {text('instagramUrl', 'Instagram', { type: 'url', placeholder: 'https://instagram.com/…' })}
                    {text('facebookUrl', 'Facebook', { type: 'url', placeholder: 'https://facebook.com/…' })}
                </div>
            </div>
        </SectionCard>
    );
};
