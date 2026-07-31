import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Partner Network — directory + 1-to-1 partner messaging
// Base: /api/v1/partner/network/
// ---------------------------------------------------------------------------

export interface NetworkPartner {
    id: string;
    business_name: string;
    email: string;
    base_city: string | null;
    logo: string | null;
    bio: string | null;
    contact_number: string | null;
    categories: string | null;
    published_listing_count: number;
    is_verified: boolean;
}

export interface NetworkListing {
    id: string;
    title?: string;
    listing_type?: string;
    cover_url?: string | null;
    city?: string | null;
    [key: string]: unknown;
}

export interface NetworkPartnerDetail extends NetworkPartner {
    instagram_url: string | null;
    facebook_url: string | null;
    website_url: string | null;
    cover_image: string | null;
    cover_image_url?: string | null;
    operating_cities: string | null;
    /** May arrive as an array or a JSON string depending on backend serialization. */
    listings: NetworkListing[] | string | null;
}

export interface ConversationPartner {
    id: string;
    business_name: string;
    logo: string | null;
}

export interface Conversation {
    id: string;
    /** May be an object (id/business_name/logo) or a plain name string. */
    other_partner: ConversationPartner | string;
    last_message_preview: string | null;
    last_message_at: string | null;
    unread_count: number;
    created_at: string;
}

export interface NetworkAttachment {
    id: string;
    file_url: string;
    file_name: string;
    file_size: number;
    content_type: string;
}

export interface NetworkMessage {
    id: string;
    /** Sender partner UUID — compare to your own partner id to know if it's yours. */
    sender_id: string;
    sender_name: string;
    body: string;
    attachments: NetworkAttachment[];
    is_read: boolean;
    created_at: string;
}

// Messages come as { sender: { id, business_name }, content, attachments[] }.
const normalizeMessage = (m: any): NetworkMessage => ({
    id: m?.id,
    sender_id: String(m?.sender?.id ?? m?.sender_id ?? ''),
    sender_name: m?.sender?.business_name ?? m?.sender_name ?? '',
    body: m?.content ?? m?.body ?? m?.message ?? '',
    attachments: Array.isArray(m?.attachments) ? m.attachments : [],
    is_read: !!m?.is_read,
    created_at: m?.created_at ?? '',
});

const unwrap = (json: any) => json?.data ?? json;

const ensureOk = async (res: Response, fallback: string) => {
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || err?.detail || `${fallback} (HTTP ${res.status})`);
    }
};

const asArray = <T>(data: any): T[] => (Array.isArray(data) ? data : (data?.results ?? []));

// ── Directory ──
export const listNetworkPartners = async (params: { category_id?: number; search?: string } = {}): Promise<NetworkPartner[]> => {
    const qs = new URLSearchParams();
    if (params.category_id != null) qs.set('category_id', String(params.category_id));
    if (params.search) qs.set('search', params.search);
    const query = qs.toString();
    const res = await apiClient(`/api/v1/partner/network/partners/${query ? `?${query}` : ''}`);
    await ensureOk(res, 'Failed to load partners');
    return asArray<NetworkPartner>(unwrap(await res.json()));
};

export const getNetworkPartner = async (partnerId: string): Promise<NetworkPartnerDetail> => {
    const res = await apiClient(`/api/v1/partner/network/partners/${partnerId}/`);
    await ensureOk(res, 'Failed to load partner profile');
    return unwrap(await res.json()) as NetworkPartnerDetail;
};

// ── Block / unblock ──
export const blockPartner = async (partnerId: string): Promise<void> => {
    const res = await apiClient(`/api/v1/partner/network/partners/${partnerId}/block/`, { method: 'POST' });
    await ensureOk(res, 'Failed to block partner');
};
export const unblockPartner = async (partnerId: string): Promise<void> => {
    const res = await apiClient(`/api/v1/partner/network/partners/${partnerId}/block/`, { method: 'DELETE' });
    await ensureOk(res, 'Failed to unblock partner');
};
export const listBlockedPartners = async (): Promise<any[]> => {
    const res = await apiClient('/api/v1/partner/network/blocks/');
    await ensureOk(res, 'Failed to load blocked partners');
    return asArray(unwrap(await res.json()));
};

// ── Conversations ──
export const listConversations = async (): Promise<Conversation[]> => {
    const res = await apiClient('/api/v1/partner/network/conversations/list/');
    await ensureOk(res, 'Failed to load conversations');
    return asArray<Conversation>(unwrap(await res.json()));
};

export const startConversation = async (partnerId: string): Promise<Conversation> => {
    const res = await apiClient('/api/v1/partner/network/conversations/', {
        method: 'POST',
        body: JSON.stringify({ partner_id: partnerId }),
    });
    await ensureOk(res, 'Failed to start conversation');
    return unwrap(await res.json()) as Conversation;
};

export const getConversation = async (conversationId: string): Promise<Conversation> => {
    const res = await apiClient(`/api/v1/partner/network/conversations/${conversationId}/`);
    await ensureOk(res, 'Failed to load conversation');
    return unwrap(await res.json()) as Conversation;
};

export const getConversationMessages = async (conversationId: string): Promise<NetworkMessage[]> => {
    // Paginated, oldest first — fetch every page so the whole thread shows.
    const all: any[] = [];
    let page = 1;
    for (let guard = 0; guard < 40; guard++) {
        const res = await apiClient(`/api/v1/partner/network/conversations/${conversationId}/messages/?page=${page}`);
        await ensureOk(res, 'Failed to load messages');
        const json = await res.json();
        const data = unwrap(json);
        all.push(...asArray<any>(data));
        const next = json?.next ?? data?.next;
        if (!next) break;
        page++;
    }
    return all.map(normalizeMessage);
};

/** Send a message (multipart `content`). Returns the updated thread or new message(s). */
export const sendConversationMessage = async (conversationId: string, content: string): Promise<NetworkMessage[]> => {
    const fd = new FormData();
    fd.append('content', content);
    const res = await apiClient(`/api/v1/partner/network/conversations/${conversationId}/messages/`, {
        method: 'POST',
        body: fd,
    });
    await ensureOk(res, 'Failed to send message');
    const data = unwrap(await res.json());
    const arr = Array.isArray(data) ? data : data ? [data] : [];
    return arr.map(normalizeMessage);
};

export const markConversationRead = async (conversationId: string): Promise<number> => {
    const res = await apiClient(`/api/v1/partner/network/conversations/${conversationId}/messages/read/`, { method: 'POST' });
    await ensureOk(res, 'Failed to mark read');
    const d = unwrap(await res.json());
    return Number(d?.marked_read ?? 0);
};
