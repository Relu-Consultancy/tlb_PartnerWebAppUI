import React, { useEffect, useState } from 'react';
import {
    Sparkles, ArrowRight, X, Loader2, CalendarDays, GraduationCap, Layers, MapPin,
} from 'lucide-react';
import { getEventListings, getClassListings, getProgramListings, getVenueListings } from '../../api/listings';

// ---------------------------------------------------------------------------
// LatestListings — compact popup showing the partner's upcoming / live
// listings (soonest first), highlighting anything live or within two days.
// ---------------------------------------------------------------------------

type LType = 'event' | 'class' | 'program' | 'venue';

interface LatestItem {
    id: string;
    title: string;
    type: LType;
    status?: string;
    coverUrl?: string;
    happenAt?: string;
    happenEnd?: string;
    isLive?: boolean;
}

interface Props {
    onClose?: () => void;
    onViewAll?: () => void;
}

const TYPE_META: Record<LType, { label: string; icon: React.ElementType; tint: string }> = {
    event: { label: 'Event', icon: CalendarDays, tint: 'bg-blue-50 text-blue-600' },
    class: { label: 'Class', icon: GraduationCap, tint: 'bg-purple-50 text-purple-600' },
    program: { label: 'Program', icon: Layers, tint: 'bg-emerald-50 text-emerald-600' },
    venue: { label: 'Venue', icon: MapPin, tint: 'bg-amber-50 text-amber-600' },
};

const MS_TWO_DAYS = 48 * 60 * 60 * 1000;

const happenMs = (it: LatestItem): number => {
    if (!it.happenAt) return NaN;
    const t = new Date(it.happenAt).getTime();
    return Number.isNaN(t) ? NaN : t;
};

const upcomingState = (it: LatestItem, now: number): 'live' | 'soon' | null => {
    if (it.isLive) return 'live';
    const t = happenMs(it);
    if (Number.isNaN(t)) return null;
    const end = it.happenEnd ? new Date(it.happenEnd).getTime() : NaN;
    if (!Number.isNaN(end) && t <= now && now <= end) return 'live';
    if (t >= now && t - now <= MS_TWO_DAYS) return 'soon';
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    if (t >= startToday.getTime() && t <= now) return 'live';
    return null;
};

const fmtHappen = (iso?: string): string => {
    if (!iso) return 'Date not set';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Date not set';
    return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export const LatestListings: React.FC<Props> = ({ onClose, onViewAll }) => {
    const [items, setItems] = useState<LatestItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchers: { fn: () => Promise<any>; type: LType }[] = [
            { fn: getEventListings, type: 'event' },
            { fn: getClassListings, type: 'class' },
            { fn: getProgramListings, type: 'program' },
            { fn: getVenueListings, type: 'venue' },
        ];
        Promise.allSettled(fetchers.map(f => f.fn())).then(results => {
            if (cancelled) return;
            const all: LatestItem[] = [];
            results.forEach((r, i) => {
                if (r.status !== 'fulfilled') return;
                const data = r.value?.data || r.value;
                if (!Array.isArray(data)) return;
                data.forEach((item: any) => all.push({
                    id: String(item.id || ''),
                    title: item.title || 'Untitled',
                    type: fetchers[i].type,
                    status: item.status,
                    coverUrl: item.cover_url || item.cover || undefined,
                    happenAt: item.start_datetime || item.start_date || item.next_session_at
                        || item.next_batch_start || item.starts_at || item.event_date || undefined,
                    happenEnd: item.end_datetime || item.end_date || undefined,
                    isLive: item.is_live === true,
                }));
            });
            setItems(all);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    const now = Date.now();
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const sodMs = startOfToday.getTime();
    // Drop listings whose date has already passed (unless they're live now).
    const isPast = (it: LatestItem) => {
        const t = happenMs(it);
        return !Number.isNaN(t) && t < sodMs && upcomingState(it, now) !== 'live';
    };
    const upcomingItems = items.filter(it => !isPast(it));
    // Live first, then soonest upcoming, then dated future, then the rest.
    const sorted = [...upcomingItems].sort((a, b) => {
        const rank = (it: LatestItem) => {
            if (upcomingState(it, now) === 'live') return 0;
            const t = happenMs(it);
            if (Number.isNaN(t)) return 3;
            return t >= now ? 1 : 2;
        };
        const ra = rank(a), rb = rank(b);
        if (ra !== rb) return ra - rb;
        const ta = happenMs(a), tb = happenMs(b);
        if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
        if (Number.isNaN(ta)) return 1;
        if (Number.isNaN(tb)) return -1;
        return ra === 2 ? tb - ta : ta - tb;
    });
    const top = sorted.slice(0, 6);

    return (
        <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-tlb-yellow/10 text-tlb-yellow rounded-xl flex items-center justify-center">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h2 className="font-black text-sm text-gray-900 leading-none">Latest Listings</h2>
                        <p className="text-[11px] text-gray-400 mt-1">Upcoming &amp; live, soonest first</p>
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

            {loading ? (
                <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-tlb-yellow" /></div>
            ) : top.length === 0 ? (
                <div className="text-center py-10">
                    <CalendarDays size={26} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-400">No listings yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {top.map(it => {
                        const meta = TYPE_META[it.type];
                        const state = upcomingState(it, now);
                        return (
                            <div key={`${it.type}-${it.id}`} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                                state === 'live' ? 'border-emerald-200 bg-emerald-50/40' :
                                state === 'soon' ? 'border-amber-200 bg-amber-50/40' :
                                'border-gray-100 bg-gray-50'
                            }`}>
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 flex items-center justify-center shrink-0">
                                    {it.coverUrl
                                        ? <img src={it.coverUrl} alt="" className="w-full h-full object-cover" />
                                        : <span className={`w-full h-full flex items-center justify-center ${meta.tint}`}><meta.icon size={16} /></span>}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-gray-900 truncate">{it.title}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{meta.label} · {fmtHappen(it.happenAt)}</p>
                                </div>
                                {state && (
                                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider text-[9px] px-2 py-0.5 ${
                                        state === 'live' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full bg-white ${state === 'live' ? 'animate-pulse' : ''}`} />
                                        {state === 'live' ? 'Live' : 'Soon'}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};
