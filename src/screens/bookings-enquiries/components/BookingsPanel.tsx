import React, { useMemo, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { LoadMoreRow, Pill, ScopePills, SearchField, SegBar } from '../../../components/portal';
import { formatRupees } from '../../../utils/format';
import { BookingEntity, BookingEntry, BookingWhen } from '../types';
import { bookingStats, filterBookings, groupByListing, slotLabelOf } from '../model';
import { BOOKING_ENTITY_LABEL, BOOKING_ENTITY_TONE, bookingStatusMeta } from '../presentation';
import { GroupedList } from './GroupedList';

const PAGE_SIZE = 20;
const SERVICE_LABEL: Record<BookingEntity, string> = { Events: 'Events', Venues: 'Venues' };

const WHEN_OPTIONS: { key: BookingWhen; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
];

const CONTEXT_NOTE: Record<'all' | BookingEntity, string> = {
    all: 'Paid at checkout, nothing to confirm — Event tickets and ticketed Venue slots. Classes and Programs never appear here; they are enquiry-led.',
    Events: 'Event tickets — fixed price per seat, paid at checkout.',
    Venues: 'Venue slots — hybrid model: hourly and day slots are paid upfront here; custom or large hires arrive as enquiries.',
};

interface StatCardProps { label: string; value: string; valueClassName?: string; sub?: string }
const StatCard: React.FC<StatCardProps> = ({ label, value, valueClassName = '', sub }) => (
    <div className="pt-stat">
        <span className="pt-eyebrow">{label}</span>
        <div className={`pt-stat-n ${valueClassName}`}>{value}</div>
        {sub && <div className="text-[11.5px] text-tlb-muted mt-0.5">{sub}</div>}
    </div>
);

interface BookingsPanelProps {
    entries: BookingEntry[];
    availableEntities: BookingEntity[];
    now: Date;
    onOpen: (entry: BookingEntry) => void;
}

export const BookingsPanel: React.FC<BookingsPanelProps> = ({ entries, availableEntities, now, onOpen }) => {
    const [when, setWhen] = useState<BookingWhen>('upcoming');
    const [scope, setScope] = useState<BookingEntity | 'all'>('all');
    const [search, setSearch] = useState('');
    const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
    const [visible, setVisible] = useState(PAGE_SIZE);

    const stats = useMemo(() => bookingStats(entries), [entries]);
    const whenScoped = useMemo(
        () => filterBookings(entries, { when, scope: 'all', search: '' }, now),
        [entries, when, now],
    );
    const filtered = useMemo(
        () => filterBookings(entries, { when, scope, search }, now),
        [entries, when, scope, search, now],
    );
    const sorted = useMemo(
        () => [...filtered].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
        [filtered],
    );
    const visibleRows = sorted.slice(0, visible);
    const groups = useMemo(() => groupByListing(visibleRows), [visibleRows]);

    const resetPaging = () => setVisible(PAGE_SIZE);
    const whenCount = (w: BookingWhen) => filterBookings(entries, { when: w, scope: 'all', search: '' }, now).length;

    return (
        <div className="flex flex-col gap-4">
            <div className="pt-card grid grid-cols-2 sm:grid-cols-4 p-0 overflow-hidden">
                <StatCard label="Total bookings" value={String(stats.total)} />
                <StatCard label="Average value" value={formatRupees(stats.averageValue)} sub="per confirmed booking" />
                <StatCard label="Cancellations" value={String(stats.cancelledCount)} valueClassName="text-tlb-red-deep" sub={`${stats.cancelledPct.toFixed(1)}% of bookings`} />
                <StatCard label="Refunded" value={formatRupees(stats.refundedAmount)} sub={`${stats.refundedCount} refund${stats.refundedCount === 1 ? '' : 's'}`} />
            </div>

            <SegBar
                options={[
                    { key: 'all' as const, label: 'All bookings', count: whenScoped.length },
                    ...availableEntities.map(e => ({ key: e, label: SERVICE_LABEL[e], count: whenScoped.filter(b => b.entity === e).length })),
                ]}
                value={scope}
                onChange={v => { setScope(v); resetPaging(); }}
            />

            <div className="pt-note">
                <CircleAlert size={14} strokeWidth={2.75} className="text-tlb-link flex-none" aria-hidden="true" />
                {CONTEXT_NOTE[scope]}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="pt-eyebrow mr-0.5">When</span>
                <ScopePills options={WHEN_OPTIONS.map(o => ({ ...o, count: whenCount(o.key) }))} value={when} onChange={v => { setWhen(v); resetPaging(); }} />
                <div className="flex-1" />
                <SearchField value={search} onChange={v => { setSearch(v); resetPaging(); }} placeholder="Search customer, listing or reference" />
            </div>

            <div className="pt-card overflow-x-auto">
                {groups.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-14 text-center">
                        <p className="text-sm font-bold text-tlb-ink">No bookings here</p>
                        <p className="text-xs text-tlb-muted max-w-[260px]">
                            {search ? 'Try a different search.' : 'Nothing in this window right now.'}
                        </p>
                    </div>
                ) : (
                    <GroupedList<BookingEntry>
                        groups={groups}
                        expandedId={expandedListingId}
                        onToggle={id => setExpandedListingId(cur => cur === id ? null : id)}
                        entityLabel={e => BOOKING_ENTITY_LABEL[e as BookingEntity]}
                        entityTone={e => BOOKING_ENTITY_TONE[e as BookingEntity]}
                        countLabel={n => `${n} ${n === 1 ? 'booking' : 'bookings'}`}
                        minWidth={620}
                        columnHeader={
                            <div className="grid grid-cols-[1.1fr_1.4fr_0.9fr_0.7fr] gap-3.5 px-[17px] py-2.5 border-b border-tlb-line bg-tlb-chrome">
                                <span className="pt-lbl">Booking code</span>
                                <span className="pt-lbl">Customer &amp; slot</span>
                                <span className="pt-lbl">Amount</span>
                                <span className="pt-lbl text-right">Status</span>
                            </div>
                        }
                        renderRow={row => {
                            const meta = bookingStatusMeta(row);
                            return (
                                <button
                                    key={row.id}
                                    type="button"
                                    onClick={() => onOpen(row)}
                                    className="w-full grid grid-cols-[1.1fr_1.4fr_0.9fr_0.7fr] gap-3.5 items-center px-[17px] py-[13px] border-b border-tlb-divider hover:bg-tlb-highlight transition-colors text-left text-sm"
                                >
                                    <span className="min-w-0">
                                        <span className="pt-code inline-flex">{row.bookingReference || `BKG-${row.id}`}</span>
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block font-semibold text-tlb-ink truncate">{row.customerName}</span>
                                        <span className="block text-[11px] text-tlb-muted mt-px">{slotLabelOf(row.listingStartsAt, now)}</span>
                                    </span>
                                    <span className="pt-num text-tlb-ink">{formatRupees(row.amount)}</span>
                                    <span className="flex justify-end"><Pill tone={meta.tone}>{meta.label}</Pill></span>
                                </button>
                            );
                        }}
                    />
                )}
                <LoadMoreRow shown={Math.min(visible, filtered.length)} total={filtered.length} noun="bookings" onLoadMore={() => setVisible(v => v + PAGE_SIZE)} />
            </div>
        </div>
    );
};
