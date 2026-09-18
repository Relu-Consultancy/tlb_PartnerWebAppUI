import React from 'react';
import { BankDetails } from '../../../api/banking';
import { Pill, Tone } from '../../../components/portal';

const VERIFICATION_META: Record<BankDetails['verification_status'], { label: string; tone: Tone }> = {
    pending: { label: 'Pending verification', tone: 'neutral' },
    under_review: { label: 'Under review', tone: 'blue' },
    verified: { label: 'Verified', tone: 'green' },
    rejected: { label: 'Rejected', tone: 'red' },
};

interface PayoutAccountCardProps {
    bank: BankDetails | null;
    onManage: () => void;
}

export const PayoutAccountCard: React.FC<PayoutAccountCardProps> = ({ bank, onManage }) => (
    <div className="pt-card p-[16px_18px]">
        <div className="flex items-center justify-between gap-2 mb-2.5">
            <p className="pt-h-sec">Payout account</p>
            {bank && <Pill tone={VERIFICATION_META[bank.verification_status].tone}>{VERIFICATION_META[bank.verification_status].label}</Pill>}
        </div>
        {bank ? (
            <>
                <p className="text-[13.5px] font-bold text-tlb-ink">{bank.bank_name} {bank.account_number_masked}</p>
                <p className="text-[12px] text-tlb-muted mt-0.5">{bank.account_holder_name} · {bank.ifsc_code}</p>
                {bank.verification_status === 'rejected' && bank.verification_note && (
                    <p className="text-[11.5px] text-tlb-red-deep mt-2">{bank.verification_note}</p>
                )}
            </>
        ) : (
            <p className="text-[12.5px] text-tlb-muted">No bank account linked yet.</p>
        )}
        <button type="button" onClick={onManage} className="pt-link mt-3 inline-block">
            {bank ? 'Manage payout account →' : 'Add payout account →'}
        </button>
    </div>
);
