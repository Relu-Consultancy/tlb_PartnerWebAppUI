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

const humanize = (v: string) =>
    v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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

const DEFAULT_CATEGORIES: TicketCategory[] = [
    'refund_status', 'payment_issue', 'booking_issue', 'listing_issue',
    'account', 'technical', 'other',
].map((v) => ({ value: v, label: humanize(v) }));

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
        const mapped: TicketCategory[] = arr.map((c) => {
            if (typeof c === 'string') return { value: c, label: humanize(c) };
            const value = c.value ?? c.id ?? c.slug ?? c.key ?? '';
            const label = c.label ?? c.name ?? c.display ?? humanize(String(value));
            return { value: String(value), label: String(label) };
        }).filter((c) => c.value);
        return mapped.length > 0 ? mapped : DEFAULT_CATEGORIES;
    } catch {
        return DEFAULT_CATEGORIES;
    }
};

export const ticketCategoryLabel = (value: string) =>
    DEFAULT_CATEGORIES.find((c) => c.value === value)?.label || humanize(value || '');
