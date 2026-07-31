import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft, ArrowRight, Search, RefreshCw, AlertCircle, Inbox, Send, Check, X,
    MapPin, BadgeCheck, Ban, Layers, Building2, Globe, Instagram, Facebook, Phone, Mail,
    Users, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Screen } from '../../types';
import { Select, SelectOption, toast } from '../../components/ui';
import { getPartnerCategories, getCurrentPartner } from '../../api/onboarding';
import {
    listNetworkPartners, getNetworkPartner, blockPartner, unblockPartner, listBlockedPartners,
    listConversations, startConversation, sendConversationMessage,
    NetworkPartner, NetworkPartnerDetail, NetworkListing, Conversation,
} from '../../api/network';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

const initials = (name: string) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

// Deterministic brand gradient so each partner gets a stable, distinct banner.
const GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-600',
    'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
    'from-sky-500 to-indigo-500',
];
// Solid initial colour that matches each gradient (same index) — used for the
// logo-less avatar tile. A solid colour renders reliably; `bg-clip-text`
// gradient text does not (it comes out invisible in this Tailwind setup).
const INITIAL_COLORS = [
    'text-violet-600',
    'text-blue-600',
    'text-emerald-600',
    'text-orange-600',
    'text-rose-600',
    'text-indigo-600',
    'text-fuchsia-600',
    'text-sky-600',
];
const brandIndex = (seed: string): number => {
    let h = 0;
    for (let i = 0; i < (seed || '').length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h % GRADIENTS.length;
};
const brandGradient = (seed: string): string => GRADIENTS[brandIndex(seed)];
const brandInitialColor = (seed: string): string => INITIAL_COLORS[brandIndex(seed)];

// `categories` may arrive as a comma-string, a JSON array, or a real array
// depending on backend serialization — normalise all shapes to the first label.
const firstCategory = (categories: unknown): string => {
    if (!categories) return '';
    if (Array.isArray(categories)) {
        const first = categories[0];
        return (typeof first === 'string' ? first : (first as any)?.name ?? '').toString().trim();
    }
    if (typeof categories === 'string') {
        const s = categories.trim();
        if (s.startsWith('[')) { try { return firstCategory(JSON.parse(s)); } catch { /* fall through */ } }
        return s.split(',')[0]?.trim() || '';
    }
    return '';
};

const otherPartnerId = (c: Conversation): string =>
    typeof c.other_partner === 'object' ? String(c.other_partner?.id || '') : '';

const parseListings = (l: NetworkPartnerDetail['listings']): NetworkListing[] => {
    if (Array.isArray(l)) return l;
    if (typeof l === 'string') { try { const p = JSON.parse(l); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
};

type QuickFilter = 'all' | 'verified' | 'pinged';

export const PartnerNetwork: React.FC<Props> = ({ onOpenSidebar }) => {
    const [ownName, setOwnName] = useState('');
    const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
    const [pingedIds, setPingedIds] = useState<Set<string>>(new Set());

    // Discover
    const [partners, setPartners] = useState<NetworkPartner[]>([]);
    const [loadingPartners, setLoadingPartners] = useState(true);
    const [partnersError, setPartnersError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState<SelectOption[]>([]);
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

    // Profile
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [profile, setProfile] = useState<NetworkPartnerDetail | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [blocking, setBlocking] = useState(false);
    const [pinging, setPinging] = useState(false);
    const [pingOpen, setPingOpen] = useState(false);
    const [pingText, setPingText] = useState('');

    // ── Mount: own name, categories, blocked + already-pinged partners ──
    useEffect(() => {
        getCurrentPartner()
            .then((res: any) => {
                const d = res?.data || res || {};
                setOwnName(d.business_name || d.business_profile?.business_name || 'A partner');
            })
            .catch(() => {});
        getPartnerCategories().then((res: any) => {
            const d = res?.data || res;
            const arr = Array.isArray(d) ? d : (d?.results ?? []);
            setCategories(arr.filter((c: any) => c?.id != null).map((c: any) => ({ value: String(c.id), label: c.name || String(c.id) })));
        }).catch(() => {});
        listBlockedPartners().then(list => {
            setBlockedIds(new Set(list.map((b: any) => String(b?.id ?? b?.partner_id ?? b?.partner?.id)).filter(Boolean)));
        }).catch(() => {});
        // Partners we've already pinged = partners we already have a conversation with.
        listConversations().then(list => {
            setPingedIds(new Set(list.map(otherPartnerId).filter(Boolean)));
        }).catch(() => {});
    }, []);

    const loadPartners = async () => {
        setLoadingPartners(true);
        setPartnersError(null);
        try {
            const list = await listNetworkPartners({
                search: search.trim() || undefined,
                category_id: categoryId ? Number(categoryId) : undefined,
            });
            setPartners(list);
        } catch (e: any) {
            setPartnersError(e?.message || 'Failed to load partners');
        } finally {
            setLoadingPartners(false);
        }
    };

    // Debounced search / category reload
    useEffect(() => {
        const t = setTimeout(loadPartners, 300);
        return () => clearTimeout(t);
    }, [search, categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Derived stats + client-side quick filter ──
    const verifiedCount = useMemo(() => partners.filter(p => p.is_verified).length, [partners]);
    const inNetworkCount = useMemo(() => partners.filter(p => pingedIds.has(p.id)).length, [partners, pingedIds]);
    const visiblePartners = useMemo(() => partners.filter(p => {
        if (quickFilter === 'verified') return p.is_verified;
        if (quickFilter === 'pinged') return pingedIds.has(p.id);
        return true;
    }), [partners, quickFilter, pingedIds]);

    // ── Profile ──
    const openProfile = async (id: string) => {
        setSelectedId(id);
        setProfile(null);
        setLoadingProfile(true);
        try { setProfile(await getNetworkPartner(id)); }
        catch (e: any) { toast.error(e?.message || 'Failed to load profile'); setSelectedId(null); }
        finally { setLoadingProfile(false); }
    };

    const toggleBlock = async (id: string) => {
        const isBlocked = blockedIds.has(id);
        setBlocking(true);
        try {
            if (isBlocked) { await unblockPartner(id); setBlockedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); toast.success('Partner unblocked.'); }
            else { await blockPartner(id); setBlockedIds(prev => new Set(prev).add(id)); toast.success('Partner blocked.'); }
        } catch (e: any) { toast.error(e?.message || 'Failed to update block status'); }
        finally { setBlocking(false); }
    };

    // ── Single message: compose ONE message (like an enquiry) — no chat thread ──
    const openMessage = () => {
        if (!profile || pingedIds.has(profile.id)) return;
        setPingText(`Hi ${profile.business_name}, this is ${ownName || 'a fellow partner'}. We'd love to collaborate with you — could we connect?`);
        setPingOpen(true);
    };

    const sendMessage = async () => {
        const body = pingText.trim();
        if (!profile || !body || pinging) return;
        setPinging(true);
        try {
            const convo = await startConversation(profile.id);
            if (!convo?.id) { toast.error('Could not send message.'); return; }
            await sendConversationMessage(convo.id, body);
            setPingedIds(prev => new Set(prev).add(profile.id));
            setPingOpen(false);
            toast.success('Message sent! Your enquiry has been delivered.');
        } catch (e: any) {
            toast.error(e?.message || 'Could not send message');
        } finally {
            setPinging(false);
        }
    };

    // =======================================================================
    // Header
    // =======================================================================
    const back = () => { setSelectedId(null); setProfile(null); };

    const header = (
        <header className="bg-white px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
            {selectedId && (
                <button onClick={back} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-900">
                    <ArrowLeft size={20} /><span className="hidden sm:inline text-sm font-bold">Back</span>
                </button>
            )}
            <div className="flex-1 min-w-0">
                <h1 className="tlb-page-title truncate">{profile ? profile.business_name : 'Partner Network'}</h1>
                <p className="tlb-page-sub">{profile ? (profile.base_city || 'Partner profile') : 'Discover partners & send a collaboration ping'}</p>
            </div>
        </header>
    );

    // =======================================================================
    // Profile view
    // =======================================================================
    if (selectedId) {
        const isBlocked = profile ? blockedIds.has(profile.id) : false;
        const alreadyPinged = profile ? pingedIds.has(profile.id) : false;
        const listings = profile ? parseListings(profile.listings) : [];
        const grad = profile ? brandGradient(profile.business_name || profile.id) : GRADIENTS[0];
        const socials = profile ? [
            { url: profile.website_url, icon: Globe, label: 'Website' },
            { url: profile.instagram_url, icon: Instagram, label: 'Instagram' },
            { url: profile.facebook_url, icon: Facebook, label: 'Facebook' },
        ].filter(s => s.url) : [];
        const stats = profile ? [
            { label: 'Listings', value: String(profile.published_listing_count || listings.length) },
            { label: 'Base City', value: profile.base_city || '—' },
            { label: 'Status', value: profile.is_verified ? 'Verified' : 'Partner' },
        ] : [];
        return (
            <div className="min-h-screen bg-gray-50">
                {header}
                {loadingProfile || !profile ? (
                    <div className="flex items-center justify-center py-24"><RefreshCw size={26} className="text-gray-300 animate-spin" /></div>
                ) : (
                    <main className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">
                        {/* Profile card */}
                        <motion.div
                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className={`h-28 bg-gradient-to-br ${grad} relative overflow-hidden`}>
                                {(profile.cover_image || profile.cover_image_url)
                                    ? <img src={profile.cover_image || profile.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    : <span className="absolute -right-4 -top-6 text-white/15 font-black text-[9rem] leading-none select-none">{initials(profile.business_name)}</span>}
                            </div>
                            <div className="px-6 pb-6">
                                <div className="relative z-10 w-24 h-24 -mt-12 rounded-3xl bg-white shadow-md ring-4 ring-white overflow-hidden flex items-center justify-center">
                                    {profile.logo
                                        ? <img src={profile.logo} alt="" className="w-full h-full object-cover" />
                                        : <span className={`text-3xl font-black ${brandInitialColor(profile.business_name || profile.id)}`}>{initials(profile.business_name)}</span>}
                                </div>
                                <div className="mt-3">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-black text-gray-900 truncate">{profile.business_name}</h2>
                                        {profile.is_verified && <BadgeCheck size={20} className="text-blue-500 shrink-0" />}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                        {profile.base_city && <p className="text-sm text-gray-400 font-medium flex items-center gap-1"><MapPin size={13} /> {profile.base_city}</p>}
                                        {firstCategory(profile.categories) && (
                                            <span className="text-[11px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{firstCategory(profile.categories)}</span>
                                        )}
                                    </div>
                                </div>

                                {profile.bio && <p className="text-sm text-gray-600 leading-relaxed mt-4">{profile.bio}</p>}

                                {/* Stat pills */}
                                <div className="grid grid-cols-3 gap-3 mt-5">
                                    {stats.map(s => (
                                        <div key={s.label} className="rounded-2xl bg-gray-50 border border-gray-100 px-3 py-3 text-center">
                                            <p className="text-sm font-black text-gray-900 truncate" title={s.value}>{s.value}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-xs font-bold text-gray-500">
                                    {profile.contact_number && <span className="flex items-center gap-1.5"><Phone size={13} className="text-gray-400" /> {profile.contact_number}</span>}
                                    {profile.email && <span className="flex items-center gap-1.5"><Mail size={13} className="text-gray-400" /> {profile.email}</span>}
                                    {profile.operating_cities && <span className="flex items-center gap-1.5"><Building2 size={13} className="text-gray-400" /> {profile.operating_cities}</span>}
                                </div>

                                {socials.length > 0 && (
                                    <div className="flex items-center gap-2 mt-4">
                                        {socials.map(s => (
                                            <a key={s.label} href={s.url!} target="_blank" rel="noreferrer" title={s.label}
                                                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                                                <s.icon size={16} />
                                            </a>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mt-6">
                                    <button
                                        onClick={openMessage}
                                        disabled={isBlocked || alreadyPinged}
                                        className="tlb-button flex-1 sm:flex-none px-6 py-3 disabled:opacity-50"
                                    >
                                        {alreadyPinged ? <Check size={18} /> : <Send size={18} />}
                                        {alreadyPinged ? 'Message Sent' : 'Send Message'}
                                    </button>
                                    <button onClick={() => toggleBlock(profile.id)} disabled={blocking}
                                        className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 ${isBlocked ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>
                                        <Ban size={16} /> {isBlocked ? 'Unblock' : 'Block'}
                                    </button>
                                </div>
                                {!isBlocked && (
                                    <p className="text-[11px] text-gray-400 mt-2">
                                        {alreadyPinged
                                            ? 'You’ve already sent this partner a message.'
                                            : 'Send a single message (like an enquiry). This is a one-time message, not a chat.'}
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        {/* Published listings */}
                        <div>
                            <h3 className="tlb-label mb-3">Published Listings</h3>
                            {listings.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm font-bold text-gray-400">
                                    No public listings to show.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {listings.map((l, i) => (
                                        <div key={l.id || i} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                                            <div className={`h-24 bg-gradient-to-br ${brandGradient(String(l.title || l.id || i))}`}>
                                                {l.cover_url && <img src={l.cover_url} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="p-4">
                                                <p className="font-bold text-sm text-gray-900 truncate">{l.title || 'Untitled'}</p>
                                                <p className="text-[11px] text-gray-400 font-medium mt-0.5 capitalize">{(l.listing_type || '').toString()}{l.city ? ` · ${l.city}` : ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                )}

                {/* Single-message compose popup */}
                {pingOpen && profile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !pinging && setPingOpen(false)}>
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Partner</p>
                                    <p className="font-black text-gray-900 truncate">{profile.business_name}</p>
                                </div>
                                <button onClick={() => !pinging && setPingOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" aria-label="Close">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-5 space-y-3">
                                <textarea
                                    value={pingText}
                                    onChange={e => setPingText(e.target.value)}
                                    rows={4}
                                    maxLength={500}
                                    autoFocus
                                    placeholder="Write a short enquiry…"
                                    className="tlb-input w-full resize-none"
                                />
                                <p className="text-[11px] text-gray-400">You can send <span className="font-bold text-gray-600">one message only</span> — like an enquiry. The partner cannot be messaged again from here.</p>
                                <div className="flex items-center justify-end gap-2 pt-1">
                                    <button onClick={() => setPingOpen(false)} disabled={pinging}
                                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
                                        Cancel
                                    </button>
                                    <button onClick={sendMessage} disabled={pinging || !pingText.trim()}
                                        className="tlb-button px-5 py-2.5 disabled:opacity-50">
                                        {pinging ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                                        Send Message
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // =======================================================================
    // Directory
    // =======================================================================
    const chips: { key: QuickFilter; label: string; count: number }[] = [
        { key: 'all', label: 'All partners', count: partners.length },
        { key: 'verified', label: 'Verified', count: verifiedCount },
        { key: 'pinged', label: 'In your network', count: inNetworkCount },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {header}
            <main className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
                {/* Community hero */}
                <motion.section
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tlb-dark via-gray-900 to-black p-6 md:p-8 text-white">
                    <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-tlb-yellow/15 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute -left-10 -bottom-16 w-52 h-52 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="relative">
                        <div className="inline-flex items-center gap-1.5 text-tlb-yellow text-[11px] font-black uppercase tracking-widest">
                            <Sparkles size={13} /> Partner Community
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black mt-2 leading-tight">Grow together with fellow partners</h2>
                        <p className="text-sm text-gray-400 font-medium mt-1.5 max-w-lg">Discover businesses across TLB, explore their listings, and send a one-time collaboration message.</p>

                        <div className="grid grid-cols-3 gap-3 mt-6 max-w-lg">
                            {[
                                { icon: Users, value: partners.length, label: 'Partners' },
                                { icon: ShieldCheck, value: verifiedCount, label: 'Verified' },
                                { icon: Sparkles, value: inNetworkCount, label: 'In network' },
                            ].map(s => (
                                <div key={s.label} className="rounded-2xl bg-white/10 ring-1 ring-white/10 px-3 py-3">
                                    <s.icon size={16} className="text-tlb-yellow" />
                                    <p className="text-xl font-black mt-1.5 tabular-nums">{loadingPartners ? '—' : s.value}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Toolbar: search + category */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm focus-within:border-tlb-yellow/60 focus-within:ring-2 focus-within:ring-tlb-yellow/20 transition">
                        <Search size={16} className="text-gray-400 shrink-0" />
                        <input className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-gray-300"
                            placeholder="Search by business name or city…" value={search} onChange={e => setSearch(e.target.value)} />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 transition-colors" aria-label="Clear search"><X size={15} /></button>
                        )}
                    </div>
                    {categories.length > 0 && (
                        <div className="md:w-56">
                            <Select value={categoryId} onChange={setCategoryId}
                                options={[{ value: '', label: 'All categories' }, ...categories]}
                                ariaLabel="Filter by category" placeholder="All categories" />
                        </div>
                    )}
                </div>

                {/* Quick filter chips */}
                <div className="flex flex-wrap items-center gap-2">
                    {chips.map(c => {
                        const active = quickFilter === c.key;
                        return (
                            <button key={c.key} onClick={() => setQuickFilter(c.key)}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-black transition-colors ${
                                    active ? 'bg-tlb-dark text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                                {c.label}
                                <span className={`min-w-[18px] px-1 rounded-full text-[10px] leading-4 text-center ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{c.count}</span>
                            </button>
                        );
                    })}
                </div>

                {loadingPartners ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="h-20 bg-gray-100 animate-pulse" />
                                <div className="px-5 pb-5">
                                    <div className="relative z-10 w-16 h-16 -mt-10 rounded-2xl bg-gray-200 ring-4 ring-white animate-pulse" />
                                    <div className="h-3.5 w-2/3 bg-gray-200 rounded-full animate-pulse mt-3" />
                                    <div className="h-2.5 w-1/3 bg-gray-100 rounded-full animate-pulse mt-2" />
                                    <div className="h-2.5 w-full bg-gray-100 rounded-full animate-pulse mt-4" />
                                    <div className="h-2.5 w-4/5 bg-gray-100 rounded-full animate-pulse mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : partnersError ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
                        <AlertCircle size={32} className="text-red-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-500">{partnersError}</p>
                        <button onClick={loadPartners} className="text-xs font-black text-blue-500 hover:underline mt-3">Try again</button>
                    </div>
                ) : visiblePartners.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
                        <Inbox size={32} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-400">
                            {partners.length === 0 ? 'No partners found.' : 'No partners match this filter.'}
                        </p>
                        {quickFilter !== 'all' && partners.length > 0 && (
                            <button onClick={() => setQuickFilter('all')} className="text-xs font-black text-blue-500 hover:underline mt-3">Show all partners</button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                        {visiblePartners.map((p, i) => {
                            const grad = brandGradient(p.business_name || p.id);
                            const isBlocked = blockedIds.has(p.id);
                            const isPinged = pingedIds.has(p.id);
                            const cat = firstCategory(p.categories);
                            return (
                                <motion.button key={p.id}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.25) }}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.985 }}
                                    onClick={() => openProfile(p.id)}
                                    className="group relative flex flex-col text-left bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden">
                                    {/* Brand banner — fixed height, never stretches */}
                                    <div className={`relative h-20 shrink-0 overflow-hidden bg-gradient-to-br ${grad}`}>
                                        <span className="absolute right-2 top-0 text-white/20 font-black text-5xl leading-none select-none">{initials(p.business_name)}</span>
                                        {(isBlocked || isPinged) && (
                                            <span className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wide backdrop-blur ${
                                                isBlocked ? 'bg-black/40 text-red-200' : 'bg-black/30 text-emerald-200'}`}>
                                                {isBlocked ? <><Ban size={10} /> Blocked</> : <><Check size={10} /> Pinged</>}
                                            </span>
                                        )}
                                    </div>

                                    <div className="px-5 pb-5 flex flex-col flex-1">
                                        {/* Avatar overlaps the banner — relative z-10 so it paints ABOVE the positioned banner */}
                                        <div className="relative z-10 w-16 h-16 -mt-10 rounded-2xl bg-white ring-4 ring-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                                            {p.logo
                                                ? <img src={p.logo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                                                : <span className={`text-2xl font-black ${brandInitialColor(p.business_name || p.id)}`}>{initials(p.business_name)}</span>}
                                        </div>

                                        <div className="mt-3 flex items-center gap-1.5">
                                            <p className="font-black text-gray-900 truncate">{p.business_name}</p>
                                            {p.is_verified && <BadgeCheck size={15} className="text-blue-500 shrink-0" />}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1">
                                            {p.base_city && <p className="text-xs text-gray-400 font-medium flex items-center gap-1 truncate"><MapPin size={11} /> {p.base_city}</p>}
                                            {cat && <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{cat}</span>}
                                        </div>

                                        <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-snug min-h-[2rem]">{p.bio || ''}</p>

                                        {/* Footer pinned to the bottom for a uniform grid */}
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5"><Layers size={12} className="text-gray-400" /> {p.published_listing_count} listings</span>
                                            <span className="text-[11px] font-black text-gray-400 group-hover:text-tlb-dark inline-flex items-center gap-1 transition-colors duration-300">
                                                View profile
                                                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
                                            </span>
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PartnerNetwork;
