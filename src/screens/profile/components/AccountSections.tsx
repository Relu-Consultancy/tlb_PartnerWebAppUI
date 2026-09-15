import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { BankDetails } from '../../../api/banking';
import { IconTile, PartnerIdentity, Pill, Tone, VERIFICATION_TONE } from '../../../components/portal';
import { Skeleton } from '../../../components/ui';
import { FieldView, SectionCard } from './fields';

// ── Documents & KYC ─────────────────────────────────────────────────────────

const VERIFICATION_COPY: Record<PartnerIdentity['verification'], { title: string; detail: string }> = {
    verified: { title: 'Your business is verified', detail: 'TLB has reviewed and approved your documents.' },
    in_review: { title: 'Documents under review', detail: 'TLB is reviewing what you submitted — usually within 24–48 hours.' },
    pending: { title: 'Verification pending', detail: 'Submit your PAN and bank details to get verified.' },
};

export const DocumentsSection: React.FC<{ identity: PartnerIdentity; onManage: () => void }> = ({ identity, onManage }) => {
    const copy = VERIFICATION_COPY[identity.verification];
    return (
        <SectionCard
            title="Documents & KYC"
            subtitle="Verification documents reviewed by TLB"
            action={<button type="button" className="pt-btn pt-btn-o" onClick={onManage}>Manage documents</button>}
        >
            <div className="flex items-center gap-3">
                <IconTile tone={VERIFICATION_TONE[identity.verification]} icon={ShieldCheck} size="md" />
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-tlb-ink">{copy.title}</p>
                    <p className="text-xs text-tlb-muted mt-px">{copy.detail}</p>
                </div>
                <Pill tone={VERIFICATION_TONE[identity.verification]} className="hidden sm:inline-flex">{identity.verificationLabel}</Pill>
            </div>
        </SectionCard>
    );
};

// ── Bank & payouts ──────────────────────────────────────────────────────────

export type BankState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready'; bank: BankDetails | null };

const BANK_STATUS: Record<BankDetails['verification_status'], { label: string; tone: Tone }> = {
    verified: { label: 'Verified', tone: 'green' },
    under_review: { label: 'Under review', tone: 'blue' },
    pending: { label: 'Pending review', tone: 'amber' },
    rejected: { label: 'Rejected', tone: 'red' },
};

interface BankSectionProps {
    state: BankState;
    onManage: () => void;
    onRetry: () => void;
}

export const BankSection: React.FC<BankSectionProps> = ({ state, onManage, onRetry }) => {
    const bank = state.status === 'ready' ? state.bank : null;
    const status = bank ? BANK_STATUS[bank.verification_status] ?? BANK_STATUS.pending : null;

    return (
        <SectionCard
            title="Bank & payouts"
            subtitle="Where TLB sends your earnings"
            action={bank && <button type="button" className="pt-btn pt-btn-o" onClick={onManage}>Update</button>}
        >
            {state.status === 'loading' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[62px] rounded-[10px]" />)}
                </div>
            )}

            {state.status === 'error' && (
                <div className="pt-note flex-wrap">
                    <AlertCircle size={16} className="text-tlb-red flex-none" aria-hidden="true" />
                    <span className="flex-1">Couldn’t load your bank details.</span>
                    <button type="button" className="pt-btn pt-btn-o pt-btn-sm" onClick={onRetry}>Try again</button>
                </div>
            )}

            {state.status === 'ready' && !bank && (
                <div className="pt-note flex-wrap">
                    <span className="flex-1 min-w-[200px]">Add a bank account so TLB can pay out your bookings.</span>
                    <button type="button" className="pt-btn pt-btn-y" onClick={onManage}>Add bank details</button>
                </div>
            )}

            {bank && status && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldView label="Account holder" value={bank.account_holder_name} locked />
                        <FieldView label="Bank" value={[bank.bank_name, bank.branch_name].filter(Boolean).join(' · ')} locked />
                        <FieldView label="Account number" value={bank.account_number_masked} locked trailing={<Pill tone={status.tone}>{status.label}</Pill>} />
                        <FieldView label="IFSC" value={bank.ifsc_code} locked />
                    </div>
                    {bank.verification_status === 'rejected' && bank.verification_note && (
                        <div className="pt-note mt-3.5 bg-tlb-red-soft text-tlb-red-deep">
                            <AlertCircle size={16} className="flex-none" aria-hidden="true" />
                            {bank.verification_note}
                        </div>
                    )}
                </>
            )}
        </SectionCard>
    );
};
