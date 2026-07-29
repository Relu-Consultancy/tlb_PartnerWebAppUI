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
  const uniqueCities = new Set(followers.map(f => f.city).filter(Boolean)).size;

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
          {/* Community hero */}
          <motion.section
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-600 text-white p-6 sm:p-8 shadow-lg shadow-pink-500/20"
          >
            <div className="absolute -right-12 -top-16 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-10 bottom-0 w-44 h-44 bg-fuchsia-400/20 rounded-full blur-2xl" />
            <Heart size={170} className="absolute -right-6 -bottom-14 text-white/10 rotate-12" fill="currentColor" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Your community</p>
                <div className="flex items-end gap-2.5 mt-1.5">
                  <motion.p
                    key={totalCount}
                    initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    className="text-5xl sm:text-6xl font-black leading-none tracking-tight"
                  >
                    {totalCount.toLocaleString('en-IN')}
                  </motion.p>
                  <p className="text-sm font-bold text-white/80 mb-1.5">followers</p>
                </div>
                {followers.length > 0 && (
                  <div className="flex items-center gap-3 mt-5">
                    <div className="flex -space-x-3">
                      {followers.slice(0, 6).map((f, i) => (
                        <motion.div
                          key={f.user_id}
                          initial={{ scale: 0, x: -6 }} animate={{ scale: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                          className={`w-9 h-9 rounded-full ring-2 ring-white/80 flex items-center justify-center text-[11px] font-black ${tintFor(f.user_id)}`}
                        >
                          {initials(f.full_name)}
                        </motion.div>
                      ))}
                      {totalCount > Math.min(followers.length, 6) && (
                        <div className="w-9 h-9 rounded-full ring-2 ring-white/80 bg-white/20 backdrop-blur flex items-center justify-center text-[10px] font-black text-white">
                          +{totalCount - Math.min(followers.length, 6)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-white/70 hidden sm:inline">people who love your brand</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 shrink-0">
                <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-4 text-center min-w-[92px]">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mx-auto mb-2"><UserPlus size={16} /></div>
                  <p className="text-2xl font-black leading-none">{recentCount}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mt-1.5">New · 30d</p>
                </div>
                <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-4 text-center min-w-[92px]">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mx-auto mb-2"><MapPin size={16} /></div>
                  <p className="text-2xl font-black leading-none">{uniqueCities}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mt-1.5">Cities</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Search & filters bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex-1">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-gray-300"
                placeholder="Search followers by name or email…"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3.5 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3.5 w-1/2 bg-gray-100 rounded-full" />
                    <div className="h-2.5 w-3/4 bg-gray-50 rounded-full" />
                  </div>
                </div>
              ))}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {followers.map((f, i) => {
                  const isNew = !!f.followed_at && (Date.now() - Date.parse(f.followed_at)) < 7 * 86400000;
                  const tintText = tintFor(f.user_id).split(' ')[1] || 'text-rose-600';
                  return (
                    <motion.button
                      key={f.user_id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: Math.min(i * 0.04, 0.4) }}
                      whileHover={{ y: -4 }}
                      onClick={() => openDetail(f.user_id)}
                      className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-xl hover:shadow-rose-500/5 hover:border-rose-100 transition-all text-left w-full"
                    >
                      {/* soft rose wash on hover */}
                      <div className="pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full bg-rose-400 blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                      <div className="relative flex items-center gap-4">
                        {/* gradient-ring avatar */}
                        <div className="relative shrink-0 p-[2px] rounded-full bg-gradient-to-br from-rose-300 to-pink-500 transition-transform duration-300 group-hover:scale-105">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                            <span className={`font-black text-base ${tintText}`}>{initials(f.full_name)}</span>
                          </div>
                          {isNew && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-[15px] text-gray-900 truncate">{f.full_name}</p>
                            {isNew && <span className="shrink-0 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">New</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {f.city && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 rounded-full px-2 py-1 min-w-0">
                                <MapPin size={10} className="shrink-0 text-gray-400" /> <span className="truncate max-w-[90px]">{f.city}</span>
                              </span>
                            )}
                            {f.gender && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 rounded-full px-2 py-1">
                                <User size={10} className="shrink-0 text-gray-400" /> {GENDER_LABELS[f.gender] || f.gender}
                              </span>
                            )}
                            {f.followed_at && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 rounded-full px-2 py-1 shrink-0">
                                <Calendar size={10} className="text-gray-400" /> {fmtRelative(f.followed_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* hover-reveal view affordance */}
                        <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 text-gray-300 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
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
