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

// ─── Class Metadata (public) ──────────────────────────────────────────────

export const getClassMetaCategories = async () => {
    const response = await apiClient('/api/v1/listings/classes/metadata/categories/');
    if (!response.ok) await handleError(response, 'Failed to load class categories');
    return response.json();
};

export const getClassMetaFormats = async () => {
    const response = await apiClient('/api/v1/listings/classes/metadata/formats/');
    if (!response.ok) await handleError(response, 'Failed to load class formats');
    return response.json();
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
        ? `/api/v1/partner/listings/events/?status=${encodeURIComponent(status)}`
        : '/api/v1/partner/listings/events/';
    const response = await apiClient(url);
    if (!response.ok) await handleError(response, 'Failed to load listings');
    return response.json();
};

export const getListingDetail = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/`);
    if (!response.ok) await handleError(response, 'Failed to load listing');
    return response.json();
};

export const createEventDraft = async (data: { title?: string; description?: string }) => {
    const response = await apiClient('/api/v1/partner/listings/events/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create event draft');
    return response.json();
};

export const updateListing = async (listingId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update listing');
    return response.json();
};

export const submitListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/submit/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to submit listing');
    return response.json();
};

// ─── Event Media ───────────────────────────────────────────────────────────

export const getListingMedia = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/media/`);
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
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/media/`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) await handleError(response, 'Failed to upload media');
    return response.json();
};

export const deleteListingMedia = async (listingId: string, mediaId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/media/${mediaId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete media');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Event Tickets ─────────────────────────────────────────────────────────

export const getTickets = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/tickets/`);
    if (!response.ok) await handleError(response, 'Failed to load tickets');
    return response.json();
};

export const createTicket = async (
    listingId: string,
    data: { name: string; price: number; total_quantity: number; description?: string }
) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/tickets/`, {
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
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/tickets/${ticketId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update ticket');
    return response.json();
};

export const deleteTicket = async (listingId: string, ticketId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/tickets/${ticketId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete ticket');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Venue Listings ────────────────────────────────────────────────────────

export const getVenueListings = async (status?: string) => {
    const url = status
        ? `/api/v1/partner/listings/venues/?status=${encodeURIComponent(status)}`
        : '/api/v1/partner/listings/venues/';
    const response = await apiClient(url);
    if (!response.ok) await handleError(response, 'Failed to load venue listings');
    return response.json();
};

export const getVenueListingDetail = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/`);
    if (!response.ok) await handleError(response, 'Failed to load venue listing');
    return response.json();
};

export const createVenueDraft = async (data: { title?: string; description?: string }) => {
    const response = await apiClient('/api/v1/partner/listings/venues/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create venue draft');
    return response.json();
};

export const updateVenueListing = async (listingId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update venue listing');
    return response.json();
};

export const deleteVenueListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete venue listing');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

export const submitVenueListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/submit/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to submit venue listing');
    return response.json();
};

// ─── Venue Media ───────────────────────────────────────────────────────────

export const getVenueListingMedia = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/media/`);
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
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/media/`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) await handleError(response, 'Failed to upload venue media');
    return response.json();
};

export const deleteVenueListingMedia = async (listingId: string, mediaId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/media/${mediaId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete venue media');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Venue Packages ────────────────────────────────────────────────────────

export const getVenuePackages = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/packages/`);
    if (!response.ok) await handleError(response, 'Failed to load venue packages');
    return response.json();
};

export const createVenuePackage = async (
    listingId: string,
    data: Record<string, any>
) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/packages/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create venue package');
    return response.json();
};

export const updateVenuePackage = async (listingId: string, pkgId: number, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/packages/${pkgId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update venue package');
    return response.json();
};

export const deleteVenuePackage = async (listingId: string, pkgId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/packages/${pkgId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete venue package');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Venue Availability ────────────────────────────────────────────────────

export const getVenueAvailability = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/availability/`);
    if (!response.ok) await handleError(response, 'Failed to load venue availability');
    return response.json();
};

export const createVenueAvailabilitySlot = async (
    listingId: string,
    data: { date: string; start_time: string; end_time: string; note?: string }
) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/availability/`, {
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
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/availability/${slotId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update availability slot');
    return response.json();
};

export const deleteVenueAvailabilitySlot = async (listingId: string, slotId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/availability/${slotId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete availability slot');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Venue Attendee Fields ─────────────────────────────────────────────────

export const getVenueAttendeeFields = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/attendee-fields/`);
    if (!response.ok) await handleError(response, 'Failed to load attendee fields');
    return response.json();
};

export const updateVenueAttendeeFields = async (listingId: string, fields: string[]) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/attendee-fields/`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
    });
    if (!response.ok) await handleError(response, 'Failed to update attendee fields');
    return response.json();
};

// ─── Venue Discovery ───────────────────────────────────────────────────────

export const getVenueDiscovery = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/discovery/`);
    if (!response.ok) await handleError(response, 'Failed to load venue discovery metadata');
    return response.json();
};

export const updateVenueDiscovery = async (
    listingId: string,
    data: { outing_types?: string[]; activity_types?: string[]; format_types?: string[] }
) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/discovery/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update venue discovery metadata');
    return response.json();
};

// ─── Draft ID Helpers (sessionStorage) ────────────────────────────────────

const EVENT_DRAFT_KEY = 'current_event_draft_id';
const VENUE_DRAFT_KEY = 'current_venue_draft_id';
const CLASS_DRAFT_KEY = 'current_class_draft_id';
const PROGRAM_DRAFT_KEY = 'current_program_draft_id';

export const getCurrentDraftId = (): string | null => sessionStorage.getItem(EVENT_DRAFT_KEY);
export const setCurrentDraftId = (id: string) => sessionStorage.setItem(EVENT_DRAFT_KEY, id);
export const clearCurrentDraftId = () => sessionStorage.removeItem(EVENT_DRAFT_KEY);

export const getCurrentVenueDraftId = (): string | null => sessionStorage.getItem(VENUE_DRAFT_KEY);
export const setCurrentVenueDraftId = (id: string) => sessionStorage.setItem(VENUE_DRAFT_KEY, id);
export const clearCurrentVenueDraftId = () => sessionStorage.removeItem(VENUE_DRAFT_KEY);

export const getCurrentClassDraftId = (): string | null => sessionStorage.getItem(CLASS_DRAFT_KEY);
export const setCurrentClassDraftId = (id: string) => sessionStorage.setItem(CLASS_DRAFT_KEY, id);
export const clearCurrentClassDraftId = () => sessionStorage.removeItem(CLASS_DRAFT_KEY);

export const getCurrentProgramDraftId = (): string | null => sessionStorage.getItem(PROGRAM_DRAFT_KEY);
export const setCurrentProgramDraftId = (id: string) => sessionStorage.setItem(PROGRAM_DRAFT_KEY, id);
export const clearCurrentProgramDraftId = () => sessionStorage.removeItem(PROGRAM_DRAFT_KEY);

// ─── Class Listings ────────────────────────────────────────────────────────

export const getClassListings = async (status?: string) => {
    const url = status
        ? `/api/v1/partner/listings/classes/?status=${encodeURIComponent(status)}`
        : '/api/v1/partner/listings/classes/';
    const response = await apiClient(url);
    if (!response.ok) await handleError(response, 'Failed to load class listings');
    return response.json();
};

export const getClassListingDetail = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/`);
    if (!response.ok) await handleError(response, 'Failed to load class listing');
    return response.json();
};

export const createClassDraft = async (data: Record<string, any>) => {
    const response = await apiClient('/api/v1/partner/listings/classes/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create class draft');
    return response.json();
};

export const updateClassListing = async (listingId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update class listing');
    return response.json();
};

export const setClassListingLive = async (listingId: string, isLive: boolean) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/live/`, {
        method: 'POST',
        body: JSON.stringify({ is_live: isLive }),
    });
    if (!response.ok) await handleError(response, 'Failed to update class live status');
    return response.json();
};

export const submitClassListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/submit/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to submit class listing');
    return response.json();
};

// ─── Class Batches ─────────────────────────────────────────────────────────

export const getClassBatches = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/batches/`);
    if (!response.ok) await handleError(response, 'Failed to load class batches');
    return response.json();
};

export const createClassBatch = async (listingId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/batches/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create class batch');
    return response.json();
};

export const updateClassBatch = async (listingId: string, batchId: number, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/batches/${batchId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update class batch');
    return response.json();
};

export const deleteClassBatch = async (listingId: string, batchId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/batches/${batchId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete class batch');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Class Media ───────────────────────────────────────────────────────────

export const getClassMedia = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/media/`);
    if (!response.ok) await handleError(response, 'Failed to load class media');
    return response.json();
};

export const uploadClassMedia = async (
    listingId: string,
    file: File,
    mediaType: 'cover' | 'gallery' | 'video'
) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/media/`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) await handleError(response, 'Failed to upload class media');
    return response.json();
};

export const deleteClassMedia = async (listingId: string, mediaId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/${listingId}/media/${mediaId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete class media');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Class Enquiries ───────────────────────────────────────────────────────

export const getClassEnquiries = async (status?: string) => {
    const url = status
        ? `/api/v1/partner/listings/classes/enquiries/?status=${encodeURIComponent(status)}`
        : '/api/v1/partner/listings/classes/enquiries/';
    const response = await apiClient(url);
    if (!response.ok) await handleError(response, 'Failed to load class enquiries');
    return response.json();
};

export const getClassEnquiryDetail = async (enquiryId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/enquiries/${enquiryId}/`);
    if (!response.ok) await handleError(response, 'Failed to load class enquiry detail');
    return response.json();
};

export const updateClassEnquiry = async (enquiryId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/enquiries/${enquiryId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update class enquiry');
    return response.json();
};

export const unlockClassEnquiry = async (enquiryId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/classes/enquiries/${enquiryId}/unlock/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to unlock class enquiry');
    return response.json();
};

// ─── Program Metadata (public) ────────────────────────────────────────────

export const getProgramMetaCategories = async () => {
    const response = await apiClient('/api/v1/listings/programs/metadata/categories/');
    if (!response.ok) await handleError(response, 'Failed to load program categories');
    return response.json();
};

export const getProgramMetaFormats = async () => {
    const response = await apiClient('/api/v1/listings/programs/metadata/formats/');
    if (!response.ok) await handleError(response, 'Failed to load program formats');
    return response.json();
};

export const getProgramMetaTags = async () => {
    const response = await apiClient('/api/v1/listings/programs/metadata/tags/');
    if (!response.ok) await handleError(response, 'Failed to load program tags');
    return response.json();
};

// ─── Program Listings ──────────────────────────────────────────────────────

export const getProgramListings = async (status?: string) => {
    const url = status
        ? `/api/v1/partner/listings/programs/?status=${encodeURIComponent(status)}`
        : '/api/v1/partner/listings/programs/';
    const response = await apiClient(url);
    if (!response.ok) await handleError(response, 'Failed to load program listings');
    return response.json();
};

export const getProgramListingDetail = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/`);
    if (!response.ok) await handleError(response, 'Failed to load program listing');
    return response.json();
};

export const createProgramDraft = async (data: { title: string; short_description?: string; description?: string; booking_type?: string }) => {
    const response = await apiClient('/api/v1/partner/listings/programs/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create program draft');
    return response.json();
};

export const updateProgramListing = async (listingId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update program listing');
    return response.json();
};

export const deleteProgramListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete program listing');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

export const submitProgramListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/submit/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to submit program listing');
    return response.json();
};

export const archiveProgramListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/archive/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to archive program listing');
    return response.json();
};

export const unarchiveProgramListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/unarchive/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to unarchive program listing');
    return response.json();
};

// ─── Program Batches ───────────────────────────────────────────────────────

export const getProgramBatches = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/batches/`);
    if (!response.ok) await handleError(response, 'Failed to load program batches');
    return response.json();
};

export const createProgramBatch = async (listingId: string, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/batches/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create program batch');
    return response.json();
};

export const updateProgramBatch = async (listingId: string, batchId: number, data: Record<string, any>) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/batches/${batchId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update program batch');
    return response.json();
};

export const deleteProgramBatch = async (listingId: string, batchId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/batches/${batchId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete program batch');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Program Enquiries ─────────────────────────────────────────────────────

export const getProgramEnquiries = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/enquiries/`);
    if (!response.ok) await handleError(response, 'Failed to load program enquiries');
    return response.json();
};

export const updateProgramEnquiry = async (
    listingId: string,
    enquiryId: number,
    data: { status?: string; partner_note?: string }
) => {
    const response = await apiClient(
        `/api/v1/partner/listings/programs/${listingId}/enquiries/${enquiryId}/`,
        { method: 'PATCH', body: JSON.stringify(data) }
    );
    if (!response.ok) await handleError(response, 'Failed to update program enquiry');
    return response.json();
};

// ─── Program FAQs ──────────────────────────────────────────────────────────

export const getProgramFaqs = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/faqs/`);
    if (!response.ok) await handleError(response, 'Failed to load program FAQs');
    return response.json();
};

export const createProgramFaq = async (
    listingId: string,
    data: { question: string; answer: string; sort_order?: number }
) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/faqs/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to create program FAQ');
    return response.json();
};

export const updateProgramFaq = async (
    listingId: string,
    faqId: number,
    data: { question: string; answer: string; sort_order?: number }
) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/faqs/${faqId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) await handleError(response, 'Failed to update program FAQ');
    return response.json();
};

export const deleteProgramFaq = async (listingId: string, faqId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/faqs/${faqId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) await handleError(response, 'Failed to delete program FAQ');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Event FAQs ─────────────────────────────────────────────────────────────
export const getEventFaqs = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/faqs/`);
    if (!response.ok) await handleError(response, 'Failed to load event FAQs');
    return response.json();
};
export const createEventFaq = async (listingId: string, data: { question: string; answer: string; sort_order?: number }) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/faqs/`, { method: 'POST', body: JSON.stringify(data) });
    if (!response.ok) await handleError(response, 'Failed to create event FAQ');
    return response.json();
};
export const updateEventFaq = async (listingId: string, faqId: number, data: { question: string; answer: string; sort_order?: number }) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/faqs/${faqId}/`, { method: 'PUT', body: JSON.stringify(data) });
    if (!response.ok) await handleError(response, 'Failed to update event FAQ');
    return response.json();
};
export const deleteEventFaq = async (listingId: string, faqId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/events/${listingId}/faqs/${faqId}/`, { method: 'DELETE' });
    if (!response.ok) await handleError(response, 'Failed to delete event FAQ');
    return response.status === 204 ? {} : response.json().catch(() => ({}));
};

// ─── Venue FAQs ─────────────────────────────────────────────────────────────
export const getVenueFaqs = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/faqs/`);
    if (!response.ok) await handleError(response, 'Failed to load venue FAQs');
    return response.json();
};
export const createVenueFaq = async (listingId: string, data: { question: string; answer: string; sort_order?: number }) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/faqs/`, { method: 'POST', body: JSON.stringify(data) });
    if (!response.ok) await handleError(response, 'Failed to create venue FAQ');
    return response.json();
};
export const updateVenueFaq = async (listingId: string, faqId: number, data: { question: string; answer: string; sort_order?: number }) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/faqs/${faqId}/`, { method: 'PUT', body: JSON.stringify(data) });
    if (!response.ok) await handleError(response, 'Failed to update venue FAQ');
    return response.json();
};
export const deleteVenueFaq = async (listingId: string, faqId: number) => {
    const response = await apiClient(`/api/v1/partner/listings/venues/${listingId}/faqs/${faqId}/`, { method: 'DELETE' });
    if (!response.ok) await handleError(response, 'Failed to delete venue FAQ');
    return response.status === 204 ? {} : response.json().catch(() => ({}));
};

// ─── Terms & Conditions (generic — works for all listing types) ─────────────
export const getListingTerms = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/${listingId}/terms/`);
    if (response.status === 404) return null; // TERMS_NOT_FOUND → not set yet
    if (!response.ok) await handleError(response, 'Failed to load terms');
    return response.json();
};
export const setListingTerms = async (listingId: string, data: { content?: string; document?: File | null }) => {
    const fd = new FormData();
    if (data.content != null) fd.append('content', data.content);
    if (data.document) fd.append('document', data.document);
    const response = await apiClient(`/api/v1/partner/listings/${listingId}/terms/`, { method: 'PUT', body: fd });
    if (!response.ok) await handleError(response, 'Failed to save terms');
    return response.json();
};
export const deleteListingTerms = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/${listingId}/terms/`, { method: 'DELETE' });
    if (!response.ok) await handleError(response, 'Failed to delete terms');
    return {};
};

// ─── Program Media ─────────────────────────────────────────────────────────

export const getProgramMedia = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/media/`);
    if (!response.ok) await handleError(response, 'Failed to load program media');
    return response.json();
};

export const uploadProgramMedia = async (
    listingId: string,
    file: File,
    mediaType: 'cover' | 'gallery' | 'video'
) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);
    const response = await apiClient(`/api/v1/partner/listings/programs/${listingId}/media/`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) await handleError(response, 'Failed to upload program media');
    return response.json();
};

export const deleteProgramMedia = async (listingId: string, mediaId: number) => {
    const response = await apiClient(
        `/api/v1/partner/listings/programs/${listingId}/media/${mediaId}/`,
        { method: 'DELETE' }
    );
    if (!response.ok) await handleError(response, 'Failed to delete program media');
    if (response.status === 204) return {};
    return response.json().catch(() => ({}));
};

// ─── Bookings ──────────────────────────────────────────────────────────────

export const getBookings = async (params?: { status?: string; listing_id?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.listing_id) qs.set('listing_id', params.listing_id);
    if (params?.page && params.page > 1) qs.set('page', String(params.page));
    const query = qs.toString();
    const url = query ? `/api/v1/partner/bookings/?${query}` : '/api/v1/partner/bookings/';
    const response = await apiClient(url);
    if (!response.ok) await handleError(response, 'Failed to load bookings');
    return response.json();
};

export const getBookingDetail = async (bookingId: string) => {
    const response = await apiClient(`/api/v1/partner/bookings/${bookingId}/`);
    if (!response.ok) await handleError(response, 'Failed to load booking detail');
    return response.json();
};

export const markBookingAttended = async (bookingId: string) => {
    const response = await apiClient(`/api/v1/partner/bookings/${bookingId}/mark-attended/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to mark booking as attended');
    return response.json();
};

// NOTE: Partners cannot cancel attendee bookings — POST /cancel/ returns 403
// PARTNER_BOOKING_CANCEL_FORBIDDEN. Only customers can cancel their own bookings.
// `cancelBooking` is kept for reference/tests but is no longer wired into the UI.
export const cancelBooking = async (bookingId: string, reason?: string) => {
    const response = await apiClient(`/api/v1/partner/bookings/${bookingId}/cancel/`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'partner_cancellation' }),
    });
    if (!response.ok) await handleError(response, 'Failed to cancel booking');
    return response.json();
};

// Payment summary — partners only see method type + amount (no card/UPI details).
export const getBookingPaymentDetail = async (bookingId: string) => {
    const response = await apiClient(`/api/v1/partner/bookings/${bookingId}/payment-detail/`);
    if (!response.ok) await handleError(response, 'Failed to load payment detail');
    return response.json();
};

// ─── Generic Listing Actions (entity-agnostic) ──────────────────────────────

export const pauseListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/${listingId}/pause/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to pause listing');
    return response.json();
};

export const resumeListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/${listingId}/resume/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to resume listing');
    return response.json();
};

export const archiveListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/${listingId}/archive/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to archive listing');
    return response.json();
};

export const unarchiveListing = async (listingId: string) => {
    const response = await apiClient(`/api/v1/partner/listings/${listingId}/unarchive/`, {
        method: 'POST',
    });
    if (!response.ok) await handleError(response, 'Failed to unarchive listing');
    return response.json();
};

