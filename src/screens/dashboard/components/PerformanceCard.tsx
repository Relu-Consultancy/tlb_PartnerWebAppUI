import React from 'react';
import { PerformanceRow } from '../dashboardModel';
import { formatRupees } from '../../../utils/format';
import { Pill, PortalModal } from '../../../components/portal';

const GRID = 'grid grid-cols-[1.2fr_1fr_1.1fr_1.15fr] gap-2.5';

interface PerformanceCardProps {
    rows: PerformanceRow[];
    onOpenDetails: () => void;
    onManageListings: () => void;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({ rows, onOpenDetails, onManageListings }) => (
    <section className="pt-card px-5 pt-4 pb-3" aria-labelledby="perf-heading">
        <div className="flex items-center justify-between gap-3 mb-1.5">
            <h2 id="perf-heading" className="pt-h-sec">Performance by service</h2>
            {rows.length > 0 && <button type="button" onClick={onOpenDetails} className="pt-link">Full analytics →</button>}
        </div>

        {rows.length === 0 ? (
            <div className="py-6 text-center">
                <p className="text-[13px] text-tlb-sub">You haven’t added any services yet.</p>
                <button type="button" onClick={onManageListings} className="pt-btn pt-btn-y mt-3">Go to My listings</button>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <div className="min-w-[460px]" role="table" aria-label="Performance by service">
                    <div className={`${GRID} pt-2 pb-1.5 border-b border-tlb-divider`} role="row">
                        <span className="pt-lbl" role="columnheader">Service</span>
                        <span className="pt-lbl text-right" role="columnheader">Live listings</span>
                        <span className="pt-lbl text-right" role="columnheader">Demand met</span>
                        <span className="pt-lbl text-right" role="columnheader">Revenue</span>
                    </div>
                    {rows.map(row => (
                        <div key={row.entity} className={`${GRID} items-center py-2.5 border-b border-tlb-divider last:border-b-0`} role="row">
                            <span className="text-[13.5px] font-bold text-tlb-ink" role="cell">{row.entity}</span>
                            <div className="text-right" role="cell">
                                <span className="pt-num text-sm text-tlb-ink">{row.counts.live}</span>
                                <span className="text-[11.5px] text-tlb-muted"> of {row.counts.total}</span>
                                {row.counts.pending > 0 && (
                                    <div className="text-[10.5px] text-tlb-muted mt-px">{row.counts.pending} pending</div>
                                )}
                            </div>
                            <div className="text-right min-w-0" role="cell">
                                <div className="text-[12.5px] text-tlb-body truncate">{row.demand.primary}</div>
                                {row.demand.secondary && <div className="text-[10.5px] text-tlb-muted mt-px">{row.demand.secondary}</div>}
                            </div>
                            <div className="text-right" role="cell">
                                {row.revenue === null
                                    ? <span className="text-xs font-bold text-tlb-faint">Off-platform</span>
                                    : <span className="pt-num text-sm text-tlb-amber">{formatRupees(row.revenue)}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </section>
);

interface PerformanceModalProps {
    open: boolean;
    onClose: () => void;
    rows: PerformanceRow[];
    periodLabel: string;
    onOpenAnalytics: () => void;
}

export const PerformanceModal: React.FC<PerformanceModalProps> = ({ open, onClose, rows, periodLabel, onOpenAnalytics }) => (
    <PortalModal open={open} onClose={onClose} title="Performance summary" subtitle={periodLabel}>
        <div className="flex flex-col gap-2.5">
            {rows.map(row => (
                <div key={row.entity} className="rounded-xl bg-tlb-chrome border border-tlb-divider px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className="text-sm font-bold text-tlb-ink">{row.entity}</span>
                        <Pill tone="neutral">{row.mode}</Pill>
                        <span className="ml-auto text-[11px] text-tlb-muted">
                            {row.counts.live} live · {row.counts.pending} pending
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {row.metrics.map(metric => (
                            <div key={metric.label}>
                                <div className="text-[10.5px] text-tlb-muted">{metric.label}</div>
                                <div className={`pt-num text-[15px] ${metric.highlight ? 'text-tlb-amber' : 'text-tlb-ink'}`}>{metric.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <p className="text-[11px] text-tlb-muted mt-3">
            Revenue follows the selected period; tickets, occupancy and listing counts are all-time.
        </p>
        <button type="button" onClick={onOpenAnalytics} className="pt-btn pt-btn-d w-full mt-4">
            Open full analytics
        </button>
    </PortalModal>
);
