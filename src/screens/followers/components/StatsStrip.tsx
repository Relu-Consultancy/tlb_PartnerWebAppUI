import React from 'react';
import { formatCount } from '../../../utils/format';
import { FollowerStats } from '../types';

interface StatsStripProps {
    stats: FollowerStats;
}

const Tile: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
    <div className="pt-card p-[16px_18px]">
        <p className="pt-eyebrow">{label}</p>
        <p className="pt-num text-[26px] mt-1">{value}</p>
        {note && <p className="text-[11.5px] text-tlb-muted mt-0.5">{note}</p>}
    </div>
);

/**
 * Three real numbers. Only the total is server-wide — the other two are derived
 * from the followers loaded so far, and say so rather than implying otherwise.
 */
export const StatsStrip: React.FC<StatsStripProps> = ({ stats }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Tile
            label="Followers"
            value={formatCount(stats.total)}
            note={stats.total === 1 ? 'person follows your brand' : 'people follow your brand'}
        />
        <Tile
            label="New · 30 days"
            value={`${formatCount(stats.newLast30)}${stats.newLast30Exact ? '' : '+'}`}
            note={stats.newLast30Exact ? 'followed you this month' : 'at least — load more to see the rest'}
        />
        <Tile
            label="Cities"
            value={formatCount(stats.cities)}
            note={stats.allLoaded ? 'where your followers are' : 'across the followers loaded so far'}
        />
    </div>
);
