import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Bell, Check, IndianRupee, MessageCircle, Heart, Layers, Megaphone,
    Star, AlertCircle, ShieldCheck, Loader2,
} from 'lucide-react';
import { Screen } from '../types';
import {
    getUnreadCount, listNotifications, markNotificationRead,
    markAllNotificationsRead, InAppNotification,
} from '../api/notifications';
import { useDismiss } from '../hooks/useDismiss';
import { timeAgo } from '../utils/format';
import { IconTile, Tone } from './portal';

const POLL_MS = 60000;
const PREVIEW_LIMIT = 7;

interface Props {
    /** Navigates to the dedicated Messages screen (See all / individual item). */
    onNavigate?: (screen: Screen) => void;
}

const metaFor = (type: string): { icon: React.ElementType; tone: Tone } => {
    const t = (type || '').toLowerCase();
    if (t.includes('refund') || t.includes('cancel') || t.includes('failed')) return { icon: AlertCircle, tone: 'red' };
    if (t.includes('booking')) return { icon: Check, tone: 'green' };
    if (t.includes('payout') || t.includes('payment')) return { icon: IndianRupee, tone: 'blue' };
    if (t.includes('enquiry') || t.includes('lead')) return { icon: MessageCircle, tone: 'red' };
    if (t.includes('review') || t.includes('rating')) return { icon: Star, tone: 'amber' };
    if (t.includes('listing')) return { icon: Layers, tone: 'amber' };
    if (t.includes('follower')) return { icon: Heart, tone: 'purple' };
    if (t === 'broadcast') return { icon: Megaphone, tone: 'amber' };
    return { icon: ShieldCheck, tone: 'neutral' };
};

// Bell button + unread badge. Opens a dropdown with the latest notifications;
// "See all" jumps to the dedicated Messages screen.
export const NotificationCenter: React.FC<Props> = ({ onNavigate }) => {
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<InAppNotification[] | null>(null);
    const [loading, setLoading] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    useDismiss(rootRef, open, () => setOpen(false));

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
        <div ref={rootRef} className="relative flex-none">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
                className={`relative w-[38px] h-[38px] rounded-[10px] border border-tlb-line flex items-center justify-center text-tlb-ink transition-colors ${open ? 'bg-tlb-wash' : 'bg-white hover:bg-tlb-wash'}`}
            >
                <Bell size={16} strokeWidth={2.75} />
                {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-tlb-red text-white text-[10px] font-bold flex items-center justify-center">
                        {badge}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="dialog"
                        aria-label="Notifications"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="pt-popover absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-[17px] py-[13px] border-b border-tlb-divider">
                            <span className="pt-h-sec">Notifications</span>
                            {unread > 0 && (
                                <button type="button" onClick={markAll} className="pt-link text-xs">Mark all read</button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto px-[17px] pt-1 pb-2">
                            {loading && items === null ? (
                                <div className="flex items-center justify-center py-10 text-tlb-muted">
                                    <Loader2 size={20} className="animate-spin" />
                                </div>
                            ) : items && items.length > 0 ? (
                                items.map(n => {
                                    const meta = metaFor(n.notification_type);
                                    const sub = [n.body, timeAgo(n.created_at)].filter(Boolean).join(' · ');
                                    return (
                                        <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => openItem(n)}
                                            className="w-full text-left flex items-center gap-[11px] py-[9px] border-b border-tlb-divider last:border-b-0 hover:bg-tlb-highlight transition-colors"
                                        >
                                            <IconTile tone={meta.tone} icon={meta.icon} />
                                            <span className="flex-1 min-w-0">
                                                <span className={`block text-[12.5px] leading-snug text-tlb-ink ${n.is_read ? 'font-semibold' : 'font-bold'}`}>{n.title}</span>
                                                {sub && <span className="block text-[11px] text-tlb-muted mt-px truncate">{sub}</span>}
                                            </span>
                                            {!n.is_read && <span className="w-[7px] h-[7px] rounded-full bg-tlb-amber flex-none" aria-label="Unread" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <IconTile tone="neutral" icon={Bell} size="md" />
                                    <p className="text-[13px] font-bold text-tlb-ink mt-3">You're all caught up</p>
                                    <p className="text-[11.5px] text-tlb-muted mt-0.5">New notifications will show up here.</p>
                                </div>
                            )}
                        </div>

                        <div className="px-[17px] py-[11px] border-t border-tlb-divider text-center">
                            <button type="button" onClick={() => { setOpen(false); onNavigate?.('MESSAGES'); }} className="pt-link text-xs">
                                See all notifications
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
