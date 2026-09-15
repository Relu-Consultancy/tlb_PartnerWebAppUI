import React from 'react';
import { LISTING_STATUS_META, Pill } from '../../../components/portal';
import { slotLabelOf } from '../../../utils/format';
import { ListingDemand, ListingRow } from '../types';
import { SERVICE_LABEL, SERVICE_TONE, MODEL_LABEL } from '../presentation';
import { RowActions } from './RowActions';

const GRID_COLS = 'grid-cols-[minmax(0,1.7fr)_92px_92px_84px_92px_112px_92px_160px]';

interface ListingsTableProps {
    rows: ListingRow[];
    demandOf: (row: ListingRow) => ListingDemand;
    now: Date;
    onOpen: (row: ListingRow) => void;
    onEdit: (row: ListingRow) => void;
    onTogglePause: (row: ListingRow) => void;
    onToggleArchive: (row: ListingRow) => void;
}

const nextSlotLabel = (row: ListingRow, now: Date): string => {
    if (!row.enriched) return '…';
    if (row.state !== 'live' && row.state !== 'pending') return '—';
    return slotLabelOf(row.startsAt, now);
};

export const ListingsTable: React.FC<ListingsTableProps> = ({ rows, demandOf, now, onOpen, onEdit, onTogglePause, onToggleArchive }) => (
    <div className="pt-card overflow-x-auto">
        <div className={`min-w-[900px] grid ${GRID_COLS} gap-3.5 px-[18px] py-[11px] bg-tlb-chrome border-b border-tlb-line`}>
            {['Listing', 'Code', 'Service', 'Model', 'Price', 'Next slot', 'Demand', 'Status'].map(h => (
                <span key={h} className="pt-eyebrow">{h}</span>
            ))}
        </div>
        {rows.map(row => {
            const demand = row.enriched ? demandOf(row) : null;
            return (
                <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(row)}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') onOpen(row); }}
                    className={`min-w-[900px] grid ${GRID_COLS} gap-3.5 items-center px-[18px] py-[13px] border-b border-tlb-divider text-[13px] cursor-pointer hover:bg-tlb-highlight transition-colors`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-[10px] bg-tlb-hover border border-tlb-line flex-none overflow-hidden">
                            {row.coverUrl && <img src={row.coverUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-tlb-ink truncate">{row.title}</p>
                            <p className="text-[11.5px] text-tlb-muted truncate mt-0.5">
                                {row.location}{row.capacityLabel !== '—' ? ` · ${row.capacityLabel}` : ''}
                            </p>
                        </div>
                    </div>
                    <span className="pt-code">{row.code}</span>
                    <div><Pill tone={SERVICE_TONE[row.entityType]}>{SERVICE_LABEL[row.entityType]}</Pill></div>
                    <span className="text-[12.5px] text-tlb-sub">{MODEL_LABEL[row.model]}</span>
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
