import React from 'react';
import { CalendarClock, Download } from 'lucide-react';
import { downloadTextFile } from '../../../utils/download';
import { buildBookingEntriesCsv } from '../csv';
import { SoonSummary } from '../model';

/** Cream banner — bookings for listings starting today/tomorrow, with a CSV export. */
export const SoonBookingsBanner: React.FC<{ soon: SoonSummary }> = ({ soon }) => {
    const label = `${soon.todayCount} booking${soon.todayCount === 1 ? '' : 's'} today, ${soon.tomorrowCount} tomorrow — download the list before doors open.`;
    return (
        <div className="pt-card flex items-center gap-3 px-4 py-2.5 bg-tlb-cream border-tlb-cream-line">
            <CalendarClock size={15} strokeWidth={2.75} className="text-tlb-gold flex-none" aria-hidden="true" />
            <span className="flex-1 text-[12.5px] text-tlb-ink">{label}</span>
            <button
                type="button"
                onClick={() => downloadTextFile(`tlb-bookings-soon-${Date.now()}.csv`, buildBookingEntriesCsv(soon.rows))}
                className="pt-btn pt-btn-o flex-none"
            >
                <Download size={13} strokeWidth={2.75} /> Download list
            </button>
        </div>
    );
};
