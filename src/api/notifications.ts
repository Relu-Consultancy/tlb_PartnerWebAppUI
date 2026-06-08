import { apiClient } from './client';

// ---------------------------------------------------------------------------
// In-app notifications — Partner (uses the partner's own JWT)
// Base: /api/v1/notifications/
// ---------------------------------------------------------------------------

export interface InAppNotification {
    id: string;
    notification_type: string; // 'broadcast' | 'booking_confirmed' | 'partner_new_booking' | …
    title: string;
    body: string;
    action_url: string | null;
    metadata: Record<string, unknown> | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

export interface NotificationPage {
    count: number;
    next: string | null;
    previous: string | null;
    results: InAppNotification[];
}

export interface NotificationPreferences {
    booking_confirmed?: boolean;
    booking_cancelled?: boolean;
    payment_failed?: boolean;
    hold_expired?: boolean;
    refund_initiated?: boolean;
    new_listing_from_partner?: boolean;
    partner_new_booking?: boolean;
    partner_new_follower?: boolean;
    listing_status_updates?: boolean;
    onboarding_updates?: boolean;
    broadcast_email?: boolean;
    broadcast_in_app?: boolean;
}

interface ListParams {
    unread?: boolean;
    page?: number;
    page_size?: number;
}

const unwrap = (json: any) => json?.data ?? json;

const ensureOk = async (res: Response, fallback: string) => {
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || `${fallback} (HTTP ${res.status})`);
    }
};

/** GET /notifications/in-app/ — paginated list (newest first). */
export const listNotifications = async (params: ListParams = {}): Promise<NotificationPage> => {
    const qs = new URLSearchParams();
    if (params.unread) qs.set('unread', 'true');
    if (params.page) qs.set('page', String(params.page));
    if (params.page_size) qs.set('page_size', String(params.page_size));
    const query = qs.toString();
    const res = await apiClient(`/api/v1/notifications/in-app/${query ? `?${query}` : ''}`);
    await ensureOk(res, 'Failed to load notifications');
    const d = unwrap(await res.json());
    return {
        count: Number(d?.count ?? 0),
        next: d?.next ?? null,
        previous: d?.previous ?? null,
        results: (d?.results ?? []) as InAppNotification[],
    };
};

/** GET /notifications/in-app/unread-count/ — drives the bell badge. */
export const getUnreadCount = async (): Promise<number> => {
    const res = await apiClient('/api/v1/notifications/in-app/unread-count/');
    await ensureOk(res, 'Failed to load unread count');
    const d = unwrap(await res.json());
    return Number(d?.count ?? 0);
};

/** POST /notifications/in-app/{id}/read/ — mark one read. */
export const markNotificationRead = async (id: string): Promise<InAppNotification> => {
    const res = await apiClient(`/api/v1/notifications/in-app/${id}/read/`, { method: 'POST' });
    await ensureOk(res, 'Failed to mark notification read');
    return unwrap(await res.json()) as InAppNotification;
};

/** POST /notifications/in-app/read-all/ — mark all read. */
export const markAllNotificationsRead = async (): Promise<number> => {
    const res = await apiClient('/api/v1/notifications/in-app/read-all/', { method: 'POST' });
    await ensureOk(res, 'Failed to mark all read');
    const d = unwrap(await res.json());
    return Number(d?.marked_read ?? 0);
};

/** GET /notifications/preferences/ */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
    const res = await apiClient('/api/v1/notifications/preferences/');
    await ensureOk(res, 'Failed to load preferences');
    return unwrap(await res.json()) as NotificationPreferences;
};

/** PATCH /notifications/preferences/ */
export const updateNotificationPreferences = async (
    patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> => {
    const res = await apiClient('/api/v1/notifications/preferences/', {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
    await ensureOk(res, 'Failed to update preferences');
    return unwrap(await res.json()) as NotificationPreferences;
};
