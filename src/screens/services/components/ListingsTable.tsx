import React from 'react';
import { LISTING_STATUS_META, Pill } from '../../../components/portal';
import { PHONE_QUERY, useMediaQuery } from '../../../hooks/useMediaQuery';
import { ListingDemand, ListingRow } from '../types';
import { SERVICE_LABEL, SERVICE_TONE, MODEL_LABEL, refundTagMeta } from '../presentation';
import { nextSlotLabel } from '../model';
import { RowActions } from './RowActions';

// The listing column never drops below 180px. With eight columns, seven of
// them fixed, it used to be whatever was left — about 40px on a laptop, so
// titles shrank to their first letter and "Non-refundable" spilled over the
// code. The code now sits under the title and the model under the service.
const GRID_COLS = 'grid-cols-[minmax(180px,1fr)_104px_88px_104px_92px_160px]';

interface ListingsTableProps {
    rows: ListingRow[];
    demandOf: (row: ListingRow) => ListingDemand;
    now: Date;
    onOpen: (row: ListingRow) => void;
    onEdit: (row: ListingRow) => void;
    onTogglePause: (row: ListingRow) => void;
    onToggleArchive: (row: ListingRow) => void;
}

const Thumb: React.FC<{ row: ListingRow; size: string }> = ({ row, size }) => (
    <div className={`${size} rounded-[10px] bg-tlb-hover border border-tlb-line flex-none overflow-hidden`}>
        {row.coverUrl && <img src={row.coverUrl} alt="" className="w-full h-full object-cover" />}
    </div>
);

const RefundTag: React.FC<{ row: ListingRow }> = ({ row }) =>
    row.enriched && !row.isRefundable ? (
        <Pill tone={refundTagMeta(row.isRefundable).tone}>{refundTagMeta(row.isRefundable).label}</Pill>
    ) : null;

const placeLine = (row: ListingRow) => `${row.location}${row.capacityLabel !== '—' ? ` · ${row.capacityLabel}` : ''}`;

/** Phones get one card per listing — the full title, never a sliver of a column. */
const ListingCards: React.FC<ListingsTableProps> = ({ rows, demandOf, now, onOpen, onEdit, onTogglePause, onToggleArchive }) => (
    <div className="pt-card divide-y divide-tlb-divider" aria-label="Listings">
        {rows.map((row) => {
            const demand = row.enriched ? demandOf(row) : null;
            const status = LISTING_STATUS_META[row.state];
            return (
                <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(row)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') onOpen(row);
                    }}
                    className="flex gap-3 px-4 py-4 cursor-pointer hover:bg-tlb-highlight transition-colors"
                >
                    <Thumb row={row} size="w-14 h-14" />
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-tlb-ink text-[14px] leading-snug line-clamp-2 break-words">{row.title}</p>
                            <Pill tone={status.tone}>{status.label}</Pill>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="pt-code">{row.code}</span>
                            <Pill tone={SERVICE_TONE[row.entityType]}>{SERVICE_LABEL[row.entityType]}</Pill>
                            <RefundTag row={row} />
                        </div>
                        <p className="text-[12.5px] text-tlb-sub">
                            {MODEL_LABEL[row.model]} · <span className="font-bold text-tlb-ink">{row.priceLabel}</span>
                        </p>
                        <p className="text-[11.5px] text-tlb-muted">
                            Next: {nextSlotLabel(row, now)} ·{' '}
                            <span className="font-semibold text-tlb-body">{demand ? demand.label : '…'}</span>
                        </p>
                        <RowActions
                            row={row}
                            onEdit={() => onEdit(row)}
                            onTogglePause={() => onTogglePause(row)}
                            onToggleArchive={() => onToggleArchive(row)}
                        />
                    </div>
                </div>
            );
        })}
    </div>
);

const ListingsWideTable: React.FC<ListingsTableProps> = ({ rows, demandOf, now, onOpen, onEdit, onTogglePause, onToggleArchive }) => (
    <div className="pt-card overflow-x-auto">
        <div className={`min-w-[820px] grid ${GRID_COLS} gap-3 px-[18px] py-[11px] bg-tlb-chrome border-b border-tlb-line`}>
            {['Listing', 'Service', 'Price', 'Next slot', 'Demand', 'Status'].map((h) => (
                <span key={h} className="pt-eyebrow">
                    {h}
                </span>
            ))}
        </div>
        {rows.map((row) => {
            const demand = row.enriched ? demandOf(row) : null;
            return (
                <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(row)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') onOpen(row);
                    }}
                    className={`min-w-[820px] grid ${GRID_COLS} gap-3 items-center px-[18px] py-[13px] border-b border-tlb-divider text-[13px] cursor-pointer hover:bg-tlb-highlight transition-colors`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <Thumb row={row} size="w-11 h-11" />
                        <div className="min-w-0">
                            <p className="font-bold text-tlb-ink leading-snug line-clamp-2 break-words" title={row.title}>
                                {row.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="pt-code">{row.code}</span>
                                <RefundTag row={row} />
                            </div>
                            <p className="text-[11.5px] text-tlb-muted truncate mt-1">{placeLine(row)}</p>
                        </div>
                    </div>
                    <div>
                        <Pill tone={SERVICE_TONE[row.entityType]}>{SERVICE_LABEL[row.entityType]}</Pill>
                        <p className="text-[11.5px] text-tlb-sub mt-1">{MODEL_LABEL[row.model]}</p>
                    </div>
                    <span className="font-bold text-tlb-ink">{row.priceLabel}</span>
                    <span className="text-[12.5px] text-tlb-body">{nextSlotLabel(row, now)}</span>
                    <span className="font-bold text-tlb-ink">{demand ? demand.label : '…'}</span>
                    <div className="flex items-center gap-2">
                        <Pill tone={LISTING_STATUS_META[row.state].tone}>{LISTING_STATUS_META[row.state].label}</Pill>
                        <RowActions
                            row={row}
                            onEdit={() => onEdit(row)}
                            onTogglePause={() => onTogglePause(row)}
                            onToggleArchive={() => onToggleArchive(row)}
                        />
                    </div>
                </div>
            );
        })}
    </div>
);

export const ListingsTable: React.FC<ListingsTableProps> = (props) =>
    useMediaQuery(PHONE_QUERY) ? <ListingCards {...props} /> : <ListingsWideTable {...props} />;
