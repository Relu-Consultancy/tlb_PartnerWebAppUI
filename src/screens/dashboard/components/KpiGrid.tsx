import React from 'react';
import { KpiModel } from '../dashboardModel';
import { formatCount, formatRupeesCompact } from '../../../utils/format';

interface KpiCardProps {
    label: string;
    value: string;
    sub: React.ReactNode;
    valueClassName?: string;
    busy?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, valueClassName = 'text-tlb-ink', busy = false }) => (
    <div className="pt-card px-[15px] py-[13px] min-w-0" aria-busy={busy}>
        <span className="pt-lbl">{label}</span>
        <div className={`pt-num text-[25px] leading-tight mt-[7px] transition-opacity ${busy ? 'opacity-40' : ''} ${valueClassName}`}>
            {value}
        </div>
        <div className="text-[11px] mt-1 truncate">{sub}</div>
    </div>
);

export const KpiGrid: React.FC<{ kpis: KpiModel; revenueLoading: boolean }> = ({ kpis, revenueLoading }) => {
    const { listings, enquiries, bookings, revenue } = kpis;
    return (
        <div className="grid grid-cols-2 gap-2.5">
            <KpiCard
                label="Total listings"
                value={formatCount(listings.total)}
                sub={<span className="text-tlb-muted">{listings.live} live · {listings.pending} pending approval</span>}
            />
            <KpiCard
                label="Enquiries"
                value={formatCount(enquiries.received)}
                sub={enquiries.unanswered > 0
                    ? <span className="font-bold text-tlb-red">{enquiries.unanswered} still unanswered</span>
                    : <span className="text-tlb-muted">All caught up</span>}
            />
            <KpiCard
                label="Bookings"
                value={bookings.confirmed === null ? '—' : formatCount(bookings.confirmed)}
                busy={revenueLoading}
                sub={bookings.today
                    ? <span className="font-bold text-tlb-green">▲ +{bookings.today} today</span>
                    : <span className="text-tlb-muted">Confirmed bookings</span>}
            />
            <KpiCard
                label="Revenue"
                value={revenue.gross === null ? '—' : formatRupeesCompact(revenue.gross)}
                valueClassName="text-tlb-amber"
                busy={revenueLoading}
                sub={<span className="text-tlb-muted">{revenue.sources}</span>}
            />
        </div>
    );
};
