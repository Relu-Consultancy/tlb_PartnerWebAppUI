import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
    Menu, ArrowLeft, Search, RefreshCw, AlertCircle, Inbox, Send, MessageSquare,
    MapPin, BadgeCheck, Ban, Layers, Building2, Globe, Instagram, Facebook, Phone, Mail, Users,
} from 'lucide-react';
import { Screen } from '../../types';
import { Select, SelectOption, toast } from '../../components/ui';
import { getPartnerCategories, getCurrentPartner } from '../../api/onboarding';
import {
    listNetworkPartners, getNetworkPartner, blockPartner, unblockPartner, listBlockedPartners,
    listConversations, startConversation, getConversationMessages, sendConversationMessage, markConversationRead,
    NetworkPartner, NetworkPartnerDetail, NetworkListing, Conversation, NetworkMessage,
} from '../../api/network';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

const timeAgo = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const initials = (name: string) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
const convoName = (c: Conversation): string =>
    typeof c.other_partner === 'string' ? c.other_partner : (c.other_partner?.business_name || 'Partner');

const parseListings = (l: NetworkPartnerDetail['listings']): NetworkListing[] => {
    if (Array.isArray(l)) return l;
    if (typeof l === 'string') { try { const p = JSON.parse(l); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
};

export const PartnerNetwork: React.FC<Props> = ({ onOpenSidebar }) => {
    const [tab, setTab] = useState<'discover' | 'messages'>('discover');
    const [ownId, setOwnId] = useState('');
    const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

    // Discover
    const [partners, setPartners] = useState<NetworkPartner[]>([]);
    const [loadingPartners, setLoadingPartners] = useState(true);
    const [partnersError, setPartnersError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState<SelectOption[]>([]);

    // Profile
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [profile, setProfile] = useState<NetworkPartnerDetail | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [blocking, setBlocking] = useState(false);

    // Conversations
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loadingConvos, setLoadingConvos] = useState(false);

    // Chat
    const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<NetworkMessage[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // ── Mount: own email, categories, blocked, partners ──
    useEffect(() => {
        // My partner id — used to tell which messages are mine (compare to sender.id)
        getCurrentPartner()
            .then((res: any) => {
                const d = res?.data || res || {};
                setOwnId(String(d.id || d.partner?.id || d.partner_id || ''));
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

    const loadConversations = async () => {
        setLoadingConvos(true);
        try { setConversations(await listConversations()); }
        catch (e: any) { toast.error(e?.message || 'Failed to load conversations'); }
        finally { setLoadingConvos(false); }
    };

    const openMessagesTab = () => {
        setTab('messages');
        loadConversations();
    };

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

    // ── Chat ──
    const openChat = async (convo: Conversation) => {
        setActiveConvo(convo);
        setMessages([]);
        setReply('');
        setLoadingChat(true);
        try {
            const msgs = await getConversationMessages(convo.id);
            setMessages(msgs);
            markConversationRead(convo.id).catch(() => {});
            setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, unread_count: 0 } : c));
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load messages');
        } finally {
            setLoadingChat(false);
        }
    };

    const pingPartner = async () => {
        if (!profile) return;
        try {
            const convo = await startConversation(profile.id);
            if (!convo?.id) {
                toast.error('Could not start conversation.');
                return;
            }
            setProfile(null);
            setSelectedId(null);
            setTab('messages');
            openChat(convo);
            loadConversations(); // refresh the list in the background
        } catch (e: any) {
            toast.error(e?.message || 'Could not start conversation');
        }
    };

    // Poll the open chat
    useEffect(() => {
        if (!activeConvo) return;
        const iv = setInterval(async () => {
            try { setMessages(await getConversationMessages(activeConvo.id)); } catch { /* silent */ }
        }, 15000);
        return () => clearInterval(iv);
    }, [activeConvo]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length]);

    const refreshChat = async () => {
        if (!activeConvo) return;
        setRefreshing(true);
        try { setMessages(await getConversationMessages(activeConvo.id)); }
        catch (e: any) { toast.error(e?.message || 'Failed to refresh'); }
        finally { setRefreshing(false); }
    };

    const sendReply = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const body = reply.trim();
        if (!body || !activeConvo) return;
        setSending(true);
        try {
            await sendConversationMessage(activeConvo.id, body);
            setReply('');
            setMessages(await getConversationMessages(activeConvo.id));
        } catch (e: any) {
            toast.error(e?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

    // =======================================================================
    // Header
    // =======================================================================
    const back = () => {
        if (activeConvo) { setActiveConvo(null); loadConversations(); return; }
        if (selectedId) { setSelectedId(null); setProfile(null); return; }
    };

    const header = (
        <header className="bg-white px-5 md:px-8 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
            {(activeConvo || selectedId) ? (
                <button onClick={back} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-900">
                    <ArrowLeft size={20} /><span className="hidden sm:inline text-sm font-bold">Back</span>
                </button>
            ) : (
                <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
            )}
            <div className="flex-1 min-w-0">
                <h1 className="tlb-page-title truncate">
                    {activeConvo ? convoName(activeConvo) : profile ? profile.business_name : 'Partner Network'}
                </h1>
                <p className="tlb-page-sub">
                    {activeConvo ? 'Conversation' : profile ? (profile.base_city || 'Partner profile') : 'Discover partners & collaborate'}
                </p>
            </div>
        </header>
    );

    // =======================================================================
    // Chat view
    // =======================================================================
    if (activeConvo) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
                {header}
                <div className="bg-white border-b border-gray-100 px-5 md:px-8 py-2.5 flex items-center justify-end">
                    <button onClick={refreshChat} disabled={refreshing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
                        <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
                {loadingChat ? (
                    <div className="flex-1 flex items-center justify-center"><RefreshCw size={26} className="text-gray-300 animate-spin" /></div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                        <div className="max-w-3xl mx-auto space-y-3">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-16 text-center">
                                    <MessageSquare size={30} className="text-gray-200" />
                                    <p className="text-sm font-bold text-gray-400">Say hello to start the conversation.</p>
                                </div>
                            ) : messages.map(m => {
                                const otherId = typeof activeConvo.other_partner === 'object'
                                    ? String(activeConvo.other_partner.id || '') : '';
                                // Per API: a message is yours when sender.id === your partner id.
                                const mine = ownId && m.sender_id
                                    ? m.sender_id === ownId
                                    : (otherId && m.sender_id ? m.sender_id !== otherId : false);
                                return (
                                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-tlb-yellow text-tlb-dark rounded-br-md' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'}`}>
                                            {!mine && <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{m.sender_name || convoName(activeConvo)}</p>}
                                            {m.body && <p className="text-sm leading-snug whitespace-pre-wrap break-words">{m.body}</p>}
                                            {m.attachments.map(att => (
                                                <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer"
                                                    className={`mt-1 flex items-center gap-1.5 text-xs font-bold underline ${mine ? 'text-tlb-dark/80' : 'text-blue-600'}`}>
                                                    📎 {att.file_name}
                                                </a>
                                            ))}
                                            <p className={`text-[10px] mt-1 ${mine ? 'text-tlb-dark/50' : 'text-gray-400'}`}>{fmtTime(m.created_at)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>
                    </div>
                )}
                <div className="bg-white border-t border-gray-100 px-4 md:px-8 py-4">
                    <form onSubmit={sendReply} className="max-w-3xl mx-auto flex items-end gap-3">
                        <textarea
                            rows={1} value={reply}
                            onChange={e => setReply(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e); } }}
                            placeholder="Type your message…"
                            className="flex-1 tlb-input resize-none max-h-32 py-3"
                        />
                        <button type="submit" disabled={sending || !reply.trim()} className="tlb-button !px-4 py-3 shrink-0 disabled:opacity-50">
                            {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // =======================================================================
    // Profile view
    // =======================================================================
    if (selectedId) {
        const isBlocked = profile ? blockedIds.has(profile.id) : false;
        const listings = profile ? parseListings(profile.listings) : [];
        const socials = profile ? [
            { url: profile.website_url, icon: Globe, label: 'Website' },
            { url: profile.instagram_url, icon: Instagram, label: 'Instagram' },
            { url: profile.facebook_url, icon: Facebook, label: 'Facebook' },
        ].filter(s => s.url) : [];
        return (
            <div className="min-h-screen bg-gray-50">
                {header}
                {loadingProfile || !profile ? (
                    <div className="flex items-center justify-center py-24"><RefreshCw size={26} className="text-gray-300 animate-spin" /></div>
                ) : (
                    <main className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">
                        {/* Profile card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="h-24 bg-gradient-to-br from-slate-700 to-slate-900">
                                {profile.cover_image && <img src={profile.cover_image} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="px-6 pb-6">
                                {/* Avatar overlaps the cover; name + details sit in the white area below */}
                                <div className="w-20 h-20 -mt-10 rounded-2xl bg-white shadow-md ring-4 ring-white overflow-hidden flex items-center justify-center">
                                    {profile.logo
                                        ? <img src={profile.logo} alt="" className="w-full h-full object-cover" />
                                        : <span className="text-2xl font-black text-gray-300">{initials(profile.business_name)}</span>}
                                </div>
                                <div className="mt-3">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-gray-900 truncate">{profile.business_name}</h2>
                                        {profile.is_verified && <BadgeCheck size={18} className="text-blue-500 shrink-0" />}
                                    </div>
                                    {profile.base_city && <p className="text-sm text-gray-400 font-medium flex items-center gap-1 mt-0.5"><MapPin size={13} /> {profile.base_city}</p>}
                                </div>

                                {profile.bio && <p className="text-sm text-gray-600 leading-relaxed mt-4">{profile.bio}</p>}

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs font-bold text-gray-500">
                                    <span className="flex items-center gap-1.5"><Layers size={13} className="text-gray-400" /> {profile.published_listing_count || listings.length} listings</span>
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
                                    <button onClick={pingPartner} disabled={isBlocked} className="tlb-button flex-1 sm:flex-none px-6 py-3 disabled:opacity-50">
                                        <MessageSquare size={18} /> Ping / Message
                                    </button>
                                    <button onClick={() => toggleBlock(profile.id)} disabled={blocking}
                                        className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 ${isBlocked ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>
                                        <Ban size={16} /> {isBlocked ? 'Unblock' : 'Block'}
                                    </button>
                                </div>
                            </div>
                        </div>

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
                                        <div key={l.id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="h-24 bg-gray-100">
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
            </div>
        );
    }

    // =======================================================================
    // Directory + Messages tabs
    // =======================================================================
    return (
        <div className="min-h-screen bg-gray-50">
            {header}
            <main className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
                {/* Tabs */}
                <div className="inline-flex bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                    <button onClick={() => setTab('discover')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'discover' ? 'bg-tlb-dark text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                        <Users size={15} /> Discover
                    </button>
                    <button onClick={openMessagesTab}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'messages' ? 'bg-tlb-dark text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                        <MessageSquare size={15} /> Messages
                        {totalUnread > 0 && <span className="text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5">{totalUnread}</span>}
                    </button>
                </div>

                {tab === 'discover' ? (
                    <>
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
                                <Search size={16} className="text-gray-400 shrink-0" />
                                <input className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-gray-300"
                                    placeholder="Search by business name or city…" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            {categories.length > 0 && (
                                <div className="md:w-56">
                                    <Select value={categoryId} onChange={setCategoryId}
                                        options={[{ value: '', label: 'All categories' }, ...categories]}
                                        ariaLabel="Filter by category" placeholder="All categories" />
                                </div>
                            )}
                        </div>

                        {loadingPartners ? (
                            <div className="flex items-center justify-center py-24"><RefreshCw size={26} className="text-gray-300 animate-spin" /></div>
                        ) : partnersError ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
                                <AlertCircle size={32} className="text-red-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-gray-500">{partnersError}</p>
                                <button onClick={loadPartners} className="text-xs font-black text-blue-500 hover:underline mt-3">Try again</button>
                            </div>
                        ) : partners.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
                                <Inbox size={32} className="text-gray-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-gray-400">No partners found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                                {partners.map((p, i) => (
                                    <motion.button key={p.id}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.25) }}
                                        onClick={() => openProfile(p.id)}
                                        className="group text-left bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-200 transition-all p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                                {p.logo ? <img src={p.logo} alt="" className="w-full h-full object-cover" /> : <span className="font-black text-gray-300">{initials(p.business_name)}</span>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-black text-gray-900 truncate">{p.business_name}</p>
                                                    {p.is_verified && <BadgeCheck size={15} className="text-blue-500 shrink-0" />}
                                                </div>
                                                {p.base_city && <p className="text-xs text-gray-400 font-medium flex items-center gap-1 truncate"><MapPin size={11} /> {p.base_city}</p>}
                                            </div>
                                        </div>
                                        {p.bio && <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-snug">{p.bio}</p>}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5"><Layers size={12} className="text-gray-400" /> {p.published_listing_count} listings</span>
                                            {blockedIds.has(p.id)
                                                ? <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Blocked</span>
                                                : <span className="text-[11px] font-black text-tlb-dark group-hover:underline">View →</span>}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    // Messages tab
                    loadingConvos ? (
                        <div className="flex items-center justify-center py-24"><RefreshCw size={26} className="text-gray-300 animate-spin" /></div>
                    ) : conversations.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
                            <MessageSquare size={32} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-400">No conversations yet</p>
                            <p className="text-xs text-gray-400 mt-1">Find a partner in Discover and send them a ping.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {conversations.map((c, i) => (
                                <motion.button key={c.id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                                    onClick={() => openChat(c)}
                                    className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-4 flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-2xl bg-tlb-yellow/15 flex items-center justify-center shrink-0 font-black text-tlb-dark text-sm">
                                        {initials(convoName(c))}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900 truncate">{convoName(c)}</p>
                                            {c.unread_count > 0 && <span className="shrink-0 text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5">{c.unread_count}</span>}
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{c.last_message_preview || 'No messages yet'}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 shrink-0">{timeAgo(c.last_message_at)}</span>
                                </motion.button>
                            ))}
                        </div>
                    )
                )}
            </main>
        </div>
    );
};

export default PartnerNetwork;
