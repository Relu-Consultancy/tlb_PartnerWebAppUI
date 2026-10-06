import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Landmark, RotateCw } from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { getDateRangeOption } from '../../constants/dateRange';
import { Skeleton, toast } from '../../components/ui';
import { useRevenueData } from './useRevenueData';
import { verticalAmounts } from './model';
import { StatsStrip } from './components/StatsStrip';
import { RevenueByVertical } from './components/RevenueByVertical';
import { LedgerPanel } from './components/LedgerPanel';
import { PayoutHistoryPanel } from './components/PayoutHistoryPanel';
import { PayoutAccountCard } from './components/PayoutAccountCard';
import { BankDetailsModal } from './components/BankDetailsModal';
import { BankDetails, UpdateBankPayload } from '../../api/banking';

interface Props {
    onNavigate: (screen: Screen) => void;
}

const SkeletonBody: React.FC = () => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4" aria-busy="true" aria-label="Loading revenue and payouts">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-56 rounded-[14px]" />
    </div>
);

const FinancialHub: React.FC<Props> = ({ onNavigate }) => {
    const { dateRange } = usePartner();
    const [modalOpen, setModalOpen] = useState(false);
    // The bank record the dialog opened with. Saving flips the screen from the
    // "connect your bank" layout to the full page; holding this steady stops the
    // open dialog from switching to "Update bank account" mid-save.
    const [modalBank, setModalBank] = useState<BankDetails | null>(null);
    const data = useRevenueData(dateRange);

    if (data.loading) return <SkeletonBody />;

    const verticals = verticalAmounts(data.revenue?.revenue_by_type || []);
    const periodPhrase = getDateRangeOption(dateRange).phrase;

    const openBankModal = () => {
        setModalBank(data.bankStatus === 'linked' ? data.bank : null);
        setModalOpen(true);
    };

    const handleSave = async (payload: UpdateBankPayload, cheque?: File) => {
        const ok = await data.saveBank(payload, cheque);
        if (ok) toast.success('Bank details saved. Verification is pending.');
        else toast.error('Couldn’t save bank details. Please try again.');
        return ok;
    };

    // One dialog for both layouts, rendered at the same position in the tree.
    // When each layout had its own copy, saving swapped layouts while the dialog
    // was open: the first copy unmounted and a fresh one mounted and replayed its
    // open animation — the "blink" after submitting the form.
    const bankModal = <BankDetailsModal open={modalOpen} bank={modalBank} onClose={() => setModalOpen(false)} onSave={handleSave} />;

    const header = (
        <div>
            <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                <button type="button" onClick={() => onNavigate('HOME')} className="text-tlb-link hover:text-tlb-gold transition-colors">
                    Dashboard
                </button>
                {' · '}Revenue &amp; payouts
            </nav>
            <h1 className="pt-h1 text-[24px]">Revenue &amp; payouts</h1>
            <p className="text-[13.5px] text-tlb-sub mt-[3px]">What you've earned, what's on the way, and where it lands</p>
        </div>
    );

    // No payout account yet (or it couldn't be checked) — earnings, ledger and payouts
    // stay hidden until there's somewhere for the money to land. Saving the bank form
    // lifts this straight away (verification can still be pending).
    if (data.bankStatus !== 'linked') {
        const loadFailed = data.bankStatus === 'error';
        return (
            <>
                <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
                    {header}
                    <section
                        role="alert"
                        aria-live="polite"
                        className="pt-card max-w-[620px] w-full mx-auto px-5 py-7 sm:px-9 sm:py-9 flex flex-col items-center text-center"
                    >
                        <span
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                loadFailed ? 'bg-tlb-red-soft text-tlb-red-deep' : 'bg-tlb-amber-soft text-tlb-gold'
                            }`}
                            aria-hidden="true"
                        >
                            {loadFailed ? <AlertCircle size={26} strokeWidth={2.25} /> : <Landmark size={26} strokeWidth={2.25} />}
                        </span>
                        <h2 className="pt-h1 text-[20px] sm:text-[22px] mt-4 sm:mt-5">
                            {loadFailed ? 'Couldn’t load your payout account' : 'Connect your bank account'}
                        </h2>
                        <p className="text-[13.5px] text-tlb-sub mt-2.5 max-w-[46ch]">
                            {loadFailed
                                ? 'We need to check your bank details before showing revenue and payouts. Please try again.'
                                : 'Add the account your payouts should settle into. Your revenue, ledger and payout history open up as soon as it’s saved.'}
                        </p>
                        {loadFailed ? (
                            <button
                                type="button"
                                onClick={data.reload}
                                className="pt-btn pt-btn-y justify-center w-full sm:w-auto py-3 sm:py-2 mt-6 sm:mt-7"
                            >
                                <RotateCw size={15} strokeWidth={2.5} /> Try again
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={openBankModal}
                                className="pt-btn pt-btn-y justify-center w-full sm:w-auto py-3 sm:py-2 mt-6 sm:mt-7"
                            >
                                Add bank account <ArrowRight size={15} strokeWidth={2.5} />
                            </button>
                        )}
                    </section>
                </div>
                {bankModal}
            </>
        );
    }

    return (
        <>
            <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
                {header}

                <StatsStrip revenue={data.revenue} periodPhrase={periodPhrase} />

                <div className="pt-card p-[16px_20px]">
                    <p className="pt-h-sec mb-2.5">Revenue by vertical</p>
                    <RevenueByVertical verticals={verticals} />
                </div>

                <LedgerPanel />

                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3.5">
                    <PayoutHistoryPanel />
                    <PayoutAccountCard bank={data.bank} onManage={openBankModal} />
                </div>
            </div>
            {bankModal}
        </>
    );
};

export default FinancialHub;
