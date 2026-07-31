import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Bell, Ticket, IndianRupee, MessageSquare, Heart, ClipboardList, Megaphone,
    CheckCheck, ArrowRight, Loader2,
} from 'lucide-react';
import { Screen } from '../types';
import {
    getUnreadCount, listNotifications, markNotificationRead,
    markAllNotificationsRead, InAppNotification,
} from '../api/notifications';

const POLL_MS = 60000;
const PREVIEW_LIMIT = 5;

interface Props {
    /** 'dark' for the navy sidebar, 'light' for white headers. */
    variant?: 'dark' | 'light';
    /** Navigates to the dedicated Messages screen (View all / individual item). */
    onNavigate?: (screen: Screen) => void;
}

const TINT: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-100 text-gray-500',
};

const metaFor = (type: string): { icon: React.ElementType; tint: string } => {
    const t = (type || '').toLowerCase();
    if (t.includes('booking')) return { icon: Ticket, tint: 'emerald' };
    if (t.includes('payment') || t.includes('payout') || t.includes('refund')) return { icon: IndianRupee, tint: 'amber' };
    if (t.includes('enquiry') || t.includes('lead')) return { icon: MessageSquare, tint: 'blue' };
    if (t.includes('follower')) return { icon: Heart, tint: 'rose' };
    if (t.includes('listing')) return { icon: ClipboardList, tint: 'purple' };
    if (t === 'broadcast') return { icon: Megaphone, tint: 'blue' };
    return { icon: Bell, tint: 'gray' };
};

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

// Bell button + unread badge. Clicking opens a lightweight dropdown with the
// latest notifications; "View all" jumps to the dedicated Messages screen.
export const NotificationCenter: React.FC<Props> = ({ variant = 'dark', onNavigate }) => {
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<InAppNotification[] | null>(null);
    const [loading, setLoading] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const refreshUnread = useCallback(() => {
        getUnreadCount().then(setUnread).catch(() => { /* silent */ });
    }, []);

    useEffect(() => {
        refreshUnread();
        const iv = setInterval(refreshUnread, POLL_MS);
        return () => clearInterval(iv);
    }, [refreshUnread]);

    // Fetch the latest few whenever the dropdown opens.
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        listNotifications({ page_size: PREVIEW_LIMIT })
            .then(p => setItems(p.results))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [open]);

    // Close on outside click / Escape.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const badge = unread > 99 ? '99+' : String(unread);

    const openItem = (n: InAppNotification) => {
        setOpen(false);
        if (!n.is_read) {
            markNotificationRead(n.id).catch(() => { /* non-fatal */ });
            setUnread(u => Math.max(0, u - 1));
            setItems(list => list?.map(x => x.id === n.id ? { ...x, is_read: true } : x) ?? list);
        }
        onNavigate?.('MESSAGES');
    };

    const markAll = () => {
        markAllNotificationsRead().catch(() => { /* non-fatal */ });
        setUnread(0);
        setItems(list => list?.map(x => ({ ...x, is_read: true })) ?? list);
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={`relative rounded-xl transition-colors ${
                    variant === 'light'
                        ? `p-2.5 text-gray-500 hover:bg-gray-50 ${open ? 'bg-gray-100 text-gray-900' : ''}`
                        : `p-2 text-gray-300 hover:bg-white/10 hover:text-white ${open ? 'bg-white/10 text-white' : ''}`
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

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl shadow-black/20 border border-gray-200 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-gray-900">Notifications</p>
                                {unread > 0 && (
                                    <span className="min-w-[18px] h-[18px] px-1.5 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">{badge}</span>
                                )}
                            </div>
                            {unread > 0 && (
                                <button onClick={markAll} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                    <CheckCheck size={13} /> Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[380px] overflow-y-auto">
                            {loading && items === null ? (
                                <div className="flex items-center justify-center py-10 text-gray-400">
                                    <Loader2 size={20} className="animate-spin" />
                                </div>
                            ) : items && items.length > 0 ? (
                                items.map(n => {
                                    const m = metaFor(n.notification_type);
                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => openItem(n)}
                                            className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${n.is_read ? '' : 'bg-yellow-50/40'}`}
                                        >
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TINT[m.tint]}`}>
                                                <m.icon size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start gap-2">
                                                    <p className={`text-[13px] leading-snug flex-1 ${n.is_read ? 'font-semibold text-gray-800' : 'font-black text-gray-900'}`}>{n.title}</p>
                                                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />}
                                                </div>
                                                {n.body && <p className="text-[12px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{n.body}</p>}
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">{timeAgo(n.created_at)}</p>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                                    <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                                        <Bell size={20} />
                                    </div>
                                    <p className="text-sm font-black text-gray-900">You're all caught up</p>
                                    <p className="text-[12px] text-gray-400 mt-0.5">New notifications will show up here.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <button
                            onClick={() => { setOpen(false); onNavigate?.('MESSAGES'); }}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-3 border-t border-gray-100 text-[13px] font-black text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            View all notifications <ArrowRight size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
