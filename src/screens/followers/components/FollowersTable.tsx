import React from 'react';
import { ChevronRight } from 'lucide-react';
import { LoadMoreRow, Pill } from '../../../components/portal';
import { initialsOf, timeAgo } from '../../../utils/format';
import { isNewFollower } from '../model';
import { genderLabel } from '../presentation';
import { FollowerRow } from '../types';

const GRID_COLS = 'grid-cols-[minmax(0,1.7fr)_150px_150px_130px_44px]';

interface FollowersTableProps {
    rows: FollowerRow[];
    total: number;
    now: Date;
    onOpen: (row: FollowerRow) => void;
    onLoadMore: () => void;
}

/** Circle with the follower's initials — the portal's single amber accent, no per-person colours. */
export const FollowerAvatar: React.FC<{ name: string; size?: 'sm' | 'lg' }> = ({ name, size = 'sm' }) => (
    <span
        className={`${size === 'sm' ? 'w-9 h-9 text-[11.5px]' : 'w-14 h-14 text-[16px]'} rounded-full bg-tlb-amber-soft border border-tlb-amber-line text-tlb-gold flex items-center justify-center font-bold flex-none`}
        aria-hidden="true"
    >
        {initialsOf(name)}
    </span>
);

export const FollowersTable: React.FC<FollowersTableProps> = ({ rows, total, now, onOpen, onLoadMore }) => (
    <div className="pt-card overflow-x-auto">
        <div className={`min-w-[720px] grid ${GRID_COLS} gap-3.5 px-[18px] py-[11px] bg-tlb-chrome border-b border-tlb-line`}>
            {['Follower', 'City', 'Gender', 'Following since', ''].map((h, i) => (
                <span key={h || i} className="pt-eyebrow">
                    {h}
                </span>
            ))}
        </div>
        {rows.map((row) => (
            <div
                key={row.user_id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(row)}
                onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') onOpen(row);
                }}
                className={`min-w-[720px] grid ${GRID_COLS} gap-3.5 items-center px-[18px] py-[13px] border-b border-tlb-divider text-[13px] cursor-pointer hover:bg-tlb-highlight transition-colors`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <FollowerAvatar name={row.full_name} />
                    <div className="min-w-0 flex items-center gap-2">
                        <p className="font-bold text-tlb-ink truncate">{row.full_name}</p>
                        {isNewFollower(row, now) && <Pill tone="green">New</Pill>}
                    </div>
                </div>
                <span className="text-[12.5px] text-tlb-body truncate">{row.city || '—'}</span>
                <span className="text-[12.5px] text-tlb-sub">{genderLabel(row.gender) || '—'}</span>
                <span className="text-[12.5px] text-tlb-body">{timeAgo(row.followed_at) || '—'}</span>
                <span className="flex justify-end text-tlb-muted" aria-hidden="true">
                    <ChevronRight size={15} />
                </span>
            </div>
        ))}
        <LoadMoreRow shown={rows.length} total={total} noun="followers" onLoadMore={onLoadMore} />
    </div>
);
