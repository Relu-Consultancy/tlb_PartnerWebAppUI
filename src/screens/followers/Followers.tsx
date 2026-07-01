import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
    Menu, Search, X, RefreshCw, AlertCircle, Users, Heart, MapPin,
    Calendar, UserPlus,
} from 'lucide-react';
import { Screen } from '../../types';
import { getCurrentPartner, getPartnerFollowers, getPartnerFollowerCount, PartnerFollower } from '../../api/onboarding';

interface Props { onNavigate: (s: Screen) => void; onOpenSidebar: () => void; }

const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// Backend field names for a follower vary; read every plausible key.
const normalize = (f: any): PartnerFollower => {
    const user = f?.user ?? f?.follower ?? f;
    return {
        id: String(f?.id ?? user?.id ?? f?.user_id ?? Math.random()),
        name: user?.name || user?.full_name || user?.display_name || f?.name || user?.username || 'TLB User',
        avatar: user?.avatar || user?.profile_image || user?.photo || user?.image || f?.avatar || null,
        city: user?.city || user?.base_city || f?.city || null,
        followed_at: f?.followed_at || f?.created_at || f?.followed_on || user?.created_at || null,
    };
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

const Followers: React.FC<Props> = ({ onOpenSidebar }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [followers, setFollowers] = useState<PartnerFollower[]>([]);
    const [count, setCount] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const me = await getCurrentPartner();
            const partner = me?.data ?? me;
            const pid = String(partner?.id ?? '');
            if (!pid) throw new Error('Could not resolve your partner account');

            const [rawList, countRes] = await Promise.all([
                getPartnerFollowers(pid).catch(() => [] as any[]),
                getPartnerFollowerCount(pid).catch(() => null),
            ]);

            const list = rawList.map(normalize);
            setFollowers(list);
            const c = (countRes?.data ?? countRes)?.follower_count;
            setCount(typeof c === 'number' ? c : list.length);
        } catch (e: any) {
            setError(e?.message || 'Failed to load followers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q
            ? followers.filter(f => f.name.toLowerCase().includes(q) || (f.city || '').toLowerCase().includes(q))
            : followers;
        return [...list].sort((a, b) => {
            const ta = a.followed_at ? Date.parse(a.followed_at) : 0;
            const tb = b.followed_at ? Date.parse(b.followed_at) : 0;
            return tb - ta; // most recent first
        });
    }, [followers, search]);

    const totalDisplay = count === null ? '—' : count.toLocaleString('en-IN');
    // How many joined in the last 30 days.
    const recentCount = useMemo(() => {
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return followers.filter(f => f.followed_at && Date.parse(f.followed_at) >= cutoff).length;
    }, [followers]);

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
                        <p className="tlb-page-sub">People following your brand on the TLB app</p>
                    </div>
                    <button
                        onClick={loadAll}
                        className="hidden sm:flex items-center gap-2 text-xs font-black text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
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
                    ) : (
                        <>
                            {/* Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-sm p-5 flex items-center gap-4 text-white">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                        <Heart size={22} fill="currentColor" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black leading-none">{totalDisplay}</p>
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
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">New · last 30 days</p>
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            {followers.length > 0 && (
                                <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
                                    <Search size={16} className="text-gray-400 shrink-0" />
                                    <input
                                        className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-gray-300"
                                        placeholder="Search followers by name or city…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>}
                                </div>
                            )}

                            {/* List */}
                            {followers.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-20 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center"><Users size={30} className="text-rose-300" /></div>
                                    <p className="text-sm font-bold text-gray-500">
                                        {count && count > 0 ? `You have ${totalDisplay} followers` : 'No followers yet'}
                                    </p>
                                    <p className="text-xs text-gray-400 max-w-xs">
                                        {count && count > 0
                                            ? 'The detailed follower list isn’t available right now — check back soon.'
                                            : 'When people follow your brand on the TLB app, they’ll appear here.'}
                                    </p>
                                </div>
                            ) : visible.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-16 text-center">
                                    <Users size={30} className="text-gray-200" />
                                    <p className="text-sm font-bold text-gray-400">No followers match “{search}”</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {visible.map((f, i) => (
                                        <motion.div
                                            key={f.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
                                            whileHover={{ y: -2 }}
                                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3.5 hover:shadow-md hover:border-gray-200 transition-shadow"
                                        >
                                            {f.avatar ? (
                                                <img src={f.avatar} alt={f.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${tintFor(f.id)}`}>
                                                    {initials(f.name)}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-sm text-gray-900 truncate">{f.name}</p>
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 font-medium">
                                                    {f.city && (
                                                        <span className="inline-flex items-center gap-1 min-w-0">
                                                            <MapPin size={11} className="shrink-0" /> <span className="truncate">{f.city}</span>
                                                        </span>
                                                    )}
                                                    {f.followed_at && (
                                                        <span className="inline-flex items-center gap-1 shrink-0">
                                                            <Calendar size={11} /> {fmtDate(f.followed_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Followers;
