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

/** One notification, whatever shape the API sends it in. */
const normalizeNotification = (n: any): InAppNotification => ({
    ...n,
    id: String(n?.id ?? ''),
    notification_type: String(n?.notification_type ?? n?.type ?? ''),
    title: n?.title ?? '',
    body: n?.body ?? n?.message ?? '',
    action_url: n?.action_url ?? null,
    metadata: n?.metadata ?? null,
    // Unread unless the API says otherwise, by flag or by a read timestamp.
    is_read: Boolean(n?.is_read ?? n?.read ?? n?.read_at),
    read_at: n?.read_at ?? null,
    created_at: n?.created_at ?? '',
});

/** GET /notifications/in-app/ — paginated list (newest first). */
export const listNotifications = async (params: ListParams = {}): Promise<NotificationPage> => {
    const qs = new URLSearchParams();
    if (params.unread) qs.set('unread', 'true');
    if (params.page) qs.set('page', String(params.page));
    if (params.page_size) qs.set('page_size', String(params.page_size));
    const query = qs.toString();
    const res = await apiClient(`/api/v1/notifications/in-app/${query ? `?${query}` : ''}`);
    await ensureOk(res, 'Failed to load notifications');
    const json = await res.json();
    const d = unwrap(json);
    // Paginated ({data: {results, next}}) or flat ({data: [...], next}) — reading
    // only `results` turned the flat form into an empty list under a non-zero badge.
    const list: any[] = Array.isArray(d) ? d : Array.isArray(d?.results) ? d.results : [];
    return {
        count: Number(d?.count ?? json?.count ?? list.length),
        next: d?.next ?? json?.next ?? null,
        previous: d?.previous ?? json?.previous ?? null,
        results: list.map(normalizeNotification),
    };
};

/** How many unread items we're willing to fetch to check the server's count. */
const UNREAD_VERIFY_LIMIT = 50;

/**
 * GET /notifications/in-app/unread-count/ — drives the bell and Messages badges.
 *
 * The count endpoint and the list can disagree (QA: "1 new" over an empty
 * Unread tab). A badge must never promise a message the partner can't open,
 * so a small count is checked against the unread items actually listed. A
 * count with more than a page of unread items behind it is taken as-is.
 */
export const getUnreadCount = async (): Promise<number> => {
    const res = await apiClient('/api/v1/notifications/in-app/unread-count/');
    await ensureOk(res, 'Failed to load unread count');
    const d = unwrap(await res.json());
    const reported = Number(d?.count ?? d?.unread_count ?? d?.unread ?? 0) || 0;
    if (reported <= 0) return 0;
    try {
        const page = await listNotifications({ unread: true, page_size: UNREAD_VERIFY_LIMIT });
        if (page.next) return reported;
        return page.results.filter((n) => !n.is_read).length;
    } catch {
        return reported; // can't check — fall back to what the server said
    }
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
export const updateNotificationPreferences = async (patch: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const res = await apiClient('/api/v1/notifications/preferences/', {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
    await ensureOk(res, 'Failed to update preferences');
    return unwrap(await res.json()) as NotificationPreferences;
};
