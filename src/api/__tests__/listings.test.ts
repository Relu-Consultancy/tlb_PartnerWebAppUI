import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { DRAFT_ID, mockCategories, mockFormats, mockAgeGroups, mockDraft, mockListing } from '../../test/msw/handlers';
import {
    ApiError,
    getEventMetaCategories,
    getEventMetaFormats,
    getEventMetaAgeGroups,
    getListings,
    getListingDetail,
    createEventDraft,
    updateListing,
    submitListing,
    uploadListingMedia,
    deleteListingMedia,
    createTicket,
    updateTicket,
    deleteTicket,
    getCurrentDraftId,
    setCurrentDraftId,
    clearCurrentDraftId,
} from '../listings';

const BASE = 'https://tlb-api.reluconsultancy.in';

// ─── ApiError class ───────────────────────────────────────────────────────────

describe('ApiError', () => {
    it('preserves message and code', () => {
        const err = new ApiError('Something broke', 'PARTNER_UNDER_REVIEW');
        expect(err.message).toBe('Something broke');
        expect(err.code).toBe('PARTNER_UNDER_REVIEW');
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(ApiError);
    });

    it('is distinguishable via instanceof', () => {
        const err = new ApiError('msg', 'CODE');
        expect(err instanceof ApiError).toBe(true);
        expect(new Error('plain') instanceof ApiError).toBe(false);
    });
});

// ─── Draft ID helpers (sessionStorage) ───────────────────────────────────────

describe('Draft ID helpers', () => {
    beforeEach(() => sessionStorage.clear());

    it('returns null when nothing is stored', () => {
        expect(getCurrentDraftId()).toBeNull();
    });

    it('sets and retrieves a draft id', () => {
        setCurrentDraftId('abc-123');
        expect(getCurrentDraftId()).toBe('abc-123');
    });

    it('clears the draft id', () => {
        setCurrentDraftId('abc-123');
        clearCurrentDraftId();
        expect(getCurrentDraftId()).toBeNull();
    });

    it('overwrites an existing draft id', () => {
        setCurrentDraftId('first');
        setCurrentDraftId('second');
        expect(getCurrentDraftId()).toBe('second');
    });
});

// ─── Metadata endpoints ───────────────────────────────────────────────────────

describe('getEventMetaCategories', () => {
    it('returns category data', async () => {
        const res = await getEventMetaCategories();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].name).toBe('Dance');
        expect(data[0].subcategories[0].name).toBe('Classical');
    });

    it('throws ApiError on server failure', async () => {
        server.use(http.get(`${BASE}/api/v1/listings/metadata/categories/`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 })));
        await expect(getEventMetaCategories()).rejects.toBeInstanceOf(ApiError);
    });
});

describe('getEventMetaFormats', () => {
    it('returns format list with value and label', async () => {
        const res = await getEventMetaFormats();
        const data = res.data || res;
        expect(data).toHaveLength(3);
        expect(data[0]).toMatchObject({ value: 'workshop', label: 'Workshop' });
    });
});

describe('getEventMetaAgeGroups', () => {
    it('returns static ranges and custom_range config', async () => {
        const res = await getEventMetaAgeGroups();
        const data = res.data || res;
        expect(data.static_ranges).toHaveLength(5);
        expect(data.static_ranges[2]).toMatchObject({ min_age: 6, max_age: 8, label: '6–8 years' });
        expect(data.custom_range.enabled).toBe(true);
        expect(data.custom_range.max_allowed_age).toBe(18);
    });
});

// ─── Listings CRUD ────────────────────────────────────────────────────────────

describe('getListings', () => {
    it('returns array of listings', async () => {
        const res = await getListings();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].id).toBe(DRAFT_ID);
        expect(data[0].listing_type).toBe('event');
    });

    it('accepts optional status filter', async () => {
        let capturedUrl = '';
        server.use(http.get(`${BASE}/api/v1/partners/listings/`, ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json({ success: true, data: [] });
        }));
        await getListings('draft');
        expect(capturedUrl).toContain('status=draft');
    });

    it('throws ApiError on 401', async () => {
        server.use(http.get(`${BASE}/api/v1/partners/listings/`, () =>
            HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } }, { status: 401 })));
        await expect(getListings()).rejects.toBeInstanceOf(ApiError);
    });
});

describe('getListingDetail', () => {
    it('returns full draft data', async () => {
        const res = await getListingDetail(DRAFT_ID);
        const data = res.data || res;
        expect(data.id).toBe(DRAFT_ID);
        expect(data.status).toBe('draft');
        expect(data.category.name).toBe('Dance');
        expect(data.tickets).toHaveLength(1);
        expect(data.media).toHaveLength(1);
    });

    it('throws ApiError with NOT_FOUND code on 404', async () => {
        server.use(http.get(`${BASE}/api/v1/partners/listings/bad-id/`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, { status: 404 })));
        const err = await getListingDetail('bad-id').catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('NOT_FOUND');
        expect(err.message).toBe('Listing not found');
    });
});

describe('createEventDraft', () => {
    it('creates draft and returns id', async () => {
        const res = await createEventDraft({ title: 'My Event', description: 'desc' });
        const data = res.data || res;
        expect(data.id).toBe(DRAFT_ID);
        expect(data.status).toBe('draft');
    });

    it('creates draft with no fields (all optional)', async () => {
        const res = await createEventDraft({});
        expect((res.data || res).id).toBeDefined();
    });

    it('throws ApiError with INVALID_PARTNER_STATE on 403', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/create/`, () =>
            HttpResponse.json({ error: { code: 'INVALID_PARTNER_STATE', message: 'Partner not activated' } }, { status: 403 })));
        const err = await createEventDraft({ title: 'Test' }).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('INVALID_PARTNER_STATE');
    });

    it('throws ApiError with EVENTS_CATEGORY_NOT_SELECTED on 403', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/create/`, () =>
            HttpResponse.json({ error: { code: 'EVENTS_CATEGORY_NOT_SELECTED', message: 'Select Events category first' } }, { status: 403 })));
        const err = await createEventDraft({}).catch(e => e);
        expect(err.code).toBe('EVENTS_CATEGORY_NOT_SELECTED');
    });
});

describe('updateListing', () => {
    it('sends payload and returns updated draft', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/update/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { ...mockDraft, title: 'Updated' } });
        }));
        const res = await updateListing(DRAFT_ID, { title: 'Updated', category_id: 1 });
        expect(captured.title).toBe('Updated');
        expect(captured.category_id).toBe(1);
        expect((res.data || res).title).toBe('Updated');
    });

    it('throws ApiError with VALIDATION_ERROR on 400', async () => {
        server.use(http.put(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/update/`, () =>
            HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'end_datetime must be after start_datetime' } }, { status: 400 })));
        const err = await updateListing(DRAFT_ID, { end_datetime: '2020-01-01T00:00:00Z' }).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('VALIDATION_ERROR');
    });

    it('throws ApiError with LISTING_LOCKED on 400', async () => {
        server.use(http.put(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/update/`, () =>
            HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Listing is pending' } }, { status: 400 })));
        const err = await updateListing(DRAFT_ID, { title: 'x' }).catch(e => e);
        expect(err.code).toBe('LISTING_LOCKED');
    });
});

describe('submitListing', () => {
    it('returns event with status pending on success', async () => {
        const res = await submitListing(DRAFT_ID);
        const data = res.data || res;
        expect(data.status).toBe('pending');
    });

    it('throws ApiError with PARTNER_UNDER_REVIEW on 403', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/submit/`, () =>
            HttpResponse.json({ error: { code: 'PARTNER_UNDER_REVIEW', message: 'Your profile is under review' } }, { status: 403 })));
        const err = await submitListing(DRAFT_ID).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('PARTNER_UNDER_REVIEW');
        expect(err.message).toContain('under review');
    });

    it('throws ApiError with INCOMPLETE_EVENT (NOT under_review) on 400', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/submit/`, () =>
            HttpResponse.json({ error: { code: 'INCOMPLETE_EVENT', message: 'Missing: cover image, category' } }, { status: 400 })));
        const err = await submitListing(DRAFT_ID).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('INCOMPLETE_EVENT');
        expect(err.code).not.toBe('PARTNER_UNDER_REVIEW');
    });

    it('throws ApiError with LISTING_LOCKED when already pending', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/submit/`, () =>
            HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Already pending' } }, { status: 400 })));
        const err = await submitListing(DRAFT_ID).catch(e => e);
        expect(err.code).toBe('LISTING_LOCKED');
    });
});

// ─── Media ────────────────────────────────────────────────────────────────────

describe('uploadListingMedia', () => {
    const makeFile = (name = 'photo.jpg', type = 'image/jpeg', size = 1024) => {
        const buf = new ArrayBuffer(size);
        return new File([buf], name, { type });
    };

    it('uploads cover and returns media item', async () => {
        let capturedType = '';
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/`, async ({ request }) => {
            const form = await request.formData();
            capturedType = form.get('media_type') as string;
            return HttpResponse.json({ success: true, data: { id: 99, media_type: 'cover', file_url: 'https://example.com/c.jpg', created_at: '' } }, { status: 201 });
        }));
        const res = await uploadListingMedia(DRAFT_ID, makeFile(), 'cover');
        expect(capturedType).toBe('cover');
        expect((res.data || res).media_type).toBe('cover');
    });

    it('throws ApiError with COVER_ALREADY_EXISTS when cover exists', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'COVER_ALREADY_EXISTS', message: 'Delete existing cover first' } }, { status: 400 })));
        const err = await uploadListingMedia(DRAFT_ID, makeFile(), 'cover').catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('COVER_ALREADY_EXISTS');
    });

    it('throws ApiError with GALLERY_LIMIT_EXCEEDED', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'GALLERY_LIMIT_EXCEEDED', message: 'Max 10 gallery images' } }, { status: 400 })));
        const err = await uploadListingMedia(DRAFT_ID, makeFile(), 'gallery').catch(e => e);
        expect(err.code).toBe('GALLERY_LIMIT_EXCEEDED');
    });

    it('throws ApiError with INVALID_FILE_FORMAT', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'INVALID_FILE_FORMAT', message: 'Only JPG/PNG allowed' } }, { status: 400 })));
        const err = await uploadListingMedia(DRAFT_ID, makeFile('doc.pdf', 'application/pdf'), 'gallery').catch(e => e);
        expect(err.code).toBe('INVALID_FILE_FORMAT');
    });
});

describe('deleteListingMedia', () => {
    it('returns empty object on 204 No Content', async () => {
        const res = await deleteListingMedia(DRAFT_ID, 55);
        expect(res).toEqual({});
    });

    it('returns empty object on 200 with no body', async () => {
        server.use(http.delete(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/:mediaId`, () =>
            HttpResponse.json({})));
        const res = await deleteListingMedia(DRAFT_ID, 55);
        expect(res).toBeDefined();
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/:mediaId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Media not found' } }, { status: 404 })));
        const err = await deleteListingMedia(DRAFT_ID, 999).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ─── Tickets ──────────────────────────────────────────────────────────────────

describe('createTicket', () => {
    it('creates ticket and returns it', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { id: 10, name: 'General', price: 499, total_quantity: 50, available_quantity: 50, description: '', is_default: false, created_at: '' } }, { status: 201 });
        }));
        const res = await createTicket(DRAFT_ID, { name: 'General', price: 499, total_quantity: 50 });
        expect(captured.name).toBe('General');
        expect(captured.price).toBe(499);
        expect((res.data || res).id).toBe(10);
    });

    it('throws ApiError with FREE_EVENT_NO_MANUAL_TICKETS on free event', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/`, () =>
            HttpResponse.json({ error: { code: 'FREE_EVENT_NO_MANUAL_TICKETS', message: 'Cannot add tickets to a free event' } }, { status: 400 })));
        const err = await createTicket(DRAFT_ID, { name: 'X', price: 0, total_quantity: 10 }).catch(e => e);
        expect(err.code).toBe('FREE_EVENT_NO_MANUAL_TICKETS');
    });

    it('throws ApiError with LISTING_LOCKED', async () => {
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/`, () =>
            HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Listing is not editable' } }, { status: 400 })));
        const err = await createTicket(DRAFT_ID, { name: 'X', price: 100, total_quantity: 5 }).catch(e => e);
        expect(err.code).toBe('LISTING_LOCKED');
    });
});

describe('updateTicket', () => {
    it('sends partial update payload', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/:ticketId`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: {} });
        }));
        await updateTicket(DRAFT_ID, 1, { price: 599, total_quantity: 60 });
        expect(captured.price).toBe(599);
        expect(captured.total_quantity).toBe(60);
    });

    it('throws ApiError with INVALID_TICKET_QUANTITY', async () => {
        server.use(http.put(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/:ticketId`, () =>
            HttpResponse.json({ error: { code: 'INVALID_TICKET_QUANTITY', message: 'available_quantity exceeds total' } }, { status: 400 })));
        const err = await updateTicket(DRAFT_ID, 1, { available_quantity: 999 }).catch(e => e);
        expect(err.code).toBe('INVALID_TICKET_QUANTITY');
    });
});

describe('deleteTicket', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteTicket(DRAFT_ID, 1);
        expect(res).toEqual({});
    });

    it('throws ApiError with CANNOT_DELETE_LAST_TICKET', async () => {
        server.use(http.delete(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/:ticketId`, () =>
            HttpResponse.json({ error: { code: 'CANNOT_DELETE_LAST_TICKET', message: 'Must keep at least 1 ticket' } }, { status: 400 })));
        const err = await deleteTicket(DRAFT_ID, 1).catch(e => e);
        expect(err.code).toBe('CANNOT_DELETE_LAST_TICKET');
    });
});
