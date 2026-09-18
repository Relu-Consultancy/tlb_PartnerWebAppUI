import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { Skeleton } from '../../components/ui';
import { downloadTextFile } from '../../utils/download';
import { formatCount, formatRupees } from '../../utils/format';
import { useEnquiriesData } from './useEnquiriesData';
import { useBookingsData } from './useBookingsData';
import { BookingEntity, BookingEntry, EnquiryEntry } from './types';
import { bookingStats, enquiryStats, soonBookings } from './model';
import { buildBookingEntriesCsv, buildEnquiriesCsv } from './csv';
import { EnquiriesPanel } from './components/EnquiriesPanel';
import { BookingsPanel } from './components/BookingsPanel';
import { SoonBookingsBanner } from './components/SoonBookingsBanner';
import { EnquiryDetailModal } from './components/EnquiryDetailModal';
import { BookingDetailModal } from './components/BookingDetailModal';

interface Props {
    onNavigate: (screen: Screen) => void;
}

type Tab = 'enquiries' | 'bookings';

const SkeletonBody: React.FC = () => (
    <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4" aria-busy="true" aria-label="Loading bookings and enquiries">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-72 rounded-[14px]" />
        <Skeleton className="h-72 rounded-[14px]" />
    </div>
);

export const BookingsEnquiries: React.FC<Props> = ({ onNavigate }) => {
    const { allowedEntities } = usePartner();
    const [tab, setTab] = useState<Tab>('enquiries');
    const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryEntry | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<BookingEntry | null>(null);
    const now = new Date();

    const enquiries = useEnquiriesData(allowedEntities);
    const bookings = useBookingsData(allowedEntities);

    if (enquiries.loading || bookings.loading) return <SkeletonBody />;

    const eStats = enquiryStats(enquiries.entries);
    const bStats = bookingStats(bookings.entries);
    const soon = soonBookings(bookings.entries, now);
    const bookingScope: BookingEntity[] = (['Events', 'Venues'] as BookingEntity[]).filter(e => allowedEntities.length === 0 || allowedEntities.includes(e));

    const exportCurrentTab = () => {
        if (tab === 'enquiries') {
            downloadTextFile(`tlb-enquiries-${Date.now()}.csv`, buildEnquiriesCsv(enquiries.entries));
        } else {
            downloadTextFile(`tlb-bookings-${Date.now()}.csv`, buildBookingEntriesCsv(bookings.entries));
        }
    };

    // Keep the open modal's data fresh after a status/notes/unlock update.
    const openEnquiry = (entry: EnquiryEntry) => setSelectedEnquiry(entry);
    const liveSelectedEnquiry = selectedEnquiry
        ? enquiries.entries.find(e => e.id === selectedEnquiry.id && e.entity === selectedEnquiry.entity) ?? selectedEnquiry
        : null;
    const liveSelectedBooking = selectedBooking
        ? bookings.entries.find(b => b.id === selectedBooking.id) ?? selectedBooking
        : null;

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                        <button type="button" onClick={() => onNavigate('HOME')} className="text-tlb-link hover:text-tlb-gold transition-colors">Dashboard</button>
                        {' · '}Bookings/Enquiries
                    </nav>
                    <h1 className="pt-h1 text-[24px]">Bookings/Enquiries</h1>
                    <p className="text-[13.5px] text-tlb-sub mt-[3px]">
                        {tab === 'enquiries'
                            ? 'Classes, Programs and Venue hire come in as enquiries — reply promptly to keep customers engaged.'
                            : 'Ticketed bookings — Events and Venue slots, confirmed and paid.'}
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-none">
                    <div className="text-right">
                        <p className="pt-eyebrow">{tab === 'enquiries' ? 'To respond' : 'Confirmed'}</p>
                        <p className="pt-num text-[19px] text-tlb-ink">{tab === 'enquiries' ? formatCount(eStats.toRespond) : formatCount(bStats.confirmedCount)}</p>
                    </div>
                    <div className="w-px h-[34px] bg-tlb-line" aria-hidden="true" />
                    <div className="text-right">
                        <p className="pt-eyebrow">{tab === 'enquiries' ? 'Responded' : 'Booking value'}</p>
                        <p className="pt-num text-[19px] text-tlb-ink">{tab === 'enquiries' ? formatCount(eStats.responded) : formatRupees(bStats.bookingValue)}</p>
                    </div>
                    <button type="button" onClick={exportCurrentTab} className="pt-btn pt-btn-d">
                        <Download size={14} strokeWidth={2.75} /> {tab === 'enquiries' ? 'Export enquiries' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {tab === 'bookings' && soon.rows.length > 0 && <SoonBookingsBanner soon={soon} />}

            <div className="flex items-center gap-7 border-b border-tlb-line overflow-x-auto">
                <button
                    type="button"
                    className={`pt-vtab ${tab === 'enquiries' ? 'is-active' : ''}`}
                    onClick={() => setTab('enquiries')}
                >
                    Enquiries
                    <span className={`pt-vtab-count ${eStats.toRespond > 0 ? 'is-alert' : ''}`}>{eStats.total}</span>
                </button>
                <button
                    type="button"
                    className={`pt-vtab ${tab === 'bookings' ? 'is-active' : ''}`}
                    onClick={() => setTab('bookings')}
                >
                    Bookings
                    <span className="pt-vtab-count">{bStats.total}</span>
                </button>
                <div className="flex-1" />
                <span className="hidden sm:block text-xs text-tlb-muted whitespace-nowrap">
                    {tab === 'enquiries' ? 'Respond, then the customer takes it forward' : 'Created automatically when a customer pays'}
                </span>
            </div>

            {tab === 'enquiries' ? (
                <EnquiriesPanel
                    entries={enquiries.entries}
                    listingsById={enquiries.listingsById}
                    availableEntities={allowedEntities}
                    onOpen={openEnquiry}
                />
            ) : (
                <BookingsPanel
                    entries={bookings.entries}
                    availableEntities={bookingScope}
                    now={now}
                    onOpen={setSelectedBooking}
                />
            )}

            <EnquiryDetailModal
                entry={liveSelectedEnquiry}
                onClose={() => setSelectedEnquiry(null)}
                onUpdateStatus={enquiries.updateStatus}
                onUpdateNotes={enquiries.updateNotes}
                onUnlock={enquiries.unlock}
            />
            <BookingDetailModal
                entry={liveSelectedBooking}
                now={now}
                onClose={() => setSelectedBooking(null)}
                onMarkAttended={bookings.markAttended}
                onCancelBooking={bookings.cancel}
            />
        </div>
    );
};
