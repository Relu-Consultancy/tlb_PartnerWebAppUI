import React, { useMemo, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { LoadMoreRow, Pill, SearchField, SegBar } from '../../../components/portal';
import { formatCount, formatRupees } from '../../../utils/format';
import { BookingEntry } from '../types';
import { filterRefunds, RefundFilter, refundSummary } from '../model';
import { REFUND_STATUS_META, cancelledOnLabel } from '../presentation';
import { StatCard } from './StatCard';

const PAGE_SIZE = 20;

interface RefundsPanelProps {
    entries: BookingEntry[];
    onOpen: (entry: BookingEntry) => void;
    /** Failed refunds are processed manually by TLB — this opens Help & Support. */
    onContactSupport: () => void;
}

/**
 * Where every refund on the partner's bookings stands right now, from the
 * list's `refund_status`. The timeline (requested / settled / failed dates)
 * stays in the booking detail — a row opens it.
 */
export const RefundsPanel: React.FC<RefundsPanelProps> = ({ entries, onOpen, onContactSupport }) => {
    const [filter, setFilter] = useState<RefundFilter>('all');
    const [search, setSearch] = useState('');
    const [visible, setVisible] = useState(PAGE_SIZE);

    const summary = useMemo(() => refundSummary(entries), [entries]);
    const rows = useMemo(() => filterRefunds(entries, filter, search), [entries, filter, search]);
    const shown = rows.slice(0, visible);
    const resetPaging = () => setVisible(PAGE_SIZE);
    const plural = (n: number) => (n === 1 ? '' : 's');

    return (
        <div className="flex flex-col gap-4">
            <div className="pt-card grid grid-cols-1 sm:grid-cols-3 p-0 overflow-hidden">
                <StatCard
                    label="Needs attention"
                    value={formatCount(summary.attention.count)}
                    valueClassName={summary.attention.count > 0 ? 'text-tlb-red-deep' : ''}
                    sub={`${formatRupees(summary.attention.amount)} not yet returned`}
                />
                <StatCard
                    label="In progress"
                    value={formatCount(summary.in_progress.count)}
                    sub={`${formatRupees(summary.in_progress.amount)} · usually 3–7 days`}
                />
                <StatCard
                    label="Refunded"
                    value={formatCount(summary.settled.count)}
                    valueClassName={summary.settled.count > 0 ? 'text-tlb-green' : ''}
                    sub={`${formatRupees(summary.settled.amount)} back with customers`}
                />
            </div>

            {summary.attention.count > 0 && (
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep flex-wrap" role="status">
                    <CircleAlert size={14} strokeWidth={2.75} className="flex-none mt-0.5" aria-hidden="true" />
                    <span className="flex-1 min-w-[200px]">
                        <strong className="font-bold">
                            {summary.attention.count} refund{plural(summary.attention.count)} failed
                        </strong>{' '}
                        — {summary.attention.count === 1 ? 'that customer hasn’t' : 'those customers haven’t'} been paid back. The TLB team
                        processes failed refunds manually; raise a ticket with the booking reference.
                    </span>
                    <button type="button" onClick={onContactSupport} className="pt-btn pt-btn-o pt-btn-sm flex-none">
                        Contact support
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2.5 flex-wrap">
                <SegBar
                    options={[
                        { key: 'all' as const, label: 'All refunds', count: summary.total },
                        { key: 'attention' as const, label: 'Needs attention', count: summary.attention.count },
                        { key: 'in_progress' as const, label: 'In progress', count: summary.in_progress.count },
                        { key: 'settled' as const, label: 'Refunded', count: summary.settled.count },
                    ]}
                    value={filter}
                    onChange={(v) => {
                        setFilter(v);
                        resetPaging();
                    }}
                />
                <div className="hidden sm:block flex-1" />
                <SearchField
                    value={search}
                    onChange={(v) => {
                        setSearch(v);
                        resetPaging();
                    }}
                    placeholder="Search customer, listing or reference"
                />
            </div>

            <div className="pt-card">
                {rows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-14 px-6 text-center">
                        <p className="text-sm font-bold text-tlb-ink">
                            {summary.total === 0 ? 'No refunds yet' : 'No refunds in this view'}
                        </p>
                        <p className="text-xs text-tlb-muted max-w-[320px]">
                            {summary.total === 0
                                ? 'When a paid booking is cancelled, its refund shows here until the money is back with the customer.'
                                : search
                                  ? 'Try a different search.'
                                  : 'Nothing here right now.'}
                        </p>
                    </div>
                ) : (
                    shown.map((row) => {
                        const meta = REFUND_STATUS_META[row.refundStatus!];
                        const cancelled = cancelledOnLabel(row.cancelledAt);
                        return (
                            <button
                                key={row.id}
                                type="button"
                                onClick={() => onOpen(row)}
                                className="w-full flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 px-[17px] py-[13px] border-b border-tlb-divider text-left text-sm hover:bg-tlb-highlight transition-colors"
                            >
                                <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                                    <span className="flex items-center gap-2 flex-wrap">
                                        <span className="pt-code">{row.bookingReference || `BKG-${row.id}`}</span>
                                        <span className="font-semibold text-tlb-ink truncate">{row.customerName}</span>
                                    </span>
                                    <span className="block text-[11.5px] text-tlb-muted truncate mt-1">
                                        {row.listingTitle}
                                        {cancelled ? ` · Cancelled ${cancelled}` : ''}
                                    </span>
                                </span>
                                <span className="pt-num text-tlb-ink sm:w-[96px] sm:text-right flex-none">
                                    {formatRupees(row.refundAmount ?? row.amount)}
                                </span>
                                <span className="flex flex-col items-start sm:items-end sm:w-[230px] flex-none">
                                    <Pill tone={meta.tone}>{meta.label}</Pill>
                                    {meta.sub && <span className="text-[11px] text-tlb-muted mt-1">{meta.sub}</span>}
                                </span>
                            </button>
                        );
                    })
                )}
                {rows.length > 0 && (
                    <LoadMoreRow
                        shown={Math.min(visible, rows.length)}
                        total={rows.length}
                        noun="refunds"
                        onLoadMore={() => setVisible((v) => v + PAGE_SIZE)}
                    />
                )}
            </div>
        </div>
    );
};
