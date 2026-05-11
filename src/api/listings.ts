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

// ─── Event Metadata (public) ───────────────────────────────────────────────

export const getEventMetaCategories = async () => {
    const response = await apiClient('/api/v1/listings/events/metadata/categories/');
    if (!response.ok) await handleError(response, 'Failed to load categories');
    return response.json();
};

export const getEventMetaFormats = async () => {
    const response = await apiClient('/api/v1/listings/events/metadata/formats/');
    if (!response.ok) await handleError(response, 'Failed to load formats');
    return response.json();
};

export const getEventMetaAgeGroups = async () => {
    const response = await apiClient('/api/v1/listings/events/metadata/age-groups/');
    if (!response.ok) await handleError(response, 'Failed to load age groups');
    return response.json();
};

// ─── Venue Metadata (public) ───────────────────────────────────────────────

export const getVenueMetaCategories = async () => {
    const response = await apiClient('/api/v1/listings/venues/metadata/categories/');
    if (!response.ok) await handleError(response, 'Failed to load venue categories');
    return response.json();
};

export const getVenueMetaDiscoveryEnums = async () => {
    const response = await apiClient('/api/v1/listings/venues/metadata/discovery-enums/');
    if (!response.ok) await handleError(response, 'Failed to load venue discovery enums');
    return response.json();
};

export const getVenueMetaOccasions = async () => {
    const response = await apiClient('/api/v1/listings/venues/metadata/occasions/');
    if (!response.ok) await handleError(response, 'Failed to load venue occasions');
    return response.json();
};

// ─── Event Listings ────────────────────────────────────────────────────────

export const getEventListings = async (status?: string) => {
    const url = status
        ? `/api/v1/partners/listings/events/?status=${encodeURIComponent(status)}`
        : '/api/v1/partners/listings/events/';
    const response = await apiClient(url);
    if (!response.ok) await handleError(response, 'Failed to load listings');
    return response.json();
};

export const getListingDetail = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/`);
    if (!response.ok) await handleError(response, 'Failed to load listing');
    return response.json();
};

export const createEventDraft = async (data: { title?: string; description?: string }) => {
    const response = await apiClient('/api/v1/partners/listings/events/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create event draft');
    return response.json();
};

export const updateListing = async (listingId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update listing');
    return response.json();
};

export const submitListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/submit/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to submit listing');
    return response.json();
};

// ─── Event Media ───────────────────────────────────────────────────────────

export const getListingMedia = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/media/`);
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
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/media/`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) await handleError(response, 'Failed to upload media');
    return response.json();
};

export const deleteListingMedia = async (listingId: string, mediaId: number) => {
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/media/${mediaId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete media');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Event Tickets ─────────────────────────────────────────────────────────

export const getTickets = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/tickets/`);
    if (!response.ok) await handleError(response, 'Failed to load tickets');
    return response.json();
};

export const createTicket = async (
    listingId: string,
    data: { name: string; price: number; total_quantity: number; description?: string }
) => {
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/tickets/`, {
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
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/tickets/${ticketId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update ticket');
    return response.json();
};

export const deleteTicket = async (listingId: string, ticketId: number) => {
    const response = await apiClient(`/api/v1/partners/listings/events/${listingId}/tickets/${ticketId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete ticket');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Venue Listings ────────────────────────────────────────────────────────

export const getVenueListings = async (status?: string) => {
    const url = status
        ? `/api/v1/partners/listings/venues/?status=${encodeURIComponent(status)}`
        : '/api/v1/partners/listings/venues/';
    const response = await apiClient(url);
    if (!response.ok) await handleError(response, 'Failed to load venue listings');
    return response.json();
};

export const getVenueListingDetail = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/`);
    if (!response.ok) await handleError(response, 'Failed to load venue listing');
    return response.json();
};

export const createVenueDraft = async (data: { title?: string; description?: string }) => {
    const response = await apiClient('/api/v1/partners/listings/venues/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create venue draft');
    return response.json();
};

export const updateVenueListing = async (listingId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update venue listing');
    return response.json();
};

export const deleteVenueListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete venue listing');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

export const submitVenueListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/submit/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to submit venue listing');
    return response.json();
};

// ─── Venue Media ───────────────────────────────────────────────────────────

export const getVenueListingMedia = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/media/`);
    if (!response.ok) await handleError(response, 'Failed to load venue media');
    return response.json();
};

export const uploadVenueListingMedia = async (
    listingId: string,
    file: File,
    mediaType: 'cover' | 'gallery' | 'video'
) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/media/`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) await handleError(response, 'Failed to upload venue media');
    return response.json();
};

export const deleteVenueListingMedia = async (listingId: string, mediaId: number) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/media/${mediaId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete venue media');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Venue Packages ────────────────────────────────────────────────────────

export const getVenuePackages = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/packages/`);
    if (!response.ok) await handleError(response, 'Failed to load venue packages');
    return response.json();
};

export const createVenuePackage = async (
    listingId: string,
    data: { name: string; price: number | string; description?: string; duration_minutes: number; max_guests: number }
) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/packages/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create venue package');
    return response.json();
};

export const updateVenuePackage = async (listingId: string, pkgId: number, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/packages/${pkgId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update venue package');
    return response.json();
};

export const deleteVenuePackage = async (listingId: string, pkgId: number) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/packages/${pkgId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete venue package');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Venue Availability ────────────────────────────────────────────────────

export const getVenueAvailability = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/availability/`);
    if (!response.ok) await handleError(response, 'Failed to load venue availability');
    return response.json();
};

export const createVenueAvailabilitySlot = async (
    listingId: string,
    data: { date: string; start_time: string; end_time: string; note?: string }
) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/availability/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create availability slot');
    return response.json();
};

export const updateVenueAvailabilitySlot = async (
    listingId: string,
    slotId: number,
    data: { date: string; start_time: string; end_time: string; note?: string }
) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/availability/${slotId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update availability slot');
    return response.json();
};

export const deleteVenueAvailabilitySlot = async (listingId: string, slotId: number) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/availability/${slotId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete availability slot');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Venue Attendee Fields ─────────────────────────────────────────────────

export const getVenueAttendeeFields = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/attendee-fields/`);
    if (!response.ok) await handleError(response, 'Failed to load attendee fields');
    return response.json();
};

export const updateVenueAttendeeFields = async (listingId: string, fields: string[]) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/attendee-fields/`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
    });
    if (!response.ok) await handleError(response, 'Failed to update attendee fields');
    return response.json();
};

// ─── Venue Discovery ───────────────────────────────────────────────────────

export const getVenueDiscovery = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/discovery/`);
    if (!response.ok) await handleError(response, 'Failed to load venue discovery metadata');
    return response.json();
};

export const updateVenueDiscovery = async (
    listingId: string,
    data: { outing_types?: string[]; activity_types?: string[]; format_types?: string[] }
) => {
    const response = await apiClient(`/api/v1/partners/listings/venues/${listingId}/discovery/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update venue discovery metadata');
    return response.json();
};

// ─── Draft ID Helpers (sessionStorage) ────────────────────────────────────

const EVENT_DRAFT_KEY = 'current_event_draft_id';
const VENUE_DRAFT_KEY = 'current_venue_draft_id';

export const getCurrentDraftId = (): string | null => sessionStorage.getItem(EVENT_DRAFT_KEY);
export const setCurrentDraftId = (id: string) => sessionStorage.setItem(EVENT_DRAFT_KEY, id);
export const clearCurrentDraftId = () => sessionStorage.removeItem(EVENT_DRAFT_KEY);

export const getCurrentVenueDraftId = (): string | null => sessionStorage.getItem(VENUE_DRAFT_KEY);
export const setCurrentVenueDraftId = (id: string) => sessionStorage.setItem(VENUE_DRAFT_KEY, id);
export const clearCurrentVenueDraftId = () => sessionStorage.removeItem(VENUE_DRAFT_KEY);
