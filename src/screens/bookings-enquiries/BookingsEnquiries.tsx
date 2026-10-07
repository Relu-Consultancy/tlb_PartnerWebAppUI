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
import { bookingStats, enquiryStats, refundSummary, soonBookings } from './model';
import { buildBookingEntriesCsv, buildEnquiriesCsv } from './csv';
import { EnquiriesPanel } from './components/EnquiriesPanel';
import { BookingsPanel } from './components/BookingsPanel';
import { RefundsPanel } from './components/RefundsPanel';
import { SoonBookingsBanner } from './components/SoonBookingsBanner';
import { EnquiryDetailModal } from './components/EnquiryDetailModal';
import { BookingDetailModal } from './components/BookingDetailModal';

interface Props {
    onNavigate: (screen: Screen) => void;
}

type Tab = 'enquiries' | 'bookings' | 'refunds';

const SUBTITLE: Record<Tab, string> = {
    enquiries: 'Classes, Programs and Venue hire come in as enquiries — reply promptly to keep customers engaged.',
    bookings: 'Ticketed bookings — Events and Venue slots, confirmed and paid.',
    refunds: 'Every refund on your bookings, and where it stands right now.',
};

const TAB_HINT: Record<Tab, string> = {
    enquiries: 'Respond, then the customer takes it forward',
    bookings: 'Created automatically when a customer pays',
    refunds: 'Refunds settle with the bank in about 3–7 days',
};

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
    const refunds = refundSummary(bookings.entries);
    // Any service type can be sold upfront (booking_type: direct_booking), so the
    // scope follows what the partner offers rather than Events/Venues alone.
    const bookingScope: BookingEntity[] = (['Events', 'Venues', 'Classes', 'Programs'] as BookingEntity[]).filter(
        (e) => allowedEntities.length === 0 || allowedEntities.includes(e)
    );

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
        ? (enquiries.entries.find((e) => e.id === selectedEnquiry.id && e.entity === selectedEnquiry.entity) ?? selectedEnquiry)
        : null;
    const liveSelectedBooking = selectedBooking ? (bookings.entries.find((b) => b.id === selectedBooking.id) ?? selectedBooking) : null;

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                        <button
                            type="button"
                            onClick={() => onNavigate('HOME')}
                            className="text-tlb-link hover:text-tlb-gold transition-colors"
                        >
                            Dashboard
                        </button>
                        {' · '}Bookings/Enquiries
                    </nav>
                    <h1 className="pt-h1 text-[24px]">Bookings/Enquiries</h1>
                    <p className="text-[13.5px] text-tlb-sub mt-[3px]">{SUBTITLE[tab]}</p>
                </div>
                {/* Mobile: stats on one row, Export full-width below. sm+: all inline. */}
                {tab === 'refunds' ? (
                    <div className="flex items-center gap-4 flex-none">
                        <div className="sm:text-right">
                            <p className="pt-eyebrow whitespace-nowrap">Needs attention</p>
                            <p className={`pt-num text-[19px] ${refunds.attention.count > 0 ? 'text-tlb-red-deep' : 'text-tlb-ink'}`}>
                                {formatCount(refunds.attention.count)}
                            </p>
                        </div>
                        <div className="w-px h-[34px] bg-tlb-line" aria-hidden="true" />
                        <div className="sm:text-right">
                            <p className="pt-eyebrow whitespace-nowrap">In progress</p>
                            <p className="pt-num text-[19px] text-tlb-ink">{formatCount(refunds.in_progress.count)}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-none">
                        <div className="flex items-center gap-4">
                            <div className="sm:text-right">
                                <p className="pt-eyebrow whitespace-nowrap">{tab === 'enquiries' ? 'To respond' : 'Confirmed'}</p>
                                <p className="pt-num text-[19px] text-tlb-ink">
                                    {tab === 'enquiries' ? formatCount(eStats.toRespond) : formatCount(bStats.confirmedCount)}
                                </p>
                            </div>
                            <div className="w-px h-[34px] bg-tlb-line" aria-hidden="true" />
                            <div className="sm:text-right">
                                <p className="pt-eyebrow whitespace-nowrap">{tab === 'enquiries' ? 'Responded' : 'Booking value'}</p>
                                <p className="pt-num text-[19px] text-tlb-ink">
                                    {tab === 'enquiries' ? formatCount(eStats.responded) : formatRupees(bStats.bookingValue)}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={exportCurrentTab} className="pt-btn pt-btn-d justify-center w-full sm:w-auto">
                            <Download size={14} strokeWidth={2.75} /> {tab === 'enquiries' ? 'Export enquiries' : 'Export CSV'}
                        </button>
                    </div>
                )}
            </div>

            {tab === 'bookings' && soon.rows.length > 0 && <SoonBookingsBanner soon={soon} />}

            <div className="flex items-center gap-7 border-b border-tlb-line overflow-x-auto">
                <button type="button" className={`pt-vtab ${tab === 'enquiries' ? 'is-active' : ''}`} onClick={() => setTab('enquiries')}>
                    Enquiries
                    <span className={`pt-vtab-count ${eStats.toRespond > 0 ? 'is-alert' : ''}`}>{eStats.total}</span>
                </button>
                <button type="button" className={`pt-vtab ${tab === 'bookings' ? 'is-active' : ''}`} onClick={() => setTab('bookings')}>
                    Bookings
                    <span className="pt-vtab-count">{bStats.total}</span>
                </button>
                <button type="button" className={`pt-vtab ${tab === 'refunds' ? 'is-active' : ''}`} onClick={() => setTab('refunds')}>
                    Refunds
                    {/* Red when a refund failed — the customer hasn't been paid back. */}
                    <span className={`pt-vtab-count ${refunds.attention.count > 0 ? 'is-alert' : ''}`}>{refunds.total}</span>
                </button>
                <div className="flex-1" />
                <span className="hidden sm:block text-xs text-tlb-muted whitespace-nowrap">{TAB_HINT[tab]}</span>
            </div>

            {tab === 'enquiries' && (
                <EnquiriesPanel
                    entries={enquiries.entries}
                    listingsById={enquiries.listingsById}
                    availableEntities={allowedEntities}
                    onOpen={openEnquiry}
                />
            )}
            {tab === 'bookings' && (
                <BookingsPanel entries={bookings.entries} availableEntities={bookingScope} now={now} onOpen={setSelectedBooking} />
            )}
            {tab === 'refunds' && (
                <RefundsPanel entries={bookings.entries} onOpen={setSelectedBooking} onContactSupport={() => onNavigate('HELP_SUPPORT')} />
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
