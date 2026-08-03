import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
    Star, RefreshCw, AlertCircle, Inbox, Quote, TrendingUp,
    CalendarDays, GraduationCap, Layers, MapPin,
} from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { getEventListings, getClassListings, getProgramListings, getVenueListings } from '../../api/listings';
import { getPartnerReviews, PartnerReview } from '../../api/reviews';
import { getStatsReviews, StatsReviews } from '../../api/stats';
import { Select } from '../../components/ui/Select';

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

const initials = (name: string) =>
    (name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';

const Stars: React.FC<{ value: number; size?: number; filled?: string; empty?: string }> = ({
    value, size = 14, filled = 'text-amber-400', empty = 'text-gray-200',
}) => (
    <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={size} className={i <= Math.round(value) ? filled : empty} fill="currentColor" />
        ))}
    </span>
);

const Reviews: React.FC<Props> = ({ onOpenSidebar }) => {
    const { allowedEntities } = usePartner();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [listings, setListings] = useState<LCard[]>([]);
    const [stats, setStats] = useState<StatsReviews | null>(null);
    
    // Pagination & Feed state
    const [reviews, setReviews] = useState<PartnerReview[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    
    // Filters
    const [ratingFilter, setRatingFilter] = useState<number | ''>('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [listingFilter, setListingFilter] = useState<string>('all');
    const [ordering, setOrdering] = useState<string>('newest');

    const PAGE_SIZE = 10;

    const loadMeta = useCallback(async () => {
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

            const [listingResults, statsRes] = await Promise.all([
                Promise.all(listingFetches),
                getStatsReviews().catch(() => null),
            ]);

            setListings(listingResults.flat());
            if (statsRes) setStats(statsRes);
        } catch (e) {
            // Ignore meta errors
        }
    }, [allowedEntities]);

    useEffect(() => { loadMeta(); }, [loadMeta]);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPartnerReviews({
                page,
                page_size: PAGE_SIZE,
                rating: ratingFilter,
                listing_type: typeFilter,
                listing_id: listingFilter,
                ordering
            });
            setReviews(data.results);
            setTotalCount(data.count);
        } catch (e: any) {
            setError(e?.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [page, ratingFilter, typeFilter, listingFilter, ordering]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const overall = stats?.avg_rating || 0;
    const totalReviews = stats?.total_reviews || 0;
    const reviewsThisMonth = stats?.reviews_this_month || 0;
    const reviewsPrevMonth = stats?.reviews_prev_month || 0;
    const monthDelta = reviewsThisMonth - reviewsPrevMonth;
    const distMap: Record<number, number> = {};
    (stats?.rating_distribution || []).forEach(b => { distMap[b.rating] = b.count; });
    const distMax = Math.max(1, ...[5, 4, 3, 2, 1].map(s => distMap[s] || 0));

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <main className="flex-1 w-full">
                {/* Header */}
                <header className="bg-white px-6 md:px-10 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                    
                    <div className="min-w-0">
                        <h1 className="tlb-page-title truncate">Reviews</h1>
                        <p className="tlb-page-sub">Ratings &amp; feedback customers left on your listings</p>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
                    {/* Rating hero */}
                    <motion.section
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white p-6 sm:p-8 shadow-lg shadow-amber-500/20"
                    >
                        <div className="absolute -right-12 -top-16 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
                        <Star size={190} className="absolute -right-8 -bottom-16 text-white/10 rotate-12" fill="currentColor" />
                        <div className="relative grid lg:grid-cols-[auto_1fr] gap-6 lg:gap-10 items-center">
                            {/* Big score */}
                            <div className="lg:pr-8 lg:border-r lg:border-white/20">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Overall Rating</p>
                                <div className="flex items-end gap-3 mt-1.5">
                                    <motion.p
                                        key={overall}
                                        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                                        className="text-6xl font-black leading-none tracking-tight"
                                    >
                                        {overall ? overall.toFixed(1) : '—'}
                                    </motion.p>
                                    <div className="mb-1.5">
                                        <Stars value={overall} size={18} filled="text-white" empty="text-white/30" />
                                        <p className="text-xs font-medium text-white/80 mt-1">based on {totalReviews.toLocaleString('en-IN')} review{totalReviews === 1 ? '' : 's'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 text-xs font-black">
                                        {reviewsThisMonth} this month
                                    </span>
                                    {monthDelta !== 0 && (
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-black ${monthDelta > 0 ? 'bg-white/20' : 'bg-black/10'}`}>
                                            <TrendingUp size={12} className={monthDelta > 0 ? '' : 'rotate-180'} /> {monthDelta > 0 ? '+' : ''}{monthDelta} vs last
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Distribution bars */}
                            <div className="space-y-2 min-w-0">
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = distMap[star] || 0;
                                    const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
                                    return (
                                        <div key={star} className="flex items-center gap-3">
                                            <span className="flex items-center gap-1 text-xs font-black text-white/90 w-8 shrink-0">
                                                {star} <Star size={11} fill="currentColor" />
                                            </span>
                                            <div className="flex-1 h-2.5 rounded-full bg-white/20 overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-white"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${totalReviews ? (count / distMax) * 100 : 0}%` }}
                                                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 + (5 - star) * 0.06 }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-bold text-white/80 w-12 text-right shrink-0 tabular-nums">{count} · {pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.section>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                        <Select 
                            value={String(ratingFilter)} 
                            onChange={v => { setRatingFilter(v ? Number(v) : ''); setPage(1); }}
                            options={[
                                { value: '', label: 'All Ratings' },
                                { value: '5', label: '5 Stars' },
                                { value: '4', label: '4 Stars' },
                                { value: '3', label: '3 Stars' },
                                { value: '2', label: '2 Stars' },
                                { value: '1', label: '1 Star' },
                            ]}
                            buttonClassName="bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors flex items-center justify-between gap-2 w-full text-left"
                            className="min-w-[140px] flex-1 sm:flex-none"
                        />
                        <Select 
                            value={typeFilter} 
                            onChange={v => { setTypeFilter(v); setPage(1); }}
                            options={[
                                { value: 'all', label: 'All Types' },
                                { value: 'event', label: 'Events' },
                                { value: 'class', label: 'Classes' },
                                { value: 'program', label: 'Programs' },
                                { value: 'venue', label: 'Venues' },
                            ]}
                            buttonClassName="bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors flex items-center justify-between gap-2 w-full text-left"
                            className="min-w-[140px] flex-1 sm:flex-none"
                        />
                        <Select 
                            value={listingFilter} 
                            onChange={v => { setListingFilter(v); setPage(1); }}
                            options={[
                                { value: 'all', label: 'All Listings' },
                                ...listings.map(l => ({ value: l.id, label: l.title }))
                            ]}
                            buttonClassName="bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors flex items-center justify-between gap-2 w-full text-left"
                            className="min-w-[180px] flex-1"
                        />
                        <Select 
                            value={ordering} 
                            onChange={v => { setOrdering(v); setPage(1); }}
                            options={[
                                { value: 'newest', label: 'Newest First' },
                                { value: 'oldest', label: 'Oldest First' },
                                { value: 'highest', label: 'Highest Rating' },
                                { value: 'lowest', label: 'Lowest Rating' },
                            ]}
                            buttonClassName="bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors flex items-center justify-between gap-2 w-full text-left"
                            className="min-w-[160px] flex-1 sm:flex-none"
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24"><RefreshCw size={26} className="text-gray-300 animate-spin" /></div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-3 py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <AlertCircle size={34} className="text-red-300" />
                            <p className="text-sm font-bold text-gray-500">{error}</p>
                            <button onClick={fetchReviews} className="text-xs font-black text-blue-500 hover:underline">Try again</button>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <Inbox size={34} className="text-gray-200" />
                            <p className="text-sm font-bold text-gray-400">No reviews found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {/* Review Feed */}
                            {reviews.map((r, i) => {
                                const meta = TYPE_META[r.listing_type as BType] || TYPE_META.event;
                                return (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.28, delay: Math.min(i * 0.04, 0.4) }}
                                        whileHover={{ y: -3 }}
                                        className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-100 transition-all"
                                    >
                                        <Quote size={72} className="absolute -right-2 -top-3 text-amber-50 rotate-6" fill="currentColor" />
                                        <div className="relative flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="shrink-0 p-[2px] rounded-full bg-gradient-to-br from-amber-300 to-orange-400">
                                                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-black text-sm text-amber-600">
                                                        {initials(r.reviewer_name)}
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-[15px] text-gray-900 truncate">{r.reviewer_name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Stars value={r.rating} size={14} />
                                                        {r.created_at && <span className="text-[11px] text-gray-400 font-medium">· {fmtDate(r.created_at)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 ${meta.badge}`}>
                                                <meta.icon size={13} />
                                                <span className="text-[10px] font-black uppercase tracking-wider truncate max-w-[200px]">{r.listing_title || 'Listing'}</span>
                                            </div>
                                        </div>
                                        {r.comment && (
                                            <p className="relative text-sm text-gray-700 leading-relaxed mt-4 pl-4 border-l-2 border-amber-200">
                                                {r.comment}
                                            </p>
                                        )}
                                        {/* Mobile listing badge */}
                                        <div className={`sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mt-4 ${meta.badge}`}>
                                            <meta.icon size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-[200px]">{r.listing_title || 'Listing'}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            
                            {/* Pagination */}
                            {totalCount > PAGE_SIZE && (
                                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm mt-6">
                                    <button 
                                        disabled={page === 1} 
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="text-sm font-bold text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-[13px] font-bold text-gray-400">Page {page} of {Math.ceil(totalCount / PAGE_SIZE)}</span>
                                    <button 
                                        disabled={page >= Math.ceil(totalCount / PAGE_SIZE)} 
                                        onClick={() => setPage(p => p + 1)}
                                        className="text-sm font-bold text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Reviews;
