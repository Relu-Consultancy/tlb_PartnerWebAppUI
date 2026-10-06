import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Help / Support tickets — Partner
// Base: /api/v1/help/tickets/
// ---------------------------------------------------------------------------

export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | string;
export type TicketSenderRole = 'customer' | 'partner' | 'admin' | 'support' | 'staff' | string;

export interface TicketCategory {
    value: string;
    label: string;
}

export interface TicketListItem {
    id: string;
    category: string;
    subject: string;
    status: TicketStatus;
    created_at: string;
    updated_at: string;
    unread_count?: number | string;
}

export interface Ticket extends TicketListItem {
    booking_reference?: string | null;
    closed_at?: string | null;
}

export interface TicketMessage {
    id: string;
    sender_email: string;
    sender_role: TicketSenderRole;
    body: string;
    is_read: boolean;
    created_at: string;
}

export interface CreateTicketInput {
    subject: string;
    category: string;
    body: string;
    booking_id?: string;
}

export interface TicketMessagesResult {
    ticket_status?: TicketStatus;
    messages: TicketMessage[];
}

// ── Envelope helpers ──
const unwrap = async <T>(response: Response, fallbackErr: string): Promise<T> => {
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        const serverMsg = err?.error?.message || err?.message || err?.detail;
        throw new Error(serverMsg || `${fallbackErr} (HTTP ${response.status})`);
    }
    const json = await response.json().catch(() => null);
    return (json?.data ?? json) as T;
};

const unwrapList = async <T>(response: Response, fallbackErr: string): Promise<T[]> => {
    const data = await unwrap<{ results?: T[] } | T[] | null>(response, fallbackErr);
    if (Array.isArray(data)) return data;
    return (data?.results as T[]) ?? [];
};

const humanize = (v: string) => v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** GET /help/tickets/list/ — list this user's tickets. */
export const listTickets = async (): Promise<TicketListItem[]> => {
    const res = await apiClient('/api/v1/help/tickets/list/');
    return unwrapList<TicketListItem>(res, 'Failed to load tickets');
};

/** GET /help/tickets/{id}/ — single ticket detail. */
export const getTicket = async (ticketId: string): Promise<Ticket> => {
    const res = await apiClient(`/api/v1/help/tickets/${ticketId}/`);
    return unwrap<Ticket>(res, 'Failed to load ticket');
};

/** POST /help/tickets/ — raise a new ticket. */
export const createTicket = async (input: CreateTicketInput): Promise<Ticket> => {
    const body: CreateTicketInput = {
        subject: input.subject,
        category: input.category,
        body: input.body,
        ...(input.booking_id ? { booking_id: input.booking_id } : {}),
    };
    const res = await apiClient('/api/v1/help/tickets/', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return unwrap<Ticket>(res, 'Failed to raise ticket');
};

/** POST /help/tickets/{id}/close/ — close a resolved ticket (cannot reopen). */
export const closeTicket = async (ticketId: string): Promise<Ticket> => {
    const res = await apiClient(`/api/v1/help/tickets/${ticketId}/close/`, { method: 'POST' });
    return unwrap<Ticket>(res, 'Failed to close ticket');
};

/**
 * GET /help/tickets/{id}/messages/?since=… — poll messages.
 *
 * IMPORTANT cursor contract: omit `since` for a full thread load; pass the last
 * message's `created_at` VERBATIM (UTC, ends in "Z" — never reformat to local
 * time) to fetch only newer messages. The response is
 * `{ ticket_status, messages: [...] }`.
 */
export const getTicketMessages = async (ticketId: string, since?: string): Promise<TicketMessagesResult> => {
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    const res = await apiClient(`/api/v1/help/tickets/${ticketId}/messages/${qs}`);
    const data = await unwrap<any>(res, 'Failed to load messages');
    // Expected: { ticket_status, messages }. Be tolerant of array / {results} too.
    if (Array.isArray(data)) return { messages: data as TicketMessage[] };
    if (Array.isArray(data?.messages)) return { ticket_status: data.ticket_status, messages: data.messages };
    if (Array.isArray(data?.results)) return { messages: data.results };
    return { messages: [] };
};

/** POST /help/tickets/{id}/messages/send/ — send a message. */
export const sendTicketMessage = async (ticketId: string, body: string): Promise<TicketMessage> => {
    const res = await apiClient(`/api/v1/help/tickets/${ticketId}/messages/send/`, {
        method: 'POST',
        body: JSON.stringify({ body }),
    });
    return unwrap<TicketMessage>(res, 'Failed to send message');
};

/** `Event Review` / `event-review` / `event_review` all collapse to one key. */
const categoryKey = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

/**
 * Display-only renames — the `value` posted to the API is never touched, so
 * these are safe regardless of what the backend calls the category. Keyed by
 * the category's value *or* its server label, since some deployments return a
 * numeric id with the label carrying the wording.
 */
const CATEGORY_LABEL_OVERRIDES: Record<string, string> = {
    event_review: 'Listing Review',
    listing_review: 'Listing Review',
    listing_issue: 'Listings Issue',
    booking_issue: 'Bookings Issue',
};

/**
 * Categories the portal offers even when the role-scoped endpoint omits them.
 * Both are part of the help taxonomy (see DEFAULT_CATEGORIES); `listing_issue`
 * is distinct from `listing_bug` — a bug is broken software, an issue is
 * anything else wrong with a listing.
 */
const EXTRA_CATEGORIES: TicketCategory[] = [
    { value: 'listing_issue', label: 'Listings Issue' },
    { value: 'booking_issue', label: 'Bookings Issue' },
];

/**
 * True for the category that a ticket can be pinned to a booking with — the
 * only one where the "Related booking" picker is worth showing. Matches any
 * booking-scoped category, not just the `booking_issue` the portal adds.
 */
export const isBookingCategory = (value: string): boolean => categoryKey(value || '').startsWith('booking');

const applyOverride = (value: string, label: string): string =>
    CATEGORY_LABEL_OVERRIDES[categoryKey(value)] ?? CATEGORY_LABEL_OVERRIDES[categoryKey(label)] ?? label;

/** Used when the endpoint is empty or unreachable — same wording as the live list. */
const DEFAULT_CATEGORIES: TicketCategory[] = [
    'refund_status',
    'payment_issue',
    'booking_issue',
    'listing_issue',
    'account',
    'technical',
    'other',
].map((v) => ({ value: v, label: applyOverride(v, humanize(v)) }));

/** Appends any EXTRA_CATEGORIES the server didn't already offer (matched on key). */
const withExtras = (categories: TicketCategory[]): TicketCategory[] => {
    const keys = new Set(categories.map((c) => categoryKey(c.value)));
    return [...categories, ...EXTRA_CATEGORIES.filter((c) => !keys.has(categoryKey(c.value)))];
};

/**
 * GET /help/tickets/categories/ — categories valid for the current role.
 * Normalizes strings / {value,label} / {id,name} shapes; falls back to a
 * sensible default list if the endpoint is empty or unavailable.
 */
export const getTicketCategories = async (): Promise<TicketCategory[]> => {
    try {
        const res = await apiClient('/api/v1/help/tickets/categories/');
        const data = await unwrap<any>(res, 'Failed to load categories');
        const arr: any[] = Array.isArray(data) ? data : (data?.results ?? data?.categories ?? []);
        const mapped: TicketCategory[] = arr
            .map((c) => {
                if (typeof c === 'string') return { value: c, label: applyOverride(c, humanize(c)) };
                const value = String(c.value ?? c.id ?? c.slug ?? c.key ?? '');
                const label = String(c.label ?? c.name ?? c.display ?? humanize(value));
                return { value, label: applyOverride(value, label) };
            })
            .filter((c) => c.value);
        return withExtras(mapped.length > 0 ? mapped : DEFAULT_CATEGORIES);
    } catch {
        return withExtras(DEFAULT_CATEGORIES);
    }
};

// Categories that plausibly hinge on a specific booking — never a good silent default.
const BOOKING_TIED = /review|booking|refund|payment|cancel/;
// General-purpose categories, in order of preference, for the form's default.
const GENERAL_DEFAULTS = ['other', 'technical', 'account', 'account_issue', 'onboarding_issue', 'listing_issue', 'listing_bug'];

/**
 * The category a new ticket starts on. It used to be whatever the server listed
 * first — "Event Review" — so a partner who only typed a subject and description
 * submitted under a category the backend ties to a booking, and got "No booking
 * found or does not belong to you".
 */
export const defaultTicketCategory = (categories: TicketCategory[]): string => {
    // Match on the label too — some deployments key categories by numeric id.
    const keyed = categories.map((c) => ({ c, keys: [categoryKey(c.value), categoryKey(c.label || '')] }));
    for (const want of GENERAL_DEFAULTS) {
        const hit = keyed.find((k) => k.keys.includes(want));
        if (hit) return hit.c.value;
    }
    const general = keyed.find((k) => !k.keys.some((key) => BOOKING_TIED.test(key)));
    return (general ?? keyed[0])?.c.value ?? '';
};

/** The backend's refusal when a category needs a booking the ticket didn't carry. */
export const isBookingRequiredError = (message: unknown): boolean =>
    /no booking found|booking.{0,40}(required|does not belong)|BOOKING_(REQUIRED|NOT_FOUND)/i.test(String(message ?? ''));

export const ticketCategoryLabel = (value: string) => {
    const fallback = DEFAULT_CATEGORIES.find((c) => c.value === value)?.label || humanize(value || '');
    return applyOverride(value || '', fallback);
};

// ---------------------------------------------------------------------------
// Shared queries — tickets admin shared with this partner
// Base: /api/v1/help/partner/shared-tickets/
// ---------------------------------------------------------------------------

export interface SharedTicketListItem {
    id: string;
    category: string;
    subject: string;
    status: TicketStatus;
    raised_by_role: string;
    booking_reference?: string | null;
    shared_at: string;
    created_at: string;
    updated_at: string;
    unread_count: number;
}

export interface SharedTicketDetail {
    ticket: {
        id: string;
        category: string;
        subject: string;
        status: TicketStatus;
        booking_reference?: string | null;
        created_at: string;
        updated_at: string;
        closed_at?: string | null;
    };
    ticket_status: TicketStatus;
    messages: TicketMessage[];
}

export const listSharedTickets = async (): Promise<SharedTicketListItem[]> => {
    const res = await apiClient('/api/v1/help/partner/shared-tickets/');
    return unwrapList<SharedTicketListItem>(res, 'Failed to load shared queries');
};

export const getSharedTicket = async (ticketId: string): Promise<SharedTicketDetail> => {
    const res = await apiClient(`/api/v1/help/partner/shared-tickets/${ticketId}/`);
    return unwrap<SharedTicketDetail>(res, 'Failed to load shared query');
};

export const getSharedTicketMessages = async (ticketId: string, since?: string): Promise<TicketMessagesResult> => {
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    const res = await apiClient(`/api/v1/help/partner/shared-tickets/${ticketId}/messages/${qs}`);
    const data = await unwrap<any>(res, 'Failed to load messages');
    if (Array.isArray(data)) return { messages: data as TicketMessage[] };
    if (Array.isArray(data?.messages)) return { ticket_status: data.ticket_status, messages: data.messages };
    if (Array.isArray(data?.results)) return { messages: data.results };
    return { messages: [] };
};

export const sendSharedTicketMessage = async (ticketId: string, body: string): Promise<TicketMessage> => {
    const res = await apiClient(`/api/v1/help/partner/shared-tickets/${ticketId}/messages/send/`, {
        method: 'POST',
        body: JSON.stringify({ body }),
    });
    return unwrap<TicketMessage>(res, 'Failed to send message');
};
