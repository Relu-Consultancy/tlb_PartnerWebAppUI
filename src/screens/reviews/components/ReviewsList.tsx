import React from 'react';
import { Star } from 'lucide-react';
import { Pill, LoadMoreRow } from '../../../components/portal';
import { PartnerReview } from '../../../api/reviews';
import { timeAgo } from '../../../utils/format';
import { ReviewTab } from '../types';
import { LISTING_TAG_TONE } from '../presentation';

interface ReviewsListProps {
    tab: ReviewTab;
    reviews: PartnerReview[];
    total: number;
    loading: boolean;
    onLoadMore: () => void;
}

const Stars: React.FC<{ value: number }> = ({ value }) => (
    <span className="flex text-tlb-amber text-[12.5px]">
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={12} fill={i <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.5} />
        ))}
    </span>
);

const ComingSoonPanel: React.FC<{ text: string }> = ({ text }) => (
    <div className="pt-card flex flex-col items-center justify-center text-center py-16 px-6 gap-2">
        <Pill tone="neutral">Coming soon</Pill>
        <p className="text-[13px] text-tlb-muted max-w-sm">{text}</p>
    </div>
);

export const ReviewsList: React.FC<ReviewsListProps> = ({ tab, reviews, total, loading, onLoadMore }) => {
    if (tab === 'business') {
        return <ComingSoonPanel text="Business-level reviews aren't a concept this API tracks — every review it returns is tied to one of your listings." />;
    }
    if (tab === 'unanswered') {
        return <ComingSoonPanel text="Replying to a review, and tracking which ones are still awaiting a reply, isn't available from the API yet." />;
    }
    if (!loading && reviews.length === 0) {
        return <ComingSoonPanel text="No reviews yet." />;
    }
    return (
        <div className="pt-card overflow-hidden">
            {reviews.map(r => (
                <div key={r.id} className="px-[18px] py-4 border-b border-tlb-divider last:border-b-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[13.5px] font-bold text-tlb-ink">{r.reviewer_name}</span>
                        <Stars value={r.rating} />
                        <Pill tone={LISTING_TAG_TONE}>{r.listing_title || 'Listing'}</Pill>
                        <div className="flex-1" />
                        <span className="text-[11px] text-tlb-faint">{timeAgo(r.created_at) || '—'}</span>
                    </div>
                    {r.comment && <p className="text-[13px] text-tlb-body mt-1.5 leading-relaxed">{r.comment}</p>}
                </div>
            ))}
            <LoadMoreRow shown={reviews.length} total={total} noun="reviews" onLoadMore={onLoadMore} />
        </div>
    );
};
