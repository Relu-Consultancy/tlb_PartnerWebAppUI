import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Screen } from '../../types';
import { SearchField } from '../../components/portal';
import { Skeleton } from '../../components/ui';
import { useFollowersData } from './useFollowersData';
import { followerStats } from './model';
import { GENDER_OPTIONS, ORDERING_OPTIONS } from './presentation';
import { FollowerFilters, FollowerOrdering, FollowerRow, GenderFilter } from './types';
import { StatsStrip } from './components/StatsStrip';
import { FollowersTable } from './components/FollowersTable';
import { FollowerDetailModal } from './components/FollowerDetailModal';

interface Props {
    onNavigate: (screen: Screen) => void;
}

const SkeletonBody: React.FC = () => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4" aria-busy="true" aria-label="Loading followers">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-72 rounded-[14px]" />
    </div>
);

export const Followers: React.FC<Props> = ({ onNavigate }) => {
    const [filters, setFilters] = useState<FollowerFilters>({ search: '', gender: '', ordering: 'newest' });
    const [selected, setSelected] = useState<FollowerRow | null>(null);
    const now = new Date();

    const data = useFollowersData(filters);
    const setFilter = <K extends keyof FollowerFilters>(key: K, value: FollowerFilters[K]) =>
        setFilters((prev) => ({ ...prev, [key]: value }));

    const openDetail = (row: FollowerRow) => {
        setSelected(row);
        data.openDetail(row.user_id);
    };
    const closeDetail = () => {
        setSelected(null);
        data.closeDetail();
    };

    if (data.loading && data.rows.length === 0 && !data.error) return <SkeletonBody />;

    const stats = followerStats(data.rows, data.total, filters.ordering, now);
    const isFiltered = filters.search.trim() !== '' || filters.gender !== '';

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                        <button
                            type="button"
                            onClick={() => onNavigate('HOME')}
                            className="text-tlb-link hover:text-tlb-gold transition-colors"
                        >
                            Dashboard
                        </button>
                        {' · '}Followers
                    </nav>
                    <h1 className="pt-h1 text-[24px]">Followers</h1>
                    <p className="text-[13.5px] text-tlb-sub mt-[3px] max-w-2xl">
                        People following your brand on the TLB app — they see your new listings first.
                    </p>
                </div>
                <button type="button" onClick={data.reload} disabled={data.loading} className="pt-btn pt-btn-o flex-none">
                    <RefreshCw size={13} className={data.loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <StatsStrip stats={stats} />

            <div className="flex items-center gap-2.5 flex-wrap">
                <SearchField
                    value={filters.search}
                    onChange={(value) => setFilter('search', value)}
                    placeholder="Search followers by name"
                />
                <select
                    value={filters.gender}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter('gender', e.target.value as GenderFilter)}
                    aria-label="Filter by gender"
                    className="pt-input py-2 text-[12.5px] w-auto"
                >
                    {GENDER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.ordering}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter('ordering', e.target.value as FollowerOrdering)}
                    aria-label="Sort followers"
                    className="pt-input py-2 text-[12.5px] w-auto"
                >
                    {ORDERING_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>

            {data.error ? (
                <div className="pt-card flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
                    <p className="pt-note bg-tlb-red-soft text-tlb-red-deep">{data.error}</p>
                    <button type="button" onClick={data.reload} className="pt-btn pt-btn-y">
                        Try again
                    </button>
                </div>
            ) : data.rows.length > 0 ? (
                <FollowersTable rows={data.rows} total={data.total} now={now} onOpen={openDetail} onLoadMore={data.loadMore} />
            ) : (
                <div className="pt-card flex flex-col items-center justify-center text-center py-16 px-6 gap-2">
                    <p className="text-sm font-bold text-tlb-sub">{isFiltered ? 'No followers match these filters' : 'No followers yet'}</p>
                    <p className="text-[13px] text-tlb-muted max-w-sm">
                        {isFiltered
                            ? 'Try a different name, or clear the gender filter.'
                            : 'When people follow your brand on the TLB app, they’ll appear here.'}
                    </p>
                </div>
            )}

            <FollowerDetailModal
                row={selected}
                detail={data.detail}
                loading={data.detailLoading}
                error={data.detailError}
                onClose={closeDetail}
            />
        </div>
    );
};

export default Followers;
