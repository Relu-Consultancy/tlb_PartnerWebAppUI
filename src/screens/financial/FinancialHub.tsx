import React, { useState } from 'react';
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
import { UpdateBankPayload } from '../../api/banking';

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
    const data = useRevenueData(dateRange);

    if (data.loading) return <SkeletonBody />;

    const verticals = verticalAmounts(data.revenue?.revenue_by_type || []);
    const periodPhrase = getDateRangeOption(dateRange).phrase;

    const handleSave = async (payload: UpdateBankPayload, cheque?: File) => {
        const ok = await data.saveBank(payload, cheque);
        if (ok) toast.success('Bank details saved. Verification is pending.');
        else toast.error('Couldn’t save bank details. Please try again.');
        return ok;
    };

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
            <div>
                <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                    <button type="button" onClick={() => onNavigate('HOME')} className="text-tlb-link hover:text-tlb-gold transition-colors">Dashboard</button>
                    {' · '}Revenue &amp; payouts
                </nav>
                <h1 className="pt-h1 text-[24px]">Revenue &amp; payouts</h1>
                <p className="text-[13.5px] text-tlb-sub mt-[3px]">What you've earned, what's on the way, and where it lands</p>
            </div>

            <StatsStrip revenue={data.revenue} periodPhrase={periodPhrase} />

            <div className="pt-card p-[16px_20px]">
                <p className="pt-h-sec mb-2.5">Revenue by vertical</p>
                <RevenueByVertical verticals={verticals} />
            </div>

            <LedgerPanel />

            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3.5">
                <PayoutHistoryPanel />
                <PayoutAccountCard bank={data.bank} onManage={() => setModalOpen(true)} />
            </div>

            <BankDetailsModal open={modalOpen} bank={data.bank} onClose={() => setModalOpen(false)} onSave={handleSave} />
        </div>
    );
};

export default FinancialHub;
