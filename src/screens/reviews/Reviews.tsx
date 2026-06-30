import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Menu, Search, X, Star, ChevronDown, RefreshCw, AlertCircle, Inbox,
    MessageSquare, CalendarDays, GraduationCap, Layers, MapPin, User,
} from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { getEventListings, getClassListings, getProgramListings, getVenueListings } from '../../api/listings';
import { getPartnerReviews, PartnerReview } from '../../api/reviews';

interface Props { onNavigate: (s: Screen) => void; onOpenSidebar: () => void; }

type BType = 'event' | 'class' | 'program' | 'venue';

const ENTITY_TO_TYPE: Record<EntityType, BType> = {
    Events: 'event', Classes: 'class', Programs: 'program', Venues: 'venue',
};

const TYPE_META: Record<BType, { label: string; icon: React.ElementType; badge: string }> = {
    event: { label: 'Event', icon: CalendarDays, badge: 'bg-blue-100 text-blue-700' },
    class: { label: 'Class', icon: GraduationCap, badge: 'bg-purple-100 text-purple-700' },
    program: { label: 'Program', icon: Layers, badge: 'bg-emerald-100 text-emerald-700' },
    venue: { label: 'Venue', icon: MapPin, badge: 'bg-amber-100 text-amber-700' },
};

interface LCard { id: string; title: string; type: BType; }

const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const avg = (list: PartnerReview[]) => list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

const Stars: React.FC<{ value: number; size?: number }> = ({ value, size = 14 }) => (
    <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={size} className={i <= Math.round(value) ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
        ))}
    </span>
);

const Reviews: React.FC<Props> = ({ onOpenSidebar }) => {
    const { allowedEntities } = usePartner();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [listings, setListings] = useState<LCard[]>([]);
    const [byListing, setByListing] = useState<Record<string, PartnerReview[]>>({});
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const wanted: EntityType[] = allowedEntities.length > 0
                ? allowedEntities
                : ['Events', 'Classes', 'Programs', 'Venues'];
            const fetchers: Record<EntityType, (s?: string) => Promise<any>> = {
                Events: getEventListings, Classes: getClassListings,
                Programs: getProgramListings, Venues: getVenueListings,
            };
            const listingFetches = wanted.map(ent =>
                fetchers[ent]().then((res: any) => {
                    const data = res?.data || res;
                    return Array.isArray(data)
                        ? data.map((it: any) => ({ id: String(it.id || ''), title: it.title || 'Untitled', type: ENTITY_TO_TYPE[ent] } as LCard))
                        : [];
                }).catch(() => [] as LCard[]),
            );

            const [listingResults, reviews] = await Promise.all([
                Promise.all(listingFetches),
                getPartnerReviews().catch(() => [] as PartnerReview[]),
            ]);

            const cards: LCard[] = listingResults.flat();
            const byId = new Map(cards.map(c => [c.id, c]));

            const grouped: Record<string, PartnerReview[]> = {};
            reviews.forEach(r => {
                const k = r.listing_id || 'unknown';
                (grouped[k] ||= []).push(r);
            });

            // Synthesize cards for reviews whose listing isn't in the catalog
            Object.entries(grouped).forEach(([k, list]) => {
                if (byId.has(k)) return;
                const f = list[0];
                cards.push({
                    id: k,
                    title: f.listing_title || 'Listing',
                    type: (TYPE_META[f.listing_type as BType] ? (f.listing_type as BType) : 'event'),
                });
            });

            setListings(cards);
            setByListing(grouped);
        } catch (e: any) {
            setError(e?.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [allowedEntities]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const toggle = (id: string) => setExpanded(prev => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id); else n.add(id);
        return n;
    });

    const allReviews: PartnerReview[] = [];
    Object.keys(byListing).forEach(k => allReviews.push(...byListing[k]));
    const overall = avg(allReviews);
    const listingsReviewed = Object.keys(byListing).filter(k => (byListing[k]?.length || 0) > 0).length;

    const visible = listings
        .filter(l => l.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (byListing[b.id]?.length || 0) - (byListing[a.id]?.length || 0));

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <main className="flex-1 w-full">
                {/* Header */}
                <header className="bg-white px-6 md:px-10 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                    <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <Menu size={24} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="tlb-page-title truncate">Reviews</h1>
                        <p className="tlb-page-sub">Ratings &amp; feedback customers left on your listings</p>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-24"><RefreshCw size={26} className="text-gray-300 animate-spin" /></div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-3 py-24 text-center">
                            <AlertCircle size={34} className="text-red-300" />
                            <p className="text-sm font-bold text-gray-500">{error}</p>
                            <button onClick={loadAll} className="text-xs font-black text-blue-500 hover:underline">Try again</button>
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-24 text-center">
                            <Inbox size={34} className="text-gray-200" />
                            <p className="text-sm font-bold text-gray-400">No listings yet</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                                    <div className="text-center shrink-0">
                                        <p className="text-3xl font-black text-gray-900 leading-none">{overall ? overall.toFixed(1) : '—'}</p>
                                        <div className="mt-1.5"><Stars value={overall} size={13} /></div>
                                    </div>
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Overall Rating</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-tlb-yellow/15 flex items-center justify-center shrink-0"><MessageSquare size={20} className="text-tlb-dark" /></div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-900 leading-none">{allReviews.length}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Reviews</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><Layers size={20} className="text-emerald-600" /></div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-900 leading-none">{listingsReviewed}<span className="text-base text-gray-300">/{listings.length}</span></p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Listings Reviewed</p>
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
                                <Search size={16} className="text-gray-400 shrink-0" />
                                <input
                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-gray-300"
                                    placeholder="Search listings…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>}
                            </div>

                            {/* Listing review groups */}
                            <div className="space-y-3">
                                {visible.map(l => {
                                    const meta = TYPE_META[l.type];
                                    const list = byListing[l.id] || [];
                                    const isOpen = expanded.has(l.id);
                                    const a = avg(list);
                                    return (
                                        <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <button
                                                onClick={() => list.length && toggle(l.id)}
                                                className={`w-full flex items-center gap-3 p-4 text-left ${list.length ? 'hover:bg-gray-50/60' : 'cursor-default'} transition-colors`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.badge}`}>
                                                    <meta.icon size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm text-gray-900 truncate">{l.title}</p>
                                                        <span className={`hidden sm:inline text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${meta.badge}`}>{meta.label}</span>
                                                    </div>
                                                    {list.length ? (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Stars value={a} size={12} />
                                                            <span className="text-xs font-bold text-gray-500">{a.toFixed(1)}</span>
                                                            <span className="text-[11px] text-gray-400">· {list.length} review{list.length === 1 ? '' : 's'}</span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">No reviews yet</p>
                                                    )}
                                                </div>
                                                {list.length > 0 && (
                                                    <ChevronDown size={18} className={`text-gray-300 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                )}
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {isOpen && list.length > 0 && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-3">
                                                            {list.map(r => (
                                                                <div key={r.id} className="bg-gray-50 rounded-xl p-3.5">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-gray-500"><User size={14} /></div>
                                                                            <p className="font-bold text-sm text-gray-900 truncate">{r.reviewer_name}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <Stars value={r.rating} size={12} />
                                                                            {r.created_at && <span className="text-[10px] text-gray-400 font-medium">{fmtDate(r.created_at)}</span>}
                                                                        </div>
                                                                    </div>
                                                                    {r.comment && <p className="text-sm text-gray-600 leading-relaxed mt-2">{r.comment}</p>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                                {visible.length === 0 && (
                                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                                        <Inbox size={30} className="text-gray-200" />
                                        <p className="text-sm font-bold text-gray-400">No listings match “{search}”</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Reviews;
