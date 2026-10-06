import React from 'react';
import { Pill } from '../../../components/portal';
import { PHONE_QUERY, useMediaQuery } from '../../../hooks/useMediaQuery';
import { audienceLabel, capLabel, discountLabel, scopeLabel, usedLabel, windowLabel } from '../model';
import { COUPON_STATUS_META } from '../presentation';
import { CouponRow } from '../types';
import { RowActions } from './RowActions';

const GRID_COLS = 'grid-cols-[minmax(0,1.3fr)_120px_minmax(0,1.3fr)_150px_100px_120px_160px]';

interface CouponsTableProps {
    rows: CouponRow[];
    listingTitleOf: (id: string) => string | undefined;
    onOpen: (row: CouponRow) => void;
    onTogglePause: (row: CouponRow) => void;
}

/**
 * Phones get one card per coupon. The table needs ~1000px, so on a phone it
 * only scrolled sideways — a column and a half visible at a time.
 */
const CouponCards: React.FC<CouponsTableProps> = ({ rows, listingTitleOf, onOpen, onTogglePause }) => (
    <div className="pt-card divide-y divide-tlb-divider" aria-label="Coupons">
        {rows.map((row) => {
            const { scope } = scopeLabel(row, listingTitleOf);
            const status = COUPON_STATUS_META[row.status];
            return (
                <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(row)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') onOpen(row);
                    }}
                    className="flex flex-col gap-3 px-4 py-4 cursor-pointer hover:bg-tlb-highlight transition-colors"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <span className="pt-code max-w-full truncate inline-block align-top">{row.code}</span>
                            {row.description && <p className="text-[11.5px] text-tlb-muted truncate mt-1">{row.description}</p>}
                        </div>
                        <Pill tone={status.tone}>{status.label}</Pill>
                    </div>
                    <p className="text-[13px]">
                        <span className="font-bold text-tlb-ink text-[15px]">{discountLabel(row)}</span>
                        <span className="text-[11.5px] text-tlb-muted"> · {capLabel(row)}</span>
                    </p>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
                        <div className="min-w-0">
                            <dt className="pt-eyebrow">Applies to</dt>
                            <dd className="font-semibold text-tlb-ink truncate mt-0.5">{scope}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="pt-eyebrow">Who can use it</dt>
                            <dd className="text-tlb-body truncate mt-0.5">{audienceLabel(row)}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="pt-eyebrow">Used</dt>
                            <dd className="mt-0.5">
                                <span className="font-bold text-tlb-ink">{row.usage_count}</span>{' '}
                                <span className="text-tlb-muted">{usedLabel(row)}</span>
                            </dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="pt-eyebrow">Window</dt>
                            <dd className="text-tlb-sub mt-0.5">{windowLabel(row)}</dd>
                        </div>
                    </dl>
                    <RowActions row={row} onEdit={() => onOpen(row)} onTogglePause={() => onTogglePause(row)} align="start" />
                </div>
            );
        })}
    </div>
);

export const CouponsTable: React.FC<CouponsTableProps> = (props) =>
    useMediaQuery(PHONE_QUERY) ? <CouponCards {...props} /> : <CouponsWideTable {...props} />;

const CouponsWideTable: React.FC<CouponsTableProps> = ({ rows, listingTitleOf, onOpen, onTogglePause }) => (
    <div className="pt-card overflow-x-auto">
        <div className={`min-w-[1000px] grid ${GRID_COLS} gap-3.5 px-[18px] py-[11px] bg-tlb-chrome border-b border-tlb-line`}>
            {['Coupon', 'Discount', 'Applies to', 'Who can use it', 'Used', 'Window', 'Status'].map((h) => (
                <span key={h} className="pt-eyebrow">
                    {h}
                </span>
            ))}
        </div>
        {rows.map((row) => {
            const { scope, meta } = scopeLabel(row, listingTitleOf);
            return (
                <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(row)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') onOpen(row);
                    }}
                    className={`min-w-[1000px] grid ${GRID_COLS} gap-3.5 items-center px-[18px] py-[13px] border-b border-tlb-divider text-[13px] cursor-pointer hover:bg-tlb-highlight transition-colors`}
                >
                    <div className="min-w-0">
                        <span className="pt-code">{row.code}</span>
                        {row.description && <p className="text-[11.5px] text-tlb-muted truncate mt-1">{row.description}</p>}
                    </div>
                    <div>
                        <p className="font-bold text-tlb-ink">{discountLabel(row)}</p>
                        <p className="text-[11px] text-tlb-muted mt-0.5">{capLabel(row)}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-tlb-ink truncate">{scope}</p>
                        <p className="text-[11px] text-tlb-muted mt-0.5">{meta}</p>
                    </div>
                    <span className="text-[12.5px] text-tlb-body truncate">{audienceLabel(row)}</span>
                    <div>
                        <p className="font-bold text-tlb-ink">{row.usage_count}</p>
                        <p className="text-[11px] text-tlb-muted mt-0.5">{usedLabel(row)}</p>
                    </div>
                    <span className="text-[12px] text-tlb-sub">{windowLabel(row)}</span>
                    <div className="flex items-center gap-2">
                        <Pill tone={COUPON_STATUS_META[row.status].tone}>{COUPON_STATUS_META[row.status].label}</Pill>
                        <RowActions row={row} onEdit={() => onOpen(row)} onTogglePause={() => onTogglePause(row)} />
                    </div>
                </div>
            );
        })}
    </div>
);
