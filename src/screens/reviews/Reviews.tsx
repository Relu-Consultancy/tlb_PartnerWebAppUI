import React, { useState } from 'react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { SegBar } from '../../components/portal';
import { Skeleton } from '../../components/ui';
import { useReviewsData } from './useReviewsData';
import { ReviewTab } from './types';
import { StatsStrip } from './components/StatsStrip';
import { ReviewsList } from './components/ReviewsList';

interface Props {
    onNavigate: (screen: Screen) => void;
}

const SkeletonBody: React.FC = () => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4" aria-busy="true" aria-label="Loading reviews">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-72 rounded-[14px]" />
    </div>
);

export const Reviews: React.FC<Props> = ({ onNavigate }) => {
    const { allowedEntities } = usePartner();
    const [tab, setTab] = useState<ReviewTab>('all');
    const [listingId, setListingId] = useState('all');

    const data = useReviewsData(allowedEntities, tab, listingId);

    const tabOptions = [
        { key: 'all' as ReviewTab, label: 'All', count: undefined },
        { key: 'business' as ReviewTab, label: 'Business', count: 0 },
        { key: 'listing' as ReviewTab, label: 'Listings', count: data.stats?.total_reviews },
        { key: 'unanswered' as ReviewTab, label: 'Awaiting reply', count: undefined },
    ];

    if (data.loading && data.reviews.length === 0 && !data.stats) return <SkeletonBody />;

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
            <div>
                <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                    <button type="button" onClick={() => onNavigate('HOME')} className="text-tlb-link hover:text-tlb-gold transition-colors">Dashboard</button>
                    {' · '}Reviews
                </nav>
                <h1 className="pt-h1 text-[24px]">Reviews</h1>
                <p className="text-[13.5px] text-tlb-sub mt-[3px]">Your overall business rating, plus reviews left on individual listings</p>
            </div>

            <StatsStrip stats={data.stats} />

            <div className="flex items-center gap-2.5 flex-wrap">
                <SegBar options={tabOptions} value={tab} onChange={setTab} />
                {tab !== 'business' && tab !== 'unanswered' && data.listings.length > 0 && (
                    <select
                        value={listingId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setListingId(e.target.value)}
                        className="pt-input py-2 text-[12.5px] w-auto"
                    >
                        <option value="all">All listings</option>
                        {data.listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                    </select>
                )}
            </div>

            {data.error ? (
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{data.error}</div>
            ) : (
                <ReviewsList tab={tab} reviews={data.reviews} total={data.total} loading={data.loading} onLoadMore={data.loadMore} />
            )}
        </div>
    );
};

export default Reviews;
