import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    CheckCheck, RefreshCw, Inbox, ExternalLink, Megaphone, Bell, Check,
    Ticket, IndianRupee, MessageSquare, Heart, ClipboardList,
} from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import {
    listNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
    // getNotificationPreferences, updateNotificationPreferences, // prefs toggles disabled (backend not wired)
    InAppNotification, // NotificationPreferences,
} from '../../api/notifications';

interface Props { onNavigate: (s: Screen) => void; onOpenSidebar: () => void; }

const timeAgo = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Map a notification_type → an icon + soft tint + short category label for triage.
const typeMeta = (type: string): { icon: React.ElementType; tint: string; label: string } => {
    const t = (type || '').toLowerCase();
    if (t === 'broadcast') return { icon: Megaphone, tint: 'bg-blue-50 text-blue-600', label: 'Announcement' };
    if (t.includes('booking')) return { icon: Ticket, tint: 'bg-emerald-50 text-emerald-600', label: 'Booking' };
    if (t.includes('payment') || t.includes('payout') || t.includes('refund')) return { icon: IndianRupee, tint: 'bg-amber-50 text-amber-600', label: 'Payment' };
    if (t.includes('enquiry') || t.includes('lead')) return { icon: MessageSquare, tint: 'bg-sky-50 text-sky-600', label: 'Enquiry' };
    if (t.includes('follower')) return { icon: Heart, tint: 'bg-rose-50 text-rose-600', label: 'Follower' };
    if (t.includes('listing') || t.includes('review')) return { icon: ClipboardList, tint: 'bg-purple-50 text-purple-600', label: 'Listing' };
    return { icon: Bell, tint: 'bg-gray-100 text-gray-500', label: 'Update' };
};

// Bucket a timestamp into a human date group.
const bucketOf = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Earlier';
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const startYest = new Date(startToday); startYest.setDate(startYest.getDate() - 1);
    const start7 = new Date(startToday); start7.setDate(start7.getDate() - 7);
    if (d >= startToday) return 'Today';
    if (d >= startYest) return 'Yesterday';
    if (d >= start7) return 'This week';
    return 'Earlier';
};
const BUCKET_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier'];

// Group a notification into a section: your own activity, admin broadcasts, or followers.
type Category = 'self' | 'admin' | 'followers';
const categoryOf = (type: string): Category => {
    const t = (type || '').toLowerCase();
    if (t === 'broadcast') return 'admin';
    if (t.includes('follower')) return 'followers';
    return 'self';
};

type Filter = 'all' | 'unread' | Category;

const Messages: React.FC<Props> = ({ onOpenSidebar }) => {
    const [items, setItems] = useState<InAppNotification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');

    // Admin-broadcast preference toggles disabled — backend not wired yet.
    // const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
    // const [savingPref, setSavingPref] = useState<string | null>(null);

    const refreshUnread = useCallback(() => {
        getUnreadCount().then(setUnread).catch(() => { /* silent */ });
    }, []);

    const loadPage = useCallback(async (pg: number) => {
        setLoading(true);
        try {
            const res = await listNotifications({ page: pg, page_size: 20, unread: filter === 'unread' || undefined });
            setItems(prev => pg === 1 ? res.results : [...prev, ...res.results]);
            setHasNext(!!res.next);
            setPage(pg);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    // Reload page 1 whenever the filter changes; refresh the unread badge on mount.
    useEffect(() => { loadPage(1); }, [loadPage]);
    useEffect(() => { refreshUnread(); }, [refreshUnread]);
    // useEffect(() => { getNotificationPreferences().then(setPrefs).catch(() => { /* silent */ }); }, []);

    const markOne = async (id: string) => {
        try {
            await markNotificationRead(id);
            setItems(prev => prev.map(x => x.id === id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x));
            setUnread(u => Math.max(0, u - 1));
        } catch { /* non-fatal */ }
    };

    const handleItemClick = (n: InAppNotification) => {
        if (!n.is_read) markOne(n.id);
        if (n.action_url) window.open(n.action_url, '_blank', 'noopener,noreferrer');
    };

    const handleMarkAll = async () => {
        setMarkingAll(true);
        try {
            await markAllNotificationsRead();
            setItems(prev => prev.map(x => ({ ...x, is_read: true })));
            setUnread(0);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to mark all read');
        } finally {
            setMarkingAll(false);
        }
    };

    // Preference toggles disabled until the backend PATCH is wired.
    // const setPref = async (key: keyof NotificationPreferences, value: boolean) => {
    //     setSavingPref(key);
    //     setPrefs(prev => prev ? { ...prev, [key]: value } : prev);
    //     try {
    //         const updated = await updateNotificationPreferences({ [key]: value });
    //         setPrefs(prev => ({ ...(prev || {}), ...(updated || {}), [key]: value }));
    //     } catch (e: any) {
    //         setPrefs(prev => prev ? { ...prev, [key]: !value } : prev);
    //         toast.error(e?.message || 'Failed to update preference');
    //     } finally {
    //         setSavingPref(null);
    //     }
    // };

    // Client-side section filter (self / admin / followers). 'all' and 'unread'
    // are handled by the API load; sections narrow the already-loaded page.
    const isSection = filter === 'self' || filter === 'admin' || filter === 'followers';
    const visibleItems = isSection ? items.filter(n => categoryOf(n.notification_type) === filter) : items;

    const groups = BUCKET_ORDER
        .map(label => ({ label, items: visibleItems.filter(n => bucketOf(n.created_at) === label) }))
        .filter(g => g.items.length > 0);

    const sectionCount = (c: Category) => items.filter(n => categoryOf(n.notification_type) === c).length;

    const primaryTabs: { key: Filter; label: string; icon: React.ElementType; badge: number }[] = [
        { key: 'all', label: 'All', icon: Inbox, badge: 0 },
        { key: 'unread', label: 'Unread', icon: Bell, badge: unread },
    ];
    const sectionTabs: { key: Filter; label: string; icon: React.ElementType; badge: number }[] = [
        { key: 'self', label: 'My Activity', icon: ClipboardList, badge: sectionCount('self') },
        { key: 'admin', label: 'Admin', icon: Megaphone, badge: sectionCount('admin') },
        { key: 'followers', label: 'Followers', icon: Heart, badge: sectionCount('followers') },
    ];

    const renderTab = (t: { key: Filter; label: string; icon: React.ElementType; badge: number }) => {
        const active = filter === t.key;
        return (
            <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`flex-1 lg:flex-none flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    active ? 'bg-tlb-yellow/15 text-tlb-dark' : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
                <span className="flex items-center gap-2.5"><t.icon size={16} /> {t.label}</span>
                {t.badge > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-tlb-yellow text-tlb-dark' : t.key === 'unread' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                        {t.badge}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white px-6 md:px-10 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                
                <div className="flex-1 min-w-0">
                    <h1 className="tlb-page-title flex items-center gap-2">
                        Messages
                        {unread > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-600 align-middle">{unread} new</span>}
                    </h1>
                    <p className="tlb-page-sub">Booking alerts, collaboration pings &amp; announcements</p>
                </div>
                <button onClick={() => { loadPage(1); refreshUnread(); }} title="Refresh"
                    className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <main className="p-4 md:p-8 max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
                    {/* Filter / preferences rail */}
                    <aside className="lg:sticky lg:top-24 space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                            {/* Primary filters */}
                            <div className="flex lg:flex-col gap-1.5">
                                {primaryTabs.map(renderTab)}
                            </div>

                            {/* Sections */}
                            <p className="px-3 mt-3 mb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sections</p>
                            <div className="flex lg:flex-col gap-1.5">
                                {sectionTabs.map(renderTab)}
                            </div>

                            <div className="my-2 border-t border-gray-50" />
                            <button
                                onClick={handleMarkAll}
                                disabled={markingAll || unread === 0}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                            >
                                {markingAll ? <RefreshCw size={16} className="animate-spin" /> : <CheckCheck size={16} />} Mark all read
                            </button>
                        </div>

                        {/* Preferences — disabled until the backend PATCH is wired.
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Admin Broadcasts</p>
                            {prefs ? (
                                <div className="space-y-3">
                                    {([
                                        { key: 'broadcast_in_app' as const, label: 'In-app' },
                                        { key: 'broadcast_email' as const, label: 'Emails' },
                                    ]).map(({ key, label }) => {
                                        const on = prefs[key] !== false;
                                        return (
                                            <div key={key} className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-gray-700">{label}</span>
                                                <button
                                                    onClick={() => setPref(key, !on)}
                                                    disabled={savingPref === key}
                                                    className={`relative w-10 h-6 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-gray-300'} disabled:opacity-60`}
                                                    aria-pressed={on}
                                                >
                                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold"><RefreshCw size={12} className="animate-spin" /> Loading…</div>
                            )}
                        </div>
                        */}
                    </aside>

                    {/* Notification list */}
                    <section className="min-w-0">
                        {loading && items.length === 0 ? (
                            <div className="space-y-2.5">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3.5 animate-pulse">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                                        <div className="flex-1 space-y-2.5 py-1">
                                            <div className="h-3.5 w-1/3 bg-gray-100 rounded-full" />
                                            <div className="h-2.5 w-3/4 bg-gray-50 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : visibleItems.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-tlb-yellow/10 flex items-center justify-center mb-1">
                                    <Inbox size={30} className="text-tlb-yellow" />
                                </div>
                                <p className="text-sm font-bold text-gray-500">
                                    {filter === 'unread' ? 'No unread messages'
                                        : filter === 'admin' ? 'No admin announcements'
                                        : filter === 'followers' ? 'No follower alerts'
                                        : filter === 'self' ? 'No activity alerts'
                                        : "You're all caught up"}
                                </p>
                                <p className="text-xs text-gray-400">New alerts &amp; announcements will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {groups.map(g => (
                                    <div key={g.label}>
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 px-1">{g.label}</p>
                                        <div className="space-y-2">
                                            <AnimatePresence initial={false}>
                                                {g.items.map((n, i) => {
                                                    const meta = typeMeta(n.notification_type);
                                                    const isBroadcast = n.notification_type === 'broadcast';
                                                    return (
                                                        <motion.div
                                                            key={n.id}
                                                            layout
                                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.15) }}
                                                            className={`group relative overflow-hidden rounded-2xl border p-4 flex gap-3.5 transition-all ${
                                                                n.is_read ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm' : 'bg-white border-gray-100 hover:shadow-md'
                                                            }`}
                                                        >
                                                            {/* unread accent bar */}
                                                            {!n.is_read && <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-tlb-yellow" />}
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.tint}`}>
                                                                <meta.icon size={18} />
                                                            </div>
                                                            <button onClick={() => handleItemClick(n)} className="min-w-0 flex-1 text-left">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        {isBroadcast && (
                                                                            <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wider shrink-0">
                                                                                <Megaphone size={9} /> Admin
                                                                            </span>
                                                                        )}
                                                                        <p className={`text-sm truncate ${n.is_read ? 'font-bold text-gray-700' : 'font-black text-gray-900'}`}>{n.title}</p>
                                                                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-tlb-yellow shrink-0" />}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-gray-400 shrink-0 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 whitespace-pre-wrap">{n.body}</p>
                                                                {n.action_url && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-500 mt-1.5">Open <ExternalLink size={10} /></span>
                                                                )}
                                                            </button>
                                                            {/* quick action: mark read */}
                                                            {!n.is_read && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); markOne(n.id); }}
                                                                    title="Mark as read"
                                                                    className="shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center"
                                                                >
                                                                    <Check size={15} />
                                                                </button>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ))}

                                {hasNext && (
                                    <div className="pt-1 text-center">
                                        <button onClick={() => loadPage(page + 1)} disabled={loading}
                                            className="text-xs font-black text-blue-500 hover:underline disabled:opacity-50">
                                            {loading ? 'Loading…' : 'Load more'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Messages;
