import React from 'react';
import { Star } from 'lucide-react';
// Restore alongside the two commented-out tiles below.
// import { Pill } from '../../../components/portal';
import { formatCount } from '../../../utils/format';
import { ReviewSummary } from '../model';

interface StatsStripProps {
    summary: ReviewSummary;
}

const Stars: React.FC<{ value: number }> = ({ value }) => (
    <span className="flex text-tlb-amber text-[13px]">
        {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={13} fill={i <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.5} />
        ))}
    </span>
);

/** Never claims a number the data doesn't support — see `reviewSummary`. */
const countNote = (summary: ReviewSummary): string => {
    if (summary.totalReviews == null) return 'Review totals aren’t available right now';
    const where = summary.scope === 'listing' ? 'on this listing' : 'on your listings';
    const base = `Across ${formatCount(summary.totalReviews)} review${summary.totalReviews === 1 ? '' : 's'} ${where}`;
    return summary.partialAverage ? `${base} · rating from the reviews loaded so far` : base;
};

export const StatsStrip: React.FC<StatsStripProps> = ({ summary }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Hidden for now — no backing API. Restore when business-level reviews exist.
        <div className="pt-card p-[16px_18px]">
            <div className="flex items-center justify-between">
                <span className="pt-eyebrow">Business rating</span>
                <Pill tone="neutral">Coming soon</Pill>
            </div>
            <p className="text-[12px] text-tlb-muted mt-2">No business-level review record exists yet — every review here is tied to a specific listing.</p>
        </div>
        */}
        <div className="pt-card p-[16px_18px]">
            <p className="pt-eyebrow">Listing rating</p>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="pt-num text-[26px]">{summary.avgRating != null ? summary.avgRating.toFixed(1) : '—'}</span>
                <Stars value={summary.avgRating ?? 0} />
            </div>
            <p className="text-[11.5px] text-tlb-muted mt-0.5">{countNote(summary)}</p>
        </div>
        {/* Hidden for now — no backing API. Restore when replying to reviews ships.
        <div className="pt-card p-[16px_18px]">
            <div className="flex items-center justify-between">
                <span className="pt-eyebrow">Awaiting a reply</span>
                <Pill tone="neutral">Coming soon</Pill>
            </div>
            <p className="text-[12px] text-tlb-muted mt-2">Replying to reviews isn't available from the API yet.</p>
        </div>
        */}
    </div>
);
