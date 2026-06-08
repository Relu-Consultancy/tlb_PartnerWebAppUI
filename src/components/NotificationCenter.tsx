import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, X, CheckCheck, RefreshCw, Inbox, ExternalLink, Megaphone, Settings2 } from 'lucide-react';
import {
    listNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
    getNotificationPreferences, updateNotificationPreferences,
    InAppNotification, NotificationPreferences,
} from '../api/notifications';
import { toast } from './ui';

const timeAgo = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const POLL_MS = 60000;

interface Props {
    /** 'dark' for the navy sidebar, 'light' for white headers. */
    variant?: 'dark' | 'light';
}

export const NotificationCenter: React.FC<Props> = ({ variant = 'dark' }) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<InAppNotification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    // Preferences
    const [showPrefs, setShowPrefs] = useState(false);
    const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
    const [savingPref, setSavingPref] = useState<string | null>(null);

    const refreshUnread = useCallback(() => {
        getUnreadCount().then(setUnread).catch(() => { /* silent */ });
    }, []);

    // Poll unread count for the badge
    useEffect(() => {
        refreshUnread();
        const iv = setInterval(refreshUnread, POLL_MS);
        return () => clearInterval(iv);
    }, [refreshUnread]);

    const loadPage = useCallback(async (pg: number) => {
        setLoading(true);
        try {
            const res = await listNotifications({ page: pg, page_size: 15 });
            setItems(prev => pg === 1 ? res.results : [...prev, ...res.results]);
            setHasNext(!!res.next);
            setPage(pg);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    const openDrawer = () => {
        setOpen(true);
        loadPage(1);
        refreshUnread();
    };

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
        if (next && !prefs) {
            getNotificationPreferences().then(setPrefs).catch(() => { /* silent */ });
        }
    };

    const setPref = async (key: keyof NotificationPreferences, value: boolean) => {
        setSavingPref(key);
        setPrefs(prev => prev ? { ...prev, [key]: value } : prev); // optimistic
        try {
            const updated = await updateNotificationPreferences({ [key]: value });
            setPrefs(updated);
        } catch (e: any) {
            setPrefs(prev => prev ? { ...prev, [key]: !value } : prev); // revert
            toast.error(e?.message || 'Failed to update preference');
        } finally {
            setSavingPref(null);
        }
    };

    const badge = unread > 99 ? '99+' : String(unread);

    return (
        <>
            <button
                onClick={openDrawer}
                className={`relative rounded-xl transition-colors ${
                    variant === 'light'
                        ? 'p-2.5 text-gray-500 hover:bg-gray-50'
                        : 'p-2 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
            >
                <Bell size={variant === 'light' ? 20 : 18} />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                        {badge}
                    </span>
                )}
            </button>

            {createPortal(
                <AnimatePresence>
                    {open && (
                        <div className="fixed inset-0 z-[120] flex justify-end">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                                onClick={() => setOpen(false)}
                            />
                            <motion.div
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                                className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col"
                            >
                                {/* Header */}
                                <div className="shrink-0 border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-black text-lg">Notifications</h2>
                                        {unread > 0 && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-600">{unread} new</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={togglePrefs} title="Notification preferences"
                                            className={`p-2 rounded-lg transition-colors ${showPrefs ? 'bg-tlb-yellow/20 text-tlb-dark' : 'text-gray-400 hover:bg-gray-100'}`}>
                                            <Settings2 size={16} />
                                        </button>
                                        <button onClick={() => setOpen(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Preferences panel */}
                                <AnimatePresence>
                                    {showPrefs && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-b border-gray-100 bg-gray-50"
                                        >
                                            <div className="px-5 py-4 space-y-3">
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
                                    <div className="shrink-0 px-5 py-2 border-b border-gray-50 flex justify-end">
                                        <button onClick={handleMarkAll} disabled={markingAll}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50">
                                            {markingAll ? <RefreshCw size={12} className="animate-spin" /> : <CheckCheck size={13} />} Mark all read
                                        </button>
                                    </div>
                                )}

                                {/* List */}
                                <div className="flex-1 overflow-y-auto">
                                    {loading && items.length === 0 ? (
                                        <div className="flex items-center justify-center py-20">
                                            <RefreshCw size={24} className="text-gray-300 animate-spin" />
                                        </div>
                                    ) : items.length === 0 ? (
                                        <div className="flex flex-col items-center gap-2 py-20 text-center px-6">
                                            <Inbox size={32} className="text-gray-200" />
                                            <p className="text-sm font-bold text-gray-400">You're all caught up</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {items.map(n => {
                                                const isBroadcast = n.notification_type === 'broadcast';
                                                return (
                                                    <button
                                                        key={n.id}
                                                        onClick={() => handleItemClick(n)}
                                                        className={`w-full text-left px-5 py-4 flex gap-3 hover:bg-gray-50/60 transition-colors ${n.is_read ? '' : 'bg-tlb-yellow/[0.06]'}`}
                                                    >
                                                        <div className="shrink-0 mt-0.5">
                                                            {!n.is_read
                                                                ? <span className="block w-2 h-2 rounded-full bg-tlb-yellow ring-2 ring-tlb-yellow/30" />
                                                                : <span className="block w-2 h-2 rounded-full bg-transparent" />}
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
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 whitespace-pre-wrap">{n.body}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-bold text-gray-400">{timeAgo(n.created_at)}</span>
                                                                {n.action_url && <ExternalLink size={11} className="text-gray-300" />}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {hasNext && (
                                                <div className="p-4 text-center">
                                                    <button onClick={() => loadPage(page + 1)} disabled={loading}
                                                        className="text-xs font-black text-blue-500 hover:underline disabled:opacity-50">
                                                        {loading ? 'Loading…' : 'Load more'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
};

export default NotificationCenter;
