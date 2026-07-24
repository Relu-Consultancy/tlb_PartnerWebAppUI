import React, { useEffect, useState, useCallback } from 'react';
import {
    Menu, Star, RefreshCw, AlertCircle, Inbox,
    MessageSquare, CalendarDays, GraduationCap, Layers, MapPin, User, BarChart2
} from 'lucide-react';
import { Screen, EntityType } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { getEventListings, getClassListings, getProgramListings, getVenueListings } from '../../api/listings';
import { getPartnerReviews, PartnerReview } from '../../api/reviews';
import { getStatsReviews, StatsReviews } from '../../api/stats';

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
                                <p className="text-2xl font-black text-gray-900 leading-none">{totalReviews}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Reviews</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><BarChart2 size={20} className="text-blue-600" /></div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 leading-none">{reviewsThisMonth}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Reviews This Month</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                        <select 
                            className="bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-tlb-yellow/30" 
                            value={ratingFilter} 
                            onChange={e => { setRatingFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
                        >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                        <select 
                            className="bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-tlb-yellow/30" 
                            value={typeFilter} 
                            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                        >
                            <option value="all">All Types</option>
                            <option value="event">Events</option>
                            <option value="class">Classes</option>
                            <option value="program">Programs</option>
                            <option value="venue">Venues</option>
                        </select>
                        <select 
                            className="bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-tlb-yellow/30 flex-1 min-w-[180px]" 
                            value={listingFilter} 
                            onChange={e => { setListingFilter(e.target.value); setPage(1); }}
                        >
                            <option value="all">All Listings</option>
                            {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                        </select>
                        <select 
                            className="bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-tlb-yellow/30" 
                            value={ordering} 
                            onChange={e => { setOrdering(e.target.value); setPage(1); }}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Rating</option>
                            <option value="lowest">Lowest Rating</option>
                        </select>
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
                        <div className="space-y-4">
                            {/* Review Feed */}
                            {reviews.map(r => {
                                const meta = TYPE_META[r.listing_type as BType] || TYPE_META.event;
                                return (
                                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                    <User size={18} className="text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{r.reviewer_name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Stars value={r.rating} size={13} />
                                                        {r.created_at && <span className="text-[11px] text-gray-400 font-medium">· {fmtDate(r.created_at)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${meta.badge}`}>
                                                <meta.icon size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-wider truncate max-w-[200px]">{r.listing_title || 'Listing'}</span>
                                            </div>
                                        </div>
                                        {r.comment && (
                                            <p className="text-sm text-gray-700 leading-relaxed mt-4 bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                                                {r.comment}
                                            </p>
                                        )}
                                        {/* Mobile listing badge */}
                                        <div className={`sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mt-4 ${meta.badge}`}>
                                            <meta.icon size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-[200px]">{r.listing_title || 'Listing'}</span>
                                        </div>
                                    </div>
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
