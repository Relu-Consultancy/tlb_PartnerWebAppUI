import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu, Search, X, RefreshCw, AlertCircle, Users, Heart, MapPin,
  Calendar, UserPlus, ChevronLeft, ChevronRight, Mail, Phone, User,
  Loader2, ShoppingBag, Clock, SlidersHorizontal, ArrowUpDown,
} from 'lucide-react';
import { Screen } from '../../types';
import {
  getFollowers, getFollowerDetail,
  FollowerListItem, FollowerDetail, FollowerListParams,
} from '../../api/followers';

interface Props { onNavigate: (s: Screen) => void; onOpenSidebar: () => void; }

const PAGE_SIZE = 20;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const fmtRelative = (iso: string | null) => {
  if (!iso) return '';
  const diff = Date.now() - Date.parse(iso);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';

const AVATAR_TINTS = [
  'bg-rose-100 text-rose-600', 'bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600', 'bg-purple-100 text-purple-600', 'bg-cyan-100 text-cyan-600',
];
const tintFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Male', female: 'Female', other: 'Other', prefer_not_to_say: 'Prefer not to say',
};

const ORDERING_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A-Z' },
] as const;

const Followers: React.FC<Props> = ({ onOpenSidebar }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followers, setFollowers] = useState<FollowerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ordering, setOrdering] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FollowerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const loadFollowers = useCallback(async (p: number, params: Omit<FollowerListParams, 'page' | 'page_size'> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFollowers({
        page: p,
        page_size: PAGE_SIZE,
        search: params.search || undefined,
        gender: params.gender || undefined,
        ordering: params.ordering as any || 'newest',
      });
      setFollowers(res.results);
      setTotalCount(res.count);
      setPage(res.page || p);
      setTotalPages(Math.max(1, Math.ceil(res.count / (res.page_size || PAGE_SIZE))));
    } catch (e: any) {
      setError(e?.message || 'Failed to load followers');
    } finally {
      setLoading(false);
    }
  }, []);

  const currentParams = useCallback(() => ({
    search: search.trim() || undefined,
    gender: genderFilter || undefined,
    ordering,
  }), [search, genderFilter, ordering]);

  useEffect(() => {
    loadFollowers(1, currentParams());
  }, [genderFilter, ordering]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadFollowers(1, currentParams());
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const goPage = (p: number) => {
    loadFollowers(p, currentParams());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDetail = async (userId: string) => {
    setSelectedId(userId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await getFollowerDetail(userId);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const recentCount = followers.filter(f => {
    const cutoff = Date.now() - 30 * 86400000;
    return f.followed_at && Date.parse(f.followed_at) >= cutoff;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white px-6 md:px-10 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
          <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors">
            <Menu size={24} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="tlb-page-title truncate">Followers</h1>
            <p className="tlb-page-sub">People following your brand on TLB</p>
          </div>
          <button
            onClick={() => loadFollowers(page, currentParams())}
            className="hidden sm:flex items-center gap-2 text-xs font-black text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-sm p-5 flex items-center gap-4 text-white">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Heart size={22} fill="currentColor" />
              </div>
              <div>
                <p className="text-3xl font-black leading-none">{totalCount.toLocaleString('en-IN')}</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1.5 text-white/80">Total Followers</p>
              </div>
              <Heart size={90} className="absolute -right-4 -bottom-5 text-white/10" fill="currentColor" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <UserPlus size={22} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 leading-none">{recentCount}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">New on this page · 30 days</p>
              </div>
            </div>
          </div>

          {/* Search & filters bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex-1">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-gray-300"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-bold transition-colors ${
                  showFilters || genderFilter ? 'bg-tlb-yellow/10 border-tlb-yellow text-gray-900' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                } shadow-sm`}
              >
                <SlidersHorizontal size={14} /> Filters
                {genderFilter && <span className="w-1.5 h-1.5 rounded-full bg-tlb-yellow" />}
              </button>
              <div className="relative">
                <select
                  value={ordering}
                  onChange={e => setOrdering(e.target.value as any)}
                  className="appearance-none bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 pr-8 text-xs font-bold text-gray-500 cursor-pointer hover:border-gray-200 transition-colors"
                >
                  {ORDERING_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-gray-400 self-center mr-1">Gender:</span>
                    {['', 'male', 'female', 'other', 'prefer_not_to_say'].map(g => (
                      <button
                        key={g}
                        onClick={() => setGenderFilter(g)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          genderFilter === g
                            ? 'bg-tlb-yellow text-tlb-dark'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {g ? (GENDER_LABELS[g] || g) : 'All'}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <RefreshCw size={26} className="text-gray-300 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <AlertCircle size={34} className="text-red-300" />
              <p className="text-sm font-bold text-gray-500">{error}</p>
              <button onClick={() => loadFollowers(page, currentParams())} className="text-xs font-black text-blue-500 hover:underline">Try again</button>
            </div>
          ) : followers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Users size={30} className="text-rose-300" />
              </div>
              <p className="text-sm font-bold text-gray-500">
                {search || genderFilter ? 'No followers match your filters' : 'No followers yet'}
              </p>
              <p className="text-xs text-gray-400 max-w-xs">
                {search || genderFilter
                  ? 'Try adjusting your search or filters.'
                  : 'When people follow your brand on the TLB app, they\'ll appear here.'}
              </p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <p className="text-xs font-bold text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString('en-IN')}
              </p>

              {/* Follower cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {followers.map((f, i) => (
                  <motion.button
                    key={f.user_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
                    whileHover={{ y: -2 }}
                    onClick={() => openDetail(f.user_id)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3.5 hover:shadow-md hover:border-gray-200 transition-shadow text-left w-full"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${tintFor(f.user_id)}`}>
                      {initials(f.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-900 truncate">{f.full_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 font-medium flex-wrap">
                        {f.city && (
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <MapPin size={11} className="shrink-0" /> <span className="truncate">{f.city}</span>
                          </span>
                        )}
                        {f.gender && (
                          <span className="inline-flex items-center gap-1">
                            <User size={11} className="shrink-0" /> {GENDER_LABELS[f.gender] || f.gender}
                          </span>
                        )}
                        {f.followed_at && (
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <Calendar size={11} /> {fmtRelative(f.followed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </motion.button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => goPage(page - 1)}
                    disabled={page <= 1}
                    className="p-2 rounded-xl bg-white border border-gray-100 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) {
                        p = i + 1;
                      } else if (page <= 3) {
                        p = i + 1;
                      } else if (page >= totalPages - 2) {
                        p = totalPages - 4 + i;
                      } else {
                        p = page - 2 + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => goPage(p)}
                          className={`w-9 h-9 rounded-xl text-xs font-black transition-colors ${
                            p === page
                              ? 'bg-tlb-yellow text-tlb-dark shadow-sm'
                              : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => goPage(page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 rounded-xl bg-white border border-gray-100 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Follower Detail Drawer */}
      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetail}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="font-black text-lg">Follower Details</h2>
                <button onClick={closeDetail} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto p-6">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className="text-gray-300 animate-spin" />
                  </div>
                ) : detail ? (
                  <div className="space-y-6">
                    {/* Profile header */}
                    <div className="text-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto font-black text-xl ${tintFor(detail.user_id)}`}>
                        {initials(detail.full_name)}
                      </div>
                      <h3 className="font-black text-xl text-gray-900 mt-3">{detail.full_name}</h3>
                      <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-400 font-medium flex-wrap">
                        {detail.city && (
                          <span className="inline-flex items-center gap-1"><MapPin size={12} /> {detail.city}</span>
                        )}
                        {detail.gender && (
                          <span className="inline-flex items-center gap-1"><User size={12} /> {GENDER_LABELS[detail.gender] || detail.gender}</span>
                        )}
                        {detail.age && (
                          <span>{detail.age} years</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">
                        Followed on {fmtDate(detail.followed_at)}
                      </p>
                    </div>

                    {/* Contact info */}
                    {(detail.email || detail.phone) && (
                      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</p>
                        {detail.email && (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                              <Mail size={16} className="text-blue-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-400 font-medium">Email</p>
                              <p className="text-sm font-bold text-gray-800 truncate">{detail.email}</p>
                            </div>
                          </div>
                        )}
                        {detail.phone && (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                              <Phone size={16} className="text-emerald-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-400 font-medium">Phone</p>
                              <p className="text-sm font-bold text-gray-800">{detail.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Engagement */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Engagement</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
                            <ShoppingBag size={16} className="text-amber-500" />
                          </div>
                          <p className="text-2xl font-black text-gray-900">{detail.engagement.bookings_with_you}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">Bookings with you</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
                            <Clock size={16} className="text-purple-500" />
                          </div>
                          <p className="text-sm font-black text-gray-900 mt-1">
                            {detail.engagement.last_booking_at ? fmtRelative(detail.engagement.last_booking_at) : 'None'}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">Last booking</p>
                        </div>
                      </div>
                    </div>

                    {/* Engagement badge */}
                    {detail.engagement.bookings_with_you > 0 && (
                      <div className={`rounded-2xl p-4 flex items-center gap-3 ${
                        detail.engagement.bookings_with_you >= 5
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100'
                          : 'bg-emerald-50 border border-emerald-100'
                      }`}>
                        <Heart
                          size={20}
                          className={detail.engagement.bookings_with_you >= 5 ? 'text-amber-500' : 'text-emerald-500'}
                          fill="currentColor"
                        />
                        <div>
                          <p className={`text-sm font-bold ${detail.engagement.bookings_with_you >= 5 ? 'text-amber-800' : 'text-emerald-800'}`}>
                            {detail.engagement.bookings_with_you >= 5 ? 'Loyal Customer' : 'Returning Customer'}
                          </p>
                          <p className={`text-[11px] ${detail.engagement.bookings_with_you >= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {detail.engagement.bookings_with_you} booking{detail.engagement.bookings_with_you > 1 ? 's' : ''} with you
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <AlertCircle size={30} className="text-gray-300" />
                    <p className="text-sm font-bold text-gray-500">Could not load details</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Followers;
