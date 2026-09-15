import React from 'react';
import { Pill } from '../../../components/portal';
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

export const CouponsTable: React.FC<CouponsTableProps> = ({ rows, listingTitleOf, onOpen, onTogglePause }) => (
    <div className="pt-card overflow-x-auto">
        <div className={`min-w-[1000px] grid ${GRID_COLS} gap-3.5 px-[18px] py-[11px] bg-tlb-chrome border-b border-tlb-line`}>
            {['Coupon', 'Discount', 'Applies to', 'Who can use it', 'Used', 'Window', 'Status'].map(h => (
                <span key={h} className="pt-eyebrow">{h}</span>
            ))}
        </div>
        {rows.map(row => {
            const { scope, meta } = scopeLabel(row, listingTitleOf);
            return (
                <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(row)}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') onOpen(row); }}
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
