import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Download, Loader2 } from 'lucide-react';
import { UpcomingEvent } from '../dashboardModel';
import { buildBookingsCsv, fileSafeName } from '../bookingsCsv';
import { getAllListingBookings } from '../../../api/listings';
import { downloadTextFile } from '../../../utils/download';
import { useDismiss } from '../../../hooks/useDismiss';
import { toast } from '../../../components/ui';

/** Cream banner for events starting today/tomorrow, with a per-event booking list export. */
export const EventsSoonBanner: React.FC<{ events: UpcomingEvent[] }> = ({ events }) => {
    const [open, setOpen] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    useDismiss(rootRef, open, () => setOpen(false));

    const download = async ({ listing }: UpcomingEvent) => {
        if (busyId) return;
        setBusyId(listing.id);
        try {
            const bookings = await getAllListingBookings(listing.id);
            if (bookings.length === 0) {
                toast.info(`No bookings yet for “${listing.title}”.`);
                return;
            }
            downloadTextFile(`${fileSafeName(listing.title)}-bookings.csv`, buildBookingsCsv(bookings));
            setOpen(false);
        } catch (err) {
            console.error('Booking list export failed', err);
            toast.error('Couldn’t download the booking list. Please try again.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="pt-card relative flex items-center gap-2.5 px-3.5 py-2.5 bg-tlb-cream border-tlb-cream-line">
            <Download size={15} strokeWidth={2.75} className="text-tlb-gold flex-none" aria-hidden="true" />
            <span className="text-[12.5px] font-bold text-tlb-ink min-w-0 truncate">Events live today or tomorrow</span>
            <div ref={rootRef} className="relative ml-auto flex-none">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    className="inline-flex items-center gap-[7px] pl-[13px] pr-2 py-[7px] text-xs font-bold text-tlb-ink bg-white border border-tlb-amber-line rounded-[9px] hover:bg-tlb-highlight transition-colors"
                >
                    Download list
                    <ChevronDown size={13} strokeWidth={3} className="text-tlb-gold" />
                </button>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            role="menu"
                            className="pt-popover absolute right-0 top-9 z-40 w-[240px] p-[7px]"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12 }}
                        >
                            {events.map(event => (
                                <button
                                    key={event.listing.id}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => download(event)}
                                    disabled={!!busyId}
                                    className="pt-opt flex-col items-start gap-0.5 px-3 py-[9px] disabled:cursor-wait"
                                >
                                    <span className="flex w-full items-center gap-2 text-[12.5px] font-bold text-tlb-ink">
                                        <span className="truncate">{event.listing.title}</span>
                                        {busyId === event.listing.id && <Loader2 size={12} className="animate-spin flex-none ml-auto" />}
                                    </span>
                                    <span className="text-[11px] font-medium text-tlb-muted">{event.whenLabel}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
