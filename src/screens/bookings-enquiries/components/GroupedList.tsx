import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Tone, Pill } from '../../../components/portal';
import { ListingGroup } from '../types';

interface GroupedListProps<T> {
    groups: ListingGroup<T>[];
    expandedId: string | null;
    onToggle: (listingId: string) => void;
    entityLabel: (entity: ListingGroup<T>['entity']) => string;
    entityTone: (entity: ListingGroup<T>['entity']) => Tone;
    /** "3 enquiries" / "2 bookings" */
    countLabel: (count: number) => string;
    renderRow: (row: T, index: number) => React.ReactNode;
    /** Column header row shown once above every group (bookings' table headers). */
    columnHeader?: React.ReactNode;
    /** Minimum content width before the table scrolls horizontally. */
    minWidth?: number;
}

/** Rows collapsed under a listing header — shared by the Enquiries and Bookings tables. */
export function GroupedList<T>({
    groups,
    expandedId,
    onToggle,
    entityLabel,
    entityTone,
    countLabel,
    renderRow,
    columnHeader,
    minWidth = 0,
}: GroupedListProps<T>) {
    return (
        <div style={minWidth ? { minWidth } : undefined}>
            {columnHeader}
            {groups.map((group) => {
                const expanded = expandedId === group.listingId;
                return (
                    <div key={group.listingId}>
                        <button type="button" className="pt-group-head" aria-expanded={expanded} onClick={() => onToggle(group.listingId)}>
                            <ChevronRight size={12} strokeWidth={3} className="pt-group-caret" aria-hidden="true" />
                            {/* A long program name used to push the pill and the count past the
                                card's edge; it now truncates and the rest keeps its place. */}
                            <span className="min-w-0 truncate text-[12.5px] font-bold text-tlb-ink" title={group.listingTitle}>
                                {group.listingTitle}
                            </span>
                            <Pill tone={entityTone(group.entity)} className="flex-none">
                                {entityLabel(group.entity)}
                            </Pill>
                            <span className="ml-auto flex-none text-[11px] text-tlb-muted whitespace-nowrap">
                                {countLabel(group.rows.length)}
                            </span>
                        </button>
                        {expanded && group.rows.map((row, i) => renderRow(row, i))}
                    </div>
                );
            })}
        </div>
    );
}
