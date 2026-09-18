import React from 'react';
import { Star } from 'lucide-react';
import { Pill } from '../../../components/portal';
import { StatsReviews } from '../../../api/stats';
import { formatCount } from '../../../utils/format';

interface StatsStripProps {
    stats: StatsReviews | null;
}

const Stars: React.FC<{ value: number }> = ({ value }) => (
    <span className="flex text-tlb-amber text-[13px]">
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={13} fill={i <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.5} />
        ))}
    </span>
);

export const StatsStrip: React.FC<StatsStripProps> = ({ stats }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pt-card p-[16px_18px]">
            <div className="flex items-center justify-between">
                <span className="pt-eyebrow">Business rating</span>
                <Pill tone="neutral">Coming soon</Pill>
            </div>
            <p className="text-[12px] text-tlb-muted mt-2">No business-level review record exists yet — every review here is tied to a specific listing.</p>
        </div>
        <div className="pt-card p-[16px_18px]">
            <p className="pt-eyebrow">Listing rating</p>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="pt-num text-[26px]">{stats?.avg_rating != null ? stats.avg_rating.toFixed(1) : '—'}</span>
                <Stars value={stats?.avg_rating ?? 0} />
            </div>
            <p className="text-[11.5px] text-tlb-muted mt-0.5">Across {formatCount(stats?.total_reviews ?? 0)} reviews on your listings</p>
        </div>
        <div className="pt-card p-[16px_18px]">
            <div className="flex items-center justify-between">
                <span className="pt-eyebrow">Awaiting a reply</span>
                <Pill tone="neutral">Coming soon</Pill>
            </div>
            <p className="text-[12px] text-tlb-muted mt-2">Replying to reviews isn't available from the API yet.</p>
        </div>
    </div>
);
