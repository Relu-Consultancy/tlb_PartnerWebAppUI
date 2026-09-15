import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import {
    getNotificationPreferences, updateNotificationPreferences, NotificationPreferences,
} from '../../../api/notifications';
import { Skeleton, toast } from '../../../components/ui';
import { SectionCard } from './fields';

type PrefKey = keyof NotificationPreferences;

const ALERT_ROWS: { key: PrefKey; title: string; description: string }[] = [
    { key: 'partner_new_booking', title: 'New bookings', description: 'The moment a customer books one of your listings' },
    { key: 'booking_confirmed', title: 'Booking confirmations', description: 'When a booking is confirmed and paid' },
    { key: 'booking_cancelled', title: 'Cancellations', description: 'When a customer cancels a booking' },
    { key: 'refund_initiated', title: 'Refunds', description: 'When TLB starts a refund on a booking' },
    { key: 'payment_failed', title: 'Failed payments', description: 'When a customer’s payment doesn’t go through' },
    { key: 'partner_new_follower', title: 'New followers', description: 'When someone follows your business' },
    { key: 'listing_status_updates', title: 'Listing reviews', description: 'TLB approvals and rejections for your listings' },
    { key: 'onboarding_updates', title: 'Account & verification', description: 'Onboarding and document review updates' },
];

const ANNOUNCEMENT_CHANNELS: { key: PrefKey; label: string }[] = [
    { key: 'broadcast_in_app', label: 'In app' },
    { key: 'broadcast_email', label: 'Email' },
];

type LoadState = 'loading' | 'error' | 'ready';

export const NotificationPrefsSection: React.FC = () => {
    const [prefs, setPrefs] = useState<NotificationPreferences>({});
    const [state, setState] = useState<LoadState>('loading');
    const [pending, setPending] = useState<PrefKey[]>([]);

    const load = useCallback(() => {
        setState('loading');
        getNotificationPreferences()
            .then(p => { setPrefs(p ?? {}); setState('ready'); })
            .catch(() => setState('error'));
    }, []);

    useEffect(() => { load(); }, [load]);

    // Optimistic toggle; the server's copy wins on success, the old value on failure.
    const toggle = (key: PrefKey) => {
        if (pending.includes(key)) return;
        const next = !prefs[key];
        setPrefs(p => ({ ...p, [key]: next }));
        setPending(list => [...list, key]);
        updateNotificationPreferences({ [key]: next })
            .then(server => setPrefs(p => ({ ...p, ...(server ?? {}) })))
            .catch(() => {
                setPrefs(p => ({ ...p, [key]: !next }));
                toast.error('Couldn’t update that preference. Please try again.');
            })
            .finally(() => setPending(list => list.filter(k => k !== key)));
    };

    // Only offer switches the backend actually reports.
    const rows = ALERT_ROWS.filter(row => typeof prefs[row.key] === 'boolean');
    const channels = ANNOUNCEMENT_CHANNELS.filter(c => typeof prefs[c.key] === 'boolean');

    return (
        <SectionCard title="Notification preferences" subtitle="Choose which updates TLB sends you">
            {state === 'loading' && (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-[10px]" />)}
                </div>
            )}

            {state === 'error' && (
                <div className="pt-note flex-wrap">
                    <AlertCircle size={16} className="text-tlb-red flex-none" aria-hidden="true" />
                    <span className="flex-1">Notification preferences aren’t available right now.</span>
                    <button type="button" className="pt-btn pt-btn-o pt-btn-sm" onClick={load}>Try again</button>
                </div>
            )}

            {state === 'ready' && rows.length === 0 && channels.length === 0 && (
                <p className="pt-note">There are no notification settings to manage yet.</p>
            )}

            {state === 'ready' && rows.length > 0 && (
                <ul>
                    {rows.map(row => (
                        <li key={row.key} className="flex items-center gap-4 py-3 border-t border-tlb-divider first:border-t-0">
                            <div className="flex-1 min-w-0">
                                <p id={`pref-${row.key}`} className="text-[13px] font-bold text-tlb-ink">{row.title}</p>
                                <p className="text-[11.5px] text-tlb-muted mt-px">{row.description}</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={!!prefs[row.key]}
                                aria-labelledby={`pref-${row.key}`}
                                disabled={pending.includes(row.key)}
                                onClick={() => toggle(row.key)}
                                className="pt-switch"
                            />
                        </li>
                    ))}
                </ul>
            )}

            {state === 'ready' && channels.length > 0 && (
                <div className="pt-note flex-wrap mt-4">
                    <div className="flex-1 min-w-[180px]">
                        <p className="text-[12.5px] font-bold text-tlb-ink">TLB announcements</p>
                        <p className="text-[11.5px] mt-px">Offers, sales and product news from TLB</p>
                    </div>
                    <div className="flex gap-5">
                        {channels.map(channel => (
                            <span key={channel.key} className="flex items-center gap-2 text-xs font-semibold text-tlb-body">
                                <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={!!prefs[channel.key]}
                                    aria-label={`Announcements ${channel.label.toLowerCase()}`}
                                    disabled={pending.includes(channel.key)}
                                    onClick={() => toggle(channel.key)}
                                    className="pt-check"
                                >
                                    {prefs[channel.key] && <Check size={12} strokeWidth={4} />}
                                </button>
                                {channel.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </SectionCard>
    );
};
