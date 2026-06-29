import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CalendarDays, ArrowRight, Loader2, X } from 'lucide-react';
import { getBookings } from '../../api/listings';
import { fmtCurrency } from './DashboardCharts';

// ---------------------------------------------------------------------------
// BookingsCalendar — month grid with the partner's bookings marked per day.
// Click a marked day to see that day's bookings underneath.
// ---------------------------------------------------------------------------

interface CalendarBooking {
    id: string;
    listing_title?: string;
    booking_reference?: string;
    status?: string;
    total_amount?: number;
    currency?: string;
    customer_name?: string;
    created_at: string;
}

interface BookingsCalendarProps {
    /** Optional — renders a "View all" link to the Attendees screen when provided. */
    onViewAll?: () => void;
    /** Optional — renders a close (X) button in the header (for popup usage). */
    onClose?: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n: number) => String(n).padStart(2, '0');
// Local Y-M-D key so calendar cells and bookings group in the same timezone.
const localKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const STATUS_STYLES: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-600',
    attended: 'bg-blue-50 text-blue-600',
    awaiting_payment: 'bg-amber-50 text-amber-600',
    cancelled: 'bg-red-50 text-red-500',
};
const statusLabel = (s?: string) => (s ? s.replace(/_/g, ' ') : '');

export const BookingsCalendar: React.FC<BookingsCalendarProps> = ({ onViewAll, onClose }) => {
    const [bookings, setBookings] = useState<CalendarBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const today = new Date();
    const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedKey, setSelectedKey] = useState<string>(() => localKey(today));

    useEffect(() => {
        let cancelled = false;
        const fetchAll = async () => {
            const all: CalendarBooking[] = [];
            let page = 1;
            try {
                for (let guard = 0; guard < 30; guard++) {
                    const res: any = await getBookings({ page });
                    const d = res?.data || res;
                    all.push(...((d?.results || []) as CalendarBooking[]));
                    if (!d?.next) break;
                    page++;
                }
                if (!cancelled) setBookings(all);
            } catch {
                if (!cancelled) setBookings([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchAll();
        return () => { cancelled = true; };
    }, []);

    // Map of dateKey -> bookings on that day
    const byDay = useMemo(() => {
        const map = new Map<string, CalendarBooking[]>();
        bookings.forEach(b => {
            if (!b.created_at) return;
            const dt = new Date(b.created_at);
            if (Number.isNaN(dt.getTime())) return;
            const key = localKey(dt);
            const arr = map.get(key);
            if (arr) arr.push(b); else map.set(key, [b]);
        });
        return map;
    }, [bookings]);

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = localKey(today);

    // Build the cell grid (leading blanks + days)
    const cells: (number | null)[] = [
        ...Array(firstWeekday).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const selectedBookings = byDay.get(selectedKey) || [];
    const monthHasBookings = useMemo(
        () => (Array.from(byDay.keys()) as string[]).some(k => k.startsWith(`${year}-${pad(month + 1)}`)),
        [byDay, year, month],
    );

    const goPrev = () => setCursor(new Date(year, month - 1, 1));
    const goNext = () => setCursor(new Date(year, month + 1, 1));
    const goToday = () => { const t = new Date(); setCursor(new Date(t.getFullYear(), t.getMonth(), 1)); setSelectedKey(localKey(t)); };

    const selectedLabel = (() => {
        const d = new Date(selectedKey);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    })();

    return (
        <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-tlb-yellow/10 text-tlb-yellow rounded-xl flex items-center justify-center">
                        <CalendarDays size={18} />
                    </div>
                    <div>
                        <h2 className="font-black text-sm text-gray-900 leading-none">Bookings Calendar</h2>
                        <p className="text-[11px] text-gray-400 mt-1">Days with bookings are marked</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {onViewAll && (
                        <button onClick={onViewAll} className="text-[11px] font-bold text-blue-500 hover:underline flex items-center gap-1">
                            View all <ArrowRight size={12} />
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" aria-label="Close">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
                <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Previous month">
                    <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900">{MONTHS[month]} {year}</span>
                    <button onClick={goToday} className="text-[10px] font-bold text-gray-400 hover:text-gray-700 border border-gray-200 rounded-md px-2 py-0.5 transition-colors">
                        Today
                    </button>
                </div>
                <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Next month">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map(w => (
                    <div key={w} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-wider py-1">{w.slice(0, 1)}</div>
                ))}
            </div>

            {/* Day grid */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
                        <Loader2 size={20} className="animate-spin text-tlb-yellow" />
                    </div>
                )}
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                        if (day === null) return <div key={`b${i}`} />;
                        const key = localKey(new Date(year, month, day));
                        const dayBookings = byDay.get(key);
                        const count = dayBookings?.length || 0;
                        const isToday = key === todayKey;
                        const isSelected = key === selectedKey;
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedKey(key)}
                                className={`relative h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                                    isSelected
                                        ? 'bg-tlb-dark text-white font-black'
                                        : isToday
                                            ? 'bg-tlb-yellow/15 text-tlb-dark font-black'
                                            : count > 0
                                                ? 'hover:bg-gray-100 text-gray-800 font-bold'
                                                : 'hover:bg-gray-50 text-gray-400 font-medium'
                                }`}
                            >
                                <span>{day}</span>
                                {count > 0 && (
                                    <span className={`absolute bottom-1.5 flex items-center justify-center ${
                                        isSelected
                                            ? 'min-w-[16px] h-[15px] px-1 rounded-full bg-tlb-yellow text-tlb-dark text-[9px] font-black'
                                            : 'w-1.5 h-1.5 rounded-full bg-tlb-yellow'
                                    }`}>
                                        {isSelected ? count : ''}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected day bookings */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-black text-gray-900">{selectedLabel}</p>
                    {selectedBookings.length > 0 && (
                        <span className="text-[10px] font-bold text-gray-400">{selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''}</span>
                    )}
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedKey}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-2 max-h-48 overflow-y-auto"
                    >
                        {selectedBookings.length === 0 ? (
                            <p className="text-xs text-gray-400 py-3 text-center">
                                {loading ? 'Loading bookings…' : monthHasBookings ? 'No bookings on this day' : 'No bookings this month'}
                            </p>
                        ) : (
                            selectedBookings.map(b => (
                                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[11px] font-black text-gray-500 shrink-0">
                                        {(b.customer_name || '?').trim().charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 truncate">{b.customer_name || 'Customer'}</p>
                                        <p className="text-[11px] text-gray-400 truncate">{b.listing_title || b.booking_reference || '—'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-gray-900">{fmtCurrency(b.total_amount || 0)}</p>
                                        {b.status && (
                                            <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-500'}`}>
                                                {statusLabel(b.status)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
};
