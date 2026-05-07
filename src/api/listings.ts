import { apiClient } from './client';

export class ApiError extends Error {
    code: string;
    constructor(message: string, code: string) {
        super(message);
        this.code = code;
    }
}

const handleError = async (response: Response, fallback: string): Promise<never> => {
    const err = await response.json().catch(() => null);
    const code: string = err?.error?.code || err?.code || '';
    const msg: string = err?.error?.message || err?.message || (err && JSON.stringify(err)) || fallback;
    throw new ApiError(msg, code);
};

// ─── Metadata (public, no auth required) ──────────────────────────────────

export const getEventMetaCategories = async () => {
    const response = await apiClient('/api/v1/listings/metadata/categories/');
    if (!response.ok) await handleError(response, 'Failed to load categories');
    return response.json();
};

export const getEventMetaFormats = async () => {
    const response = await apiClient('/api/v1/listings/metadata/formats/');
    if (!response.ok) await handleError(response, 'Failed to load formats');
    return response.json();
};

export const getEventMetaAgeGroups = async () => {
    const response = await apiClient('/api/v1/listings/metadata/age-groups/');
    if (!response.ok) await handleError(response, 'Failed to load age groups');
    return response.json();
};

// ─── Listings CRUD ────────────────────────────────────────────────────────

export const getListings = async (status?: string) => {
    const url = status
        ? `/api/v1/partners/listings/?status=${encodeURIComponent(status)}`
        : '/api/v1/partners/listings/';
    const response = await apiClient(url);
    if (!response.ok) await handleError(response, 'Failed to load listings');
    return response.json();
};

export const getListingDetail = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/`);
    if (!response.ok) await handleError(response, 'Failed to load listing');
    return response.json();
};

export const createEventDraft = async (data: { title?: string; description?: string }) => {
    const response = await apiClient('/api/v1/partners/listings/create/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create event draft');
    return response.json();
};

export const updateListing = async (listingId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/update/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update listing');
    return response.json();
};

export const submitListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/submit/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to submit listing');
    return response.json();
};

// ─── Listing Media ────────────────────────────────────────────────────────

export const getListingMedia = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/media/`);
    if (!response.ok) await handleError(response, 'Failed to load media');
    return response.json();
};

export const uploadListingMedia = async (
    listingId: string,
    file: File,
    mediaType: 'cover' | 'gallery' | 'video'
) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/media/`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) await handleError(response, 'Failed to upload media');
    return response.json();
};

export const deleteListingMedia = async (listingId: string, mediaId: number) => {
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/media/${mediaId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete media');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Tickets (Paid Events) ────────────────────────────────────────────────

export const getTickets = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/tickets/`);
    if (!response.ok) await handleError(response, 'Failed to load tickets');
    return response.json();
};

export const createTicket = async (
    listingId: string,
    data: { name: string; price: number; total_quantity: number; description?: string }
) => {
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/tickets/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create ticket');
    return response.json();
};

export const updateTicket = async (
    listingId: string,
    ticketId: number,
    data: Record<string, any>
) => {
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/tickets/${ticketId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update ticket');
    return response.json();
};

export const deleteTicket = async (listingId: string, ticketId: number) => {
    const response = await apiClient(`/api/v1/partners/listings/${listingId}/tickets/${ticketId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete ticket');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Draft ID Helpers (sessionStorage) ────────────────────────────────────

const DRAFT_KEY = 'current_event_draft_id';

export const getCurrentDraftId = (): string | null => sessionStorage.getItem(DRAFT_KEY);
export const setCurrentDraftId = (id: string) => sessionStorage.setItem(DRAFT_KEY, id);
export const clearCurrentDraftId = () => sessionStorage.removeItem(DRAFT_KEY);
