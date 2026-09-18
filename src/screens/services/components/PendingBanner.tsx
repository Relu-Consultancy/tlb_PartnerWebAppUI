import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { timeAgo, joinWithAmpersand } from '../../../utils/format';
import { ListingRow } from '../types';
import { ListingState } from '../../../api/portalSummary';

interface PendingBannerProps {
    rows: ListingRow[];
    onViewStatus: (status: ListingState) => void;
}

/**
 * The one top-of-page notice — real, actionable listing states only, never a
 * fabricated review queue. Rejected listings need a fix and resubmit, so they
 * outrank pending ones when both are present; the banner disappears entirely
 * once nothing needs the partner's attention.
 */
export const PendingBanner: React.FC<PendingBannerProps> = ({ rows, onViewStatus }) => {
    const rejected = rows.filter(r => r.state === 'rejected');
    if (rejected.length > 0) {
        const names = joinWithAmpersand(rejected.map(r => r.title));
        return (
            <div className="pt-card flex items-center gap-3.5 px-4 py-3.5 bg-tlb-red-soft border-tlb-red-soft">
                <div className="w-[30px] h-[30px] rounded-full bg-tlb-red flex items-center justify-center flex-none">
                    <AlertCircle size={15} strokeWidth={2.75} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-tlb-red-deep">
                        {rejected.length} {rejected.length === 1 ? 'listing needs' : 'listings need'} your attention
                    </p>
                    <p className="text-[12.5px] text-tlb-red-deep mt-0.5">
                        {names} {rejected.length === 1 ? 'was' : 'were'} rejected by the review team — fix the issue and resubmit.
                    </p>
                </div>
                <button type="button" onClick={() => onViewStatus('rejected')} className="pt-btn pt-btn-o flex-none">See review notes</button>
            </div>
        );
    }

    const pending = rows.filter(r => r.state === 'pending');
    if (pending.length === 0) return null;
    const names = joinWithAmpersand(pending.map(r => r.title));
    const oldest: string | null = pending.reduce((acc: string | null, r) => (!acc || (r.createdAt && r.createdAt < acc)) ? r.createdAt : acc, null);

    return (
        <div className="pt-card flex items-center gap-3.5 px-4 py-3.5 bg-tlb-cream border-tlb-cream-line">
            <div className="w-[30px] h-[30px] rounded-full bg-tlb-amber flex items-center justify-center flex-none">
                <Clock size={15} strokeWidth={2.75} className="text-tlb-ink" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-tlb-gold">
                    {pending.length} {pending.length === 1 ? 'listing is' : 'listings are'} pending approval
                </p>
                <p className="text-[12.5px] text-tlb-sub mt-0.5">
                    {names} {pending.length === 1 ? 'was' : 'were'} submitted {oldest ? timeAgo(oldest) : 'recently'} — TLB usually clears listings within 24 hours; you can keep editing while they wait.
                </p>
            </div>
            <button type="button" onClick={() => onViewStatus('pending')} className="pt-btn pt-btn-o flex-none">See pending listings</button>
        </div>
    );
};
