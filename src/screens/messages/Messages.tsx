import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, CheckCheck, RefreshCw, Inbox, ExternalLink, Megaphone, Settings2 } from 'lucide-react';
import { Screen } from '../../types';
import { toast } from '../../components/ui';
import {
    listNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
    getNotificationPreferences, updateNotificationPreferences,
    InAppNotification, NotificationPreferences,
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

const Messages: React.FC<Props> = ({ onOpenSidebar }) => {
    const [items, setItems] = useState<InAppNotification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const [showPrefs, setShowPrefs] = useState(false);
    const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
    const [savingPref, setSavingPref] = useState<string | null>(null);

    const refreshUnread = useCallback(() => {
        getUnreadCount().then(setUnread).catch(() => { /* silent */ });
    }, []);

    const loadPage = useCallback(async (pg: number) => {
        setLoading(true);
        try {
            const res = await listNotifications({ page: pg, page_size: 20 });
            setItems(prev => pg === 1 ? res.results : [...prev, ...res.results]);
            setHasNext(!!res.next);
            setPage(pg);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPage(1); refreshUnread(); }, [loadPage, refreshUnread]);

    const handleItemClick = async (n: InAppNotification) => {
        if (!n.is_read) {
            try {
                await markNotificationRead(n.id);
                setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x));
                setUnread(u => Math.max(0, u - 1));
            } catch { /* non-fatal */ }
        }
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

    const togglePrefs = () => {
        const next = !showPrefs;
        setShowPrefs(next);
        if (next && !prefs) getNotificationPreferences().then(setPrefs).catch(() => { /* silent */ });
    };

    const setPref = async (key: keyof NotificationPreferences, value: boolean) => {
        setSavingPref(key);
        setPrefs(prev => prev ? { ...prev, [key]: value } : prev);
        try {
            const updated = await updateNotificationPreferences({ [key]: value });
            setPrefs(updated);
        } catch (e: any) {
            setPrefs(prev => prev ? { ...prev, [key]: !value } : prev);
            toast.error(e?.message || 'Failed to update preference');
        } finally {
            setSavingPref(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white px-6 md:px-10 py-5 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
                <button onClick={onOpenSidebar} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors"><Menu size={24} /></button>
                <div className="flex-1 min-w-0">
                    <h1 className="tlb-page-title flex items-center gap-2">
                        Messages
                        {unread > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-600 align-middle">{unread} new</span>}
                    </h1>
                    <p className="tlb-page-sub">Booking alerts, collaboration pings &amp; announcements</p>
                </div>
                <button onClick={togglePrefs} title="Notification preferences"
                    className={`p-2.5 rounded-xl transition-colors ${showPrefs ? 'bg-tlb-yellow/20 text-tlb-dark' : 'text-gray-400 hover:bg-gray-100'}`}>
                    <Settings2 size={18} />
                </button>
            </header>

            <main className="p-5 md:p-8 max-w-3xl mx-auto space-y-4">
                {/* Preferences */}
                <AnimatePresence>
                    {showPrefs && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin Broadcasts</p>
                                {prefs ? (
                                    [
                                        { key: 'broadcast_in_app' as const, label: 'In-app notifications' },
                                        { key: 'broadcast_email' as const, label: 'Emails' },
                                    ].map(({ key, label }) => {
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
                                    })
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold"><RefreshCw size={12} className="animate-spin" /> Loading…</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mark all */}
                {items.some(i => !i.is_read) && (
                    <div className="flex justify-end">
                        <button onClick={handleMarkAll} disabled={markingAll}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50">
                            {markingAll ? <RefreshCw size={12} className="animate-spin" /> : <CheckCheck size={13} />} Mark all read
                        </button>
                    </div>
                )}

                {/* List */}
                {loading && items.length === 0 ? (
                    <div className="flex items-center justify-center py-24"><RefreshCw size={26} className="text-gray-300 animate-spin" /></div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-24 text-center">
                        <Inbox size={34} className="text-gray-200" />
                        <p className="text-sm font-bold text-gray-400">You're all caught up</p>
                        <p className="text-xs text-gray-400">New messages &amp; alerts will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {items.map((n, i) => {
                            const isBroadcast = n.notification_type === 'broadcast';
                            return (
                                <motion.button
                                    key={n.id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.2) }}
                                    onClick={() => handleItemClick(n)}
                                    className={`w-full text-left rounded-2xl border shadow-sm p-4 flex gap-3 transition-colors ${
                                        n.is_read ? 'bg-white border-gray-100 hover:border-gray-200' : 'bg-tlb-yellow/[0.07] border-tlb-yellow/30 hover:border-tlb-yellow/50'
                                    }`}
                                >
                                    <div className="shrink-0 mt-0.5">
                                        {!n.is_read
                                            ? <span className="block w-2.5 h-2.5 rounded-full bg-tlb-yellow ring-2 ring-tlb-yellow/30" />
                                            : <span className="block w-2.5 h-2.5 rounded-full bg-gray-200" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            {isBroadcast && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wider">
                                                    <Megaphone size={9} /> Admin
                                                </span>
                                            )}
                                            <p className={`text-sm truncate ${n.is_read ? 'font-bold text-gray-700' : 'font-black text-gray-900'}`}>{n.title}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{n.body}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] font-bold text-gray-400">{timeAgo(n.created_at)}</span>
                                            {n.action_url && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500">Open <ExternalLink size={10} /></span>}
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                        {hasNext && (
                            <div className="pt-2 text-center">
                                <button onClick={() => loadPage(page + 1)} disabled={loading}
                                    className="text-xs font-black text-blue-500 hover:underline disabled:opacity-50">
                                    {loading ? 'Loading…' : 'Load more'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Messages;
