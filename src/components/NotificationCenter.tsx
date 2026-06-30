import React, { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Screen } from '../types';
import { getUnreadCount } from '../api/notifications';

const POLL_MS = 60000;

interface Props {
    /** 'dark' for the navy sidebar, 'light' for white headers. */
    variant?: 'dark' | 'light';
    /** Navigates to the dedicated Messages screen on click. */
    onNavigate?: (screen: Screen) => void;
}

// Bell button + unread badge. Opens the dedicated Messages screen
// (the old slide-in drawer was replaced by a full screen).
export const NotificationCenter: React.FC<Props> = ({ variant = 'dark', onNavigate }) => {
    const [unread, setUnread] = useState(0);

    const refreshUnread = useCallback(() => {
        getUnreadCount().then(setUnread).catch(() => { /* silent */ });
    }, []);

    useEffect(() => {
        refreshUnread();
        const iv = setInterval(refreshUnread, POLL_MS);
        return () => clearInterval(iv);
    }, [refreshUnread]);

    const badge = unread > 99 ? '99+' : String(unread);

    return (
        <button
            onClick={() => onNavigate?.('MESSAGES')}
            className={`relative rounded-xl transition-colors ${
                variant === 'light'
                    ? 'p-2.5 text-gray-500 hover:bg-gray-50'
                    : 'p-2 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
            aria-label={`Messages${unread ? ` (${unread} unread)` : ''}`}
        >
            <Bell size={variant === 'light' ? 20 : 18} />
            {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                    {badge}
                </span>
            )}
        </button>
    );
};

export default NotificationCenter;
