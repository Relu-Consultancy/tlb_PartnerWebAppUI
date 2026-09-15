import React from 'react';
import { InAppNotification } from '../../../api/notifications';
import { timeAgo } from '../../../utils/format';

interface RecentActivityProps {
    items: InAppNotification[];
    onOpen: (item: InAppNotification) => void;
    onViewAll: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ items, onOpen, onViewAll }) => (
    <section className="pt-card px-5 py-4" aria-labelledby="activity-heading">
        <div className="flex items-center justify-between gap-3 mb-1">
            <h2 id="activity-heading" className="pt-h-sec">Recent activity</h2>
            <button type="button" onClick={onViewAll} className="pt-link">View all →</button>
        </div>
        {items.length === 0 ? (
            <p className="text-[13px] text-tlb-muted py-2">Bookings, enquiries and alerts will show up here.</p>
        ) : (
            <ul>
                {items.map(item => (
                    <li key={item.id} className="border-b border-tlb-divider last:border-b-0">
                        <button
                            type="button"
                            onClick={() => onOpen(item)}
                            className="w-full flex items-center gap-3 py-[5px] text-left hover:bg-tlb-highlight transition-colors"
                        >
                            <span className={`flex-1 min-w-0 truncate text-[13px] ${item.is_read ? 'text-tlb-body' : 'font-semibold text-tlb-ink'}`}>
                                {item.title}
                            </span>
                            <span className="text-[11.5px] text-tlb-muted whitespace-nowrap">{timeAgo(item.created_at)}</span>
                        </button>
                    </li>
                ))}
            </ul>
        )}
    </section>
);
