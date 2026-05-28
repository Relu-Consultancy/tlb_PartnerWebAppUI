import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import {
    CLASS_DRAFT_ID,
    PROGRAM_DRAFT_ID,
    VENUE_DRAFT_ID,
    mockClassDraft,
    mockClassBatches,
    mockClassEnquiry,
    mockProgramDraft,
    mockProgramBatches,
    mockProgramFaqs,
    mockProgramEnquiry,
    mockVenueDraft,
    mockVenuePackages,
    mockVenueSlots,
} from '../../test/msw/handlers';
import {
    // Class metadata
    getClassMetaCategories,
    getClassMetaFormats,
    // Class listings
    getClassListings,
    getClassListingDetail,
    createClassDraft,
    updateClassListing,
    setClassListingLive,
    submitClassListing,
    // Class batches
    getClassBatches,
    createClassBatch,
    updateClassBatch,
    deleteClassBatch,
    // Class media
    getClassMedia,
    uploadClassMedia,
    deleteClassMedia,
    // Class enquiries
    getClassEnquiries,
    getClassEnquiryDetail,
    updateClassEnquiry,
    unlockClassEnquiry,
    // Class draft helpers
    getCurrentClassDraftId,
    setCurrentClassDraftId,
    clearCurrentClassDraftId,
    // Program metadata
    getProgramMetaCategories,
    getProgramMetaFormats,
    getProgramMetaTags,
    // Program listings
    getProgramListings,
    getProgramListingDetail,
    createProgramDraft,
    updateProgramListing,
    deleteProgramListing,
    submitProgramListing,
    archiveProgramListing,
    unarchiveProgramListing,
    // Program batches
    getProgramBatches,
    createProgramBatch,
    updateProgramBatch,
    deleteProgramBatch,
    // Program enquiries
    getProgramEnquiries,
    updateProgramEnquiry,
    // Program FAQs
    getProgramFaqs,
    createProgramFaq,
    updateProgramFaq,
    deleteProgramFaq,
    // Program media
    uploadProgramMedia,
    deleteProgramMedia,
    // Program draft helpers
    getCurrentProgramDraftId,
    setCurrentProgramDraftId,
    clearCurrentProgramDraftId,
    // Venue metadata
    getVenueMetaCategories,
    getVenueMetaDiscoveryEnums,
    getVenueMetaOccasions,
    // Venue listings
    getVenueListings,
    getVenueListingDetail,
    createVenueDraft,
    updateVenueListing,
    deleteVenueListing,
    submitVenueListing,
    // Venue media
    getVenueListingMedia,
    uploadVenueListingMedia,
    deleteVenueListingMedia,
    // Venue packages
    getVenuePackages,
    createVenuePackage,
    updateVenuePackage,
    deleteVenuePackage,
    // Venue availability
    getVenueAvailability,
    createVenueAvailabilitySlot,
    updateVenueAvailabilitySlot,
    deleteVenueAvailabilitySlot,
    // Venue attendee fields & discovery
    getVenueAttendeeFields,
    updateVenueAttendeeFields,
    getVenueDiscovery,
    updateVenueDiscovery,
    // Venue draft helpers
    getCurrentVenueDraftId,
    setCurrentVenueDraftId,
    clearCurrentVenueDraftId,
    ApiError,
} from '../listings';

const BASE = 'https://tlb-api.reluconsultancy.in';
const makeFile = (name = 'photo.jpg', type = 'image/jpeg', size = 1024) =>
    new File([new ArrayBuffer(size)], name, { type });

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Class draft ID helpers', () => {
    beforeEach(() => sessionStorage.clear());

    it('returns null when nothing stored', () => {
        expect(getCurrentClassDraftId()).toBeNull();
    });

    it('sets and retrieves a draft id', () => {
        setCurrentClassDraftId('cls-abc');
        expect(getCurrentClassDraftId()).toBe('cls-abc');
    });

    it('clears the draft id', () => {
        setCurrentClassDraftId('cls-abc');
        clearCurrentClassDraftId();
        expect(getCurrentClassDraftId()).toBeNull();
    });

    it('overwrites an existing draft id', () => {
        setCurrentClassDraftId('first');
        setCurrentClassDraftId('second');
        expect(getCurrentClassDraftId()).toBe('second');
    });

    it('is isolated from event and program draft keys', () => {
        setCurrentClassDraftId('cls-1');
        expect(getCurrentProgramDraftId()).toBeNull();
        expect(getCurrentVenueDraftId()).toBeNull();
    });
});

// ─── Class metadata ───────────────────────────────────────────────────────────

describe('getClassMetaCategories', () => {
    it('returns category list', async () => {
        const res = await getClassMetaCategories();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].name).toBe('Dance');
        expect(data[0].subcategories[0].name).toBe('Classical');
    });

    it('throws ApiError on server failure', async () => {
        server.use(http.get(`${BASE}/api/v1/listings/classes/metadata/categories/`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 })));
        await expect(getClassMetaCategories()).rejects.toBeInstanceOf(ApiError);
    });
});

describe('getClassMetaFormats', () => {
    it('returns format list', async () => {
        const res = await getClassMetaFormats();
        const modes = res.data?.modes || res.data || res;
        expect(modes[0]).toMatchObject({ value: 'online', label: 'Online' });
    });
});

// ─── Class listings ───────────────────────────────────────────────────────────

describe('getClassListings', () => {
    it('returns array of class listings', async () => {
        const res = await getClassListings();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].listing_type).toBe('class');
    });

    it('appends status query param', async () => {
        let capturedUrl = '';
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/`, ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json({ success: true, data: [] });
        }));
        await getClassListings('published');
        expect(capturedUrl).toContain('status=published');
    });

    it('throws ApiError on 401', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/`, () =>
            HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } }, { status: 401 })));
        await expect(getClassListings()).rejects.toBeInstanceOf(ApiError);
    });
});

describe('getClassListingDetail', () => {
    it('returns class draft data', async () => {
        const res = await getClassListingDetail(CLASS_DRAFT_ID);
        const data = res.data || res;
        expect(data.id).toBe(CLASS_DRAFT_ID);
        expect(data.listing_type).toBe('class');
        expect(data.status).toBe('draft');
    });

    it('throws ApiError with NOT_FOUND on missing id', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/bad-id/`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Class not found' } }, { status: 404 })));
        const err = await getClassListingDetail('bad-id').catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('NOT_FOUND');
    });
});

describe('createClassDraft', () => {
    it('creates draft and returns id', async () => {
        const res = await createClassDraft({ title: 'My Class' });
        const data = res.data || res;
        expect(data.id).toBe(CLASS_DRAFT_ID);
        expect(data.status).toBe('draft');
    });

    it('sends payload in request body', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockClassDraft }, { status: 201 });
        }));
        await createClassDraft({ title: 'Yoga Flow', category_id: 3 });
        expect(captured.title).toBe('Yoga Flow');
        expect(captured.category_id).toBe(3);
    });

    it('throws ApiError with INVALID_PARTNER_STATE on 403', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/`, () =>
            HttpResponse.json({ error: { code: 'INVALID_PARTNER_STATE', message: 'Partner not active' } }, { status: 403 })));
        const err = await createClassDraft({}).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('INVALID_PARTNER_STATE');
    });
});

describe('updateClassListing', () => {
    it('sends patch payload and returns updated draft', async () => {
        let captured: any = null;
        server.use(http.patch(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { ...mockClassDraft, title: 'Updated Class' } });
        }));
        const res = await updateClassListing(CLASS_DRAFT_ID, { title: 'Updated Class', format: 'camp' });
        expect(captured.title).toBe('Updated Class');
        expect(captured.format).toBe('camp');
        expect((res.data || res).title).toBe('Updated Class');
    });

    it('throws ApiError with LISTING_LOCKED on 400', async () => {
        server.use(http.patch(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, () =>
            HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Not editable' } }, { status: 400 })));
        const err = await updateClassListing(CLASS_DRAFT_ID, { title: 'x' }).catch(e => e);
        expect(err.code).toBe('LISTING_LOCKED');
    });
});

describe('setClassListingLive', () => {
    it('sends is_live: true', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/live/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { ...mockClassDraft, is_live: true } });
        }));
        const res = await setClassListingLive(CLASS_DRAFT_ID, true);
        expect(captured.is_live).toBe(true);
        expect((res.data || res).is_live).toBe(true);
    });

    it('sends is_live: false to pause', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/live/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { ...mockClassDraft, is_live: false } });
        }));
        await setClassListingLive(CLASS_DRAFT_ID, false);
        expect(captured.is_live).toBe(false);
    });

    it('throws ApiError on failure', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/live/`, () =>
            HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Cannot set live' } }, { status: 400 })));
        const err = await setClassListingLive(CLASS_DRAFT_ID, true).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('LISTING_LOCKED');
    });
});

describe('submitClassListing', () => {
    it('returns class with status pending', async () => {
        const res = await submitClassListing(CLASS_DRAFT_ID);
        expect((res.data || res).status).toBe('pending');
    });

    it('throws ApiError with PARTNER_UNDER_REVIEW on 403', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/submit/`, () =>
            HttpResponse.json({ error: { code: 'PARTNER_UNDER_REVIEW', message: 'Under review' } }, { status: 403 })));
        const err = await submitClassListing(CLASS_DRAFT_ID).catch(e => e);
        expect(err.code).toBe('PARTNER_UNDER_REVIEW');
    });

    it('throws ApiError with INCOMPLETE_CLASS on 400', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/submit/`, () =>
            HttpResponse.json({ error: { code: 'INCOMPLETE_CLASS', message: 'Missing cover image' } }, { status: 400 })));
        const err = await submitClassListing(CLASS_DRAFT_ID).catch(e => e);
        expect(err.code).toBe('INCOMPLETE_CLASS');
    });
});

// ─── Class batches ────────────────────────────────────────────────────────────

describe('getClassBatches', () => {
    it('returns array of batches', async () => {
        const res = await getClassBatches(CLASS_DRAFT_ID);
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].name).toBe('Batch A');
        expect(data[0].days_of_week).toContain('monday');
    });
});

describe('createClassBatch', () => {
    it('sends batch payload and returns created batch', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockClassBatches[0] }, { status: 201 });
        }));
        await createClassBatch(CLASS_DRAFT_ID, {
            name: 'Batch B',
            start_date: '2026-09-01',
            end_date: '2026-10-01',
            start_time: '14:00:00',
            end_time: '15:00:00',
            fee: '600',
            total_seats: 25,
            days_of_week: ['friday'],
        });
        expect(captured.name).toBe('Batch B');
        expect(captured.days_of_week).toContain('friday');
    });

    it('throws ApiError with VALIDATION_ERROR on bad dates', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/`, () =>
            HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'end_date must be after start_date' } }, { status: 400 })));
        const err = await createClassBatch(CLASS_DRAFT_ID, { start_date: '2026-12-01', end_date: '2026-01-01' }).catch(e => e);
        expect(err.code).toBe('VALIDATION_ERROR');
    });
});

describe('updateClassBatch', () => {
    it('sends updated batch data', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/:batchId`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockClassBatches[0] });
        }));
        await updateClassBatch(CLASS_DRAFT_ID, 1, { fee: '750', total_seats: 30 });
        expect(captured.fee).toBe('750');
        expect(captured.total_seats).toBe(30);
    });
});

describe('deleteClassBatch', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteClassBatch(CLASS_DRAFT_ID, 1);
        expect(res).toEqual({});
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/:batchId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Batch not found' } }, { status: 404 })));
        const err = await deleteClassBatch(CLASS_DRAFT_ID, 999).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ─── Class media ──────────────────────────────────────────────────────────────

describe('getClassMedia', () => {
    it('returns media array', async () => {
        const res = await getClassMedia(CLASS_DRAFT_ID);
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
    });
});

describe('uploadClassMedia', () => {
    it('uploads cover and returns media item', async () => {
        let capturedType = '';
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/media/`, async ({ request }) => {
            const form = await request.formData();
            capturedType = form.get('media_type') as string;
            return HttpResponse.json({ success: true, data: { id: 10, media_type: 'cover', file_url: 'https://example.com/class-cover.jpg', created_at: '' } }, { status: 201 });
        }));
        const res = await uploadClassMedia(CLASS_DRAFT_ID, makeFile(), 'cover');
        expect(capturedType).toBe('cover');
        expect((res.data || res).media_type).toBe('cover');
    });

    it('throws ApiError with COVER_ALREADY_EXISTS', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'COVER_ALREADY_EXISTS', message: 'Delete existing cover first' } }, { status: 400 })));
        const err = await uploadClassMedia(CLASS_DRAFT_ID, makeFile(), 'cover').catch(e => e);
        expect(err.code).toBe('COVER_ALREADY_EXISTS');
    });

    it('throws ApiError with GALLERY_LIMIT_EXCEEDED', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'GALLERY_LIMIT_EXCEEDED', message: 'Max 10 gallery images' } }, { status: 400 })));
        const err = await uploadClassMedia(CLASS_DRAFT_ID, makeFile(), 'gallery').catch(e => e);
        expect(err.code).toBe('GALLERY_LIMIT_EXCEEDED');
    });

    it('throws ApiError with INVALID_FILE_FORMAT', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'INVALID_FILE_FORMAT', message: 'Only JPG/PNG allowed' } }, { status: 400 })));
        const err = await uploadClassMedia(CLASS_DRAFT_ID, makeFile('doc.pdf', 'application/pdf'), 'gallery').catch(e => e);
        expect(err.code).toBe('INVALID_FILE_FORMAT');
    });
});

describe('deleteClassMedia', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteClassMedia(CLASS_DRAFT_ID, 10);
        expect(res).toEqual({});
    });

    it('throws ApiError with NOT_FOUND on bad id', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/media/:mediaId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Media not found' } }, { status: 404 })));
        const err = await deleteClassMedia(CLASS_DRAFT_ID, 999).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ─── Class enquiries ──────────────────────────────────────────────────────────

describe('getClassEnquiries', () => {
    it('returns array of enquiries', async () => {
        const res = await getClassEnquiries();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].id).toBe('enq-001');
        expect(data[0].status).toBe('new');
    });

    it('appends status query param', async () => {
        let capturedUrl = '';
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/enquiries/`, ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json({ success: true, data: [] });
        }));
        await getClassEnquiries('contacted');
        expect(capturedUrl).toContain('status=contacted');
    });
});

describe('getClassEnquiryDetail', () => {
    it('returns single enquiry detail', async () => {
        const res = await getClassEnquiryDetail('enq-001');
        const data = res.data || res;
        expect(data.id).toBe('enq-001');
        expect(data.is_locked).toBe(true);
    });
});

describe('updateClassEnquiry', () => {
    it('sends update payload and returns updated enquiry', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/classes/enquiries/:enquiryId`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { ...mockClassEnquiry, status: 'contacted' } });
        }));
        const res = await updateClassEnquiry('enq-001', { status: 'contacted' });
        expect(captured.status).toBe('contacted');
        expect((res.data || res).status).toBe('contacted');
    });
});

describe('unlockClassEnquiry', () => {
    it('returns unlocked enquiry', async () => {
        const res = await unlockClassEnquiry('enq-001');
        const data = res.data || res;
        expect(data.is_locked).toBe(false);
    });

    it('throws ApiError on 403 (insufficient credits)', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/enquiries/:enquiryId/unlock/`, () =>
            HttpResponse.json({ error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' } }, { status: 403 })));
        const err = await unlockClassEnquiry('enq-001').catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('INSUFFICIENT_CREDITS');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRAMS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Program draft ID helpers', () => {
    beforeEach(() => sessionStorage.clear());

    it('returns null when nothing stored', () => {
        expect(getCurrentProgramDraftId()).toBeNull();
    });

    it('sets and retrieves a draft id', () => {
        setCurrentProgramDraftId('prog-xyz');
        expect(getCurrentProgramDraftId()).toBe('prog-xyz');
    });

    it('clears the draft id', () => {
        setCurrentProgramDraftId('prog-xyz');
        clearCurrentProgramDraftId();
        expect(getCurrentProgramDraftId()).toBeNull();
    });

    it('is isolated from class and venue draft keys', () => {
        setCurrentProgramDraftId('prog-1');
        expect(getCurrentClassDraftId()).toBeNull();
        expect(getCurrentVenueDraftId()).toBeNull();
    });
});

// ─── Program metadata ─────────────────────────────────────────────────────────

describe('getProgramMetaCategories', () => {
    it('returns program categories', async () => {
        const res = await getProgramMetaCategories();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].name).toBe('Dance');
    });

    it('throws ApiError on server failure', async () => {
        server.use(http.get(`${BASE}/api/v1/listings/programs/metadata/categories/`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 })));
        await expect(getProgramMetaCategories()).rejects.toBeInstanceOf(ApiError);
    });
});

describe('getProgramMetaFormats', () => {
    it('returns program formats', async () => {
        const res = await getProgramMetaFormats();
        const data = res.data || res;
        expect(data[0]).toMatchObject({ value: 'workshop', label: 'Workshop' });
    });
});

describe('getProgramMetaTags', () => {
    it('returns program tags with id and name', async () => {
        const res = await getProgramMetaTags();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0]).toMatchObject({ id: 1, name: 'STEM' });
        expect(data[1]).toMatchObject({ id: 2, name: 'Arts' });
    });

    it('throws ApiError on server failure', async () => {
        server.use(http.get(`${BASE}/api/v1/listings/programs/metadata/tags/`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 })));
        await expect(getProgramMetaTags()).rejects.toBeInstanceOf(ApiError);
    });
});

// ─── Program listings ─────────────────────────────────────────────────────────

describe('getProgramListings', () => {
    it('returns array of program listings', async () => {
        const res = await getProgramListings();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].listing_type).toBe('program');
    });

    it('appends status query param', async () => {
        let capturedUrl = '';
        server.use(http.get(`${BASE}/api/v1/partner/listings/programs/`, ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json({ success: true, data: [] });
        }));
        await getProgramListings('archived');
        expect(capturedUrl).toContain('status=archived');
    });
});

describe('getProgramListingDetail', () => {
    it('returns full program draft data', async () => {
        const res = await getProgramListingDetail(PROGRAM_DRAFT_ID);
        const data = res.data || res;
        expect(data.id).toBe(PROGRAM_DRAFT_ID);
        expect(data.listing_type).toBe('program');
        expect(data.delivery_mode).toBe('offline');
    });

    it('throws ApiError with NOT_FOUND on missing id', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/programs/bad-id/`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Program not found' } }, { status: 404 })));
        const err = await getProgramListingDetail('bad-id').catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

describe('createProgramDraft', () => {
    it('requires title and creates draft', async () => {
        const res = await createProgramDraft({ title: 'STEM Bootcamp' });
        const data = res.data || res;
        expect(data.id).toBe(PROGRAM_DRAFT_ID);
        expect(data.status).toBe('draft');
    });

    it('sends all optional fields in payload', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockProgramDraft }, { status: 201 });
        }));
        await createProgramDraft({ title: 'Art Camp', short_description: 'Short desc', description: 'Full desc' });
        expect(captured.title).toBe('Art Camp');
        expect(captured.short_description).toBe('Short desc');
        expect(captured.description).toBe('Full desc');
    });

    it('throws ApiError with INVALID_PARTNER_STATE on 403', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/`, () =>
            HttpResponse.json({ error: { code: 'INVALID_PARTNER_STATE', message: 'Partner not active' } }, { status: 403 })));
        const err = await createProgramDraft({ title: 'Test' }).catch(e => e);
        expect(err.code).toBe('INVALID_PARTNER_STATE');
    });
});

describe('updateProgramListing', () => {
    it('sends patch payload and returns updated listing', async () => {
        let captured: any = null;
        server.use(http.patch(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { ...mockProgramDraft, title: 'Updated' } });
        }));
        await updateProgramListing(PROGRAM_DRAFT_ID, {
            title: 'Updated',
            min_age: 6,
            max_age: 12,
            tag_ids: [1],
        });
        expect(captured.title).toBe('Updated');
        expect(captured.min_age).toBe(6);
        expect(captured.tag_ids).toEqual([1]);
    });

    it('throws ApiError with LISTING_LOCKED on 400', async () => {
        server.use(http.patch(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/`, () =>
            HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Not editable' } }, { status: 400 })));
        const err = await updateProgramListing(PROGRAM_DRAFT_ID, { title: 'x' }).catch(e => e);
        expect(err.code).toBe('LISTING_LOCKED');
    });
});

describe('deleteProgramListing', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteProgramListing(PROGRAM_DRAFT_ID);
        expect(res).toEqual({});
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/programs/bad-id/`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 })));
        const err = await deleteProgramListing('bad-id').catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

describe('submitProgramListing', () => {
    it('returns program with status pending', async () => {
        const res = await submitProgramListing(PROGRAM_DRAFT_ID);
        expect((res.data || res).status).toBe('pending');
    });

    it('throws ApiError with INCOMPLETE_PROGRAM on missing fields', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/submit/`, () =>
            HttpResponse.json({ error: { code: 'INCOMPLETE_PROGRAM', message: 'Missing cover image' } }, { status: 400 })));
        const err = await submitProgramListing(PROGRAM_DRAFT_ID).catch(e => e);
        expect(err.code).toBe('INCOMPLETE_PROGRAM');
    });
});

describe('archiveProgramListing', () => {
    it('returns program with status archived', async () => {
        const res = await archiveProgramListing(PROGRAM_DRAFT_ID);
        expect((res.data || res).status).toBe('archived');
    });

    it('throws ApiError on 400 if not archivable', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/archive/`, () =>
            HttpResponse.json({ error: { code: 'INVALID_STATUS_TRANSITION', message: 'Cannot archive draft' } }, { status: 400 })));
        const err = await archiveProgramListing(PROGRAM_DRAFT_ID).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('INVALID_STATUS_TRANSITION');
    });
});

describe('unarchiveProgramListing', () => {
    it('returns program restored to draft', async () => {
        const res = await unarchiveProgramListing(PROGRAM_DRAFT_ID);
        expect((res.data || res).status).toBe('draft');
    });

    it('throws ApiError on 400 if not unarchivable', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/unarchive/`, () =>
            HttpResponse.json({ error: { code: 'INVALID_STATUS_TRANSITION', message: 'Not archived' } }, { status: 400 })));
        const err = await unarchiveProgramListing(PROGRAM_DRAFT_ID).catch(e => e);
        expect(err.code).toBe('INVALID_STATUS_TRANSITION');
    });
});

// ─── Program batches ──────────────────────────────────────────────────────────

describe('getProgramBatches', () => {
    it('returns array of program batches', async () => {
        const res = await getProgramBatches(PROGRAM_DRAFT_ID);
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].name).toBe('Cohort 1');
        expect(data[0].days_of_week).toContain('tuesday');
    });
});

describe('createProgramBatch', () => {
    it('sends batch payload and returns created batch', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/batches/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockProgramBatches[0] }, { status: 201 });
        }));
        await createProgramBatch(PROGRAM_DRAFT_ID, {
            name: 'Cohort 2',
            start_date: '2026-10-01',
            end_date: '2026-12-01',
            fee: '2500',
            total_seats: 20,
            days_of_week: ['monday', 'wednesday', 'friday'],
        });
        expect(captured.name).toBe('Cohort 2');
        expect(captured.days_of_week).toHaveLength(3);
    });
});

describe('updateProgramBatch', () => {
    it('sends updated batch data', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/batches/:batchId`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockProgramBatches[0] });
        }));
        await updateProgramBatch(PROGRAM_DRAFT_ID, 1, { fee: '3000', total_seats: 25 });
        expect(captured.fee).toBe('3000');
        expect(captured.total_seats).toBe(25);
    });
});

describe('deleteProgramBatch', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteProgramBatch(PROGRAM_DRAFT_ID, 1);
        expect(res).toEqual({});
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/batches/:batchId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Batch not found' } }, { status: 404 })));
        const err = await deleteProgramBatch(PROGRAM_DRAFT_ID, 999).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ─── Program enquiries ────────────────────────────────────────────────────────

describe('getProgramEnquiries', () => {
    it('returns array of program enquiries', async () => {
        const res = await getProgramEnquiries(PROGRAM_DRAFT_ID);
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].program_title).toBe('STEM Bootcamp');
    });
});

describe('updateProgramEnquiry', () => {
    it('sends status and partner_note update', async () => {
        let captured: any = null;
        server.use(http.patch(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/enquiries/:enquiryId`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { ...mockProgramEnquiry, status: 'contacted', partner_note: 'Called on Monday' } });
        }));
        const res = await updateProgramEnquiry(PROGRAM_DRAFT_ID, 1, { status: 'contacted', partner_note: 'Called on Monday' });
        expect(captured.status).toBe('contacted');
        expect(captured.partner_note).toBe('Called on Monday');
        expect((res.data || res).status).toBe('contacted');
    });

    it('throws ApiError on 404 for unknown enquiry', async () => {
        server.use(http.patch(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/enquiries/:enquiryId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Enquiry not found' } }, { status: 404 })));
        const err = await updateProgramEnquiry(PROGRAM_DRAFT_ID, 999, { status: 'contacted' }).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ─── Program FAQs ─────────────────────────────────────────────────────────────

describe('getProgramFaqs', () => {
    it('returns ordered FAQ list', async () => {
        const res = await getProgramFaqs(PROGRAM_DRAFT_ID);
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(2);
        expect(data[0].question).toBe('What is the age group?');
        expect(data[0].sort_order).toBe(1);
    });
});

describe('createProgramFaq', () => {
    it('sends FAQ payload and returns created FAQ', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/faqs/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockProgramFaqs[0] }, { status: 201 });
        }));
        await createProgramFaq(PROGRAM_DRAFT_ID, { question: 'New Q?', answer: 'New A', sort_order: 3 });
        expect(captured.question).toBe('New Q?');
        expect(captured.answer).toBe('New A');
        expect(captured.sort_order).toBe(3);
    });
});

describe('updateProgramFaq', () => {
    it('sends updated FAQ data', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/faqs/:faqId`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockProgramFaqs[0] });
        }));
        await updateProgramFaq(PROGRAM_DRAFT_ID, 1, { question: 'Updated Q?', answer: 'Updated A' });
        expect(captured.question).toBe('Updated Q?');
    });
});

describe('deleteProgramFaq', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteProgramFaq(PROGRAM_DRAFT_ID, 1);
        expect(res).toEqual({});
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/faqs/:faqId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'FAQ not found' } }, { status: 404 })));
        const err = await deleteProgramFaq(PROGRAM_DRAFT_ID, 999).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ─── Program media ────────────────────────────────────────────────────────────

describe('uploadProgramMedia', () => {
    it('uploads cover with correct form fields', async () => {
        let capturedType = '';
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/media/`, async ({ request }) => {
            const form = await request.formData();
            capturedType = form.get('media_type') as string;
            return HttpResponse.json({ success: true, data: { id: 20, media_type: 'cover', file_url: 'https://example.com/prog-cover.jpg', created_at: '' } }, { status: 201 });
        }));
        const res = await uploadProgramMedia(PROGRAM_DRAFT_ID, makeFile(), 'cover');
        expect(capturedType).toBe('cover');
        expect((res.data || res).media_type).toBe('cover');
    });

    it('throws ApiError with COVER_ALREADY_EXISTS', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'COVER_ALREADY_EXISTS', message: 'Delete existing cover first' } }, { status: 400 })));
        const err = await uploadProgramMedia(PROGRAM_DRAFT_ID, makeFile(), 'cover').catch(e => e);
        expect(err.code).toBe('COVER_ALREADY_EXISTS');
    });
});

describe('deleteProgramMedia', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteProgramMedia(PROGRAM_DRAFT_ID, 20);
        expect(res).toEqual({});
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/media/:mediaId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Media not found' } }, { status: 404 })));
        const err = await deleteProgramMedia(PROGRAM_DRAFT_ID, 999).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VENUES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Venue draft ID helpers', () => {
    beforeEach(() => sessionStorage.clear());

    it('returns null when nothing stored', () => {
        expect(getCurrentVenueDraftId()).toBeNull();
    });

    it('sets and retrieves a draft id', () => {
        setCurrentVenueDraftId('ven-xyz');
        expect(getCurrentVenueDraftId()).toBe('ven-xyz');
    });

    it('clears the draft id', () => {
        setCurrentVenueDraftId('ven-xyz');
        clearCurrentVenueDraftId();
        expect(getCurrentVenueDraftId()).toBeNull();
    });

    it('is isolated from class and program draft keys', () => {
        setCurrentVenueDraftId('ven-1');
        expect(getCurrentClassDraftId()).toBeNull();
        expect(getCurrentProgramDraftId()).toBeNull();
    });
});

// ─── Venue metadata ───────────────────────────────────────────────────────────

describe('getVenueMetaCategories', () => {
    it('returns venue categories', async () => {
        const res = await getVenueMetaCategories();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
    });

    it('throws ApiError on server failure', async () => {
        server.use(http.get(`${BASE}/api/v1/listings/venues/metadata/categories/`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 })));
        await expect(getVenueMetaCategories()).rejects.toBeInstanceOf(ApiError);
    });
});

describe('getVenueMetaDiscoveryEnums', () => {
    it('returns discovery enum object', async () => {
        const res = await getVenueMetaDiscoveryEnums();
        const data = res.data || res;
        expect(typeof data).toBe('object');
    });
});

describe('getVenueMetaOccasions', () => {
    it('returns occasions array', async () => {
        const res = await getVenueMetaOccasions();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
    });
});

// ─── Venue listings ───────────────────────────────────────────────────────────

describe('getVenueListings', () => {
    it('returns array of venue listings', async () => {
        const res = await getVenueListings();
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
    });

    it('appends status query param', async () => {
        let capturedUrl = '';
        server.use(http.get(`${BASE}/api/v1/partner/listings/venues/`, ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json({ success: true, data: [] });
        }));
        await getVenueListings('published');
        expect(capturedUrl).toContain('status=published');
    });
});

describe('getVenueListingDetail', () => {
    it('returns full venue draft', async () => {
        const res = await getVenueListingDetail(VENUE_DRAFT_ID);
        const data = res.data || res;
        expect(data.id).toBe(VENUE_DRAFT_ID);
        expect(data.listing_type).toBe('venue');
        expect(data.location_type).toBe('indoor');
    });
});

describe('createVenueDraft', () => {
    it('creates venue draft and returns id', async () => {
        const res = await createVenueDraft({ title: 'My Venue' });
        const data = res.data || res;
        expect(data.id).toBe(VENUE_DRAFT_ID);
        expect(data.status).toBe('draft');
    });

    it('sends payload in request body', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/venues/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockVenueDraft }, { status: 201 });
        }));
        await createVenueDraft({ title: 'Garden Hall', description: 'Outdoor space' });
        expect(captured.title).toBe('Garden Hall');
        expect(captured.description).toBe('Outdoor space');
    });
});

describe('updateVenueListing', () => {
    it('sends patch payload and returns updated listing', async () => {
        let captured: any = null;
        server.use(http.patch(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { ...mockVenueDraft, title: 'Updated Venue' } });
        }));
        await updateVenueListing(VENUE_DRAFT_ID, {
            title: 'Updated Venue',
            location_type: 'outdoor',
            city: 'Delhi',
            min_capacity: 20,
            max_capacity: 200,
        });
        expect(captured.title).toBe('Updated Venue');
        expect(captured.location_type).toBe('outdoor');
        expect(captured.min_capacity).toBe(20);
    });

    it('throws ApiError with LISTING_LOCKED on 400', async () => {
        server.use(http.patch(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/`, () =>
            HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Not editable' } }, { status: 400 })));
        const err = await updateVenueListing(VENUE_DRAFT_ID, { title: 'x' }).catch(e => e);
        expect(err.code).toBe('LISTING_LOCKED');
    });
});

describe('deleteVenueListing', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteVenueListing(VENUE_DRAFT_ID);
        expect(res).toEqual({});
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/venues/bad-id/`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 })));
        const err = await deleteVenueListing('bad-id').catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

describe('submitVenueListing', () => {
    it('returns venue with status pending', async () => {
        const res = await submitVenueListing(VENUE_DRAFT_ID);
        expect((res.data || res).status).toBe('pending');
    });

    it('throws ApiError with INCOMPLETE_VENUE on missing fields', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/submit/`, () =>
            HttpResponse.json({ error: { code: 'INCOMPLETE_VENUE', message: 'Missing cover image' } }, { status: 400 })));
        const err = await submitVenueListing(VENUE_DRAFT_ID).catch(e => e);
        expect(err.code).toBe('INCOMPLETE_VENUE');
    });
});

// ─── Venue media ──────────────────────────────────────────────────────────────

describe('getVenueListingMedia', () => {
    it('returns media array', async () => {
        const res = await getVenueListingMedia(VENUE_DRAFT_ID);
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
    });
});

describe('uploadVenueListingMedia', () => {
    it('uploads cover with correct form fields', async () => {
        let capturedType = '';
        server.use(http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/media/`, async ({ request }) => {
            const form = await request.formData();
            capturedType = form.get('media_type') as string;
            return HttpResponse.json({ success: true, data: { id: 30, media_type: 'cover', file_url: 'https://example.com/venue-cover.jpg', created_at: '' } }, { status: 201 });
        }));
        const res = await uploadVenueListingMedia(VENUE_DRAFT_ID, makeFile(), 'cover');
        expect(capturedType).toBe('cover');
        expect((res.data || res).media_type).toBe('cover');
    });

    it('throws ApiError with COVER_ALREADY_EXISTS', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'COVER_ALREADY_EXISTS', message: 'Delete existing cover first' } }, { status: 400 })));
        const err = await uploadVenueListingMedia(VENUE_DRAFT_ID, makeFile(), 'cover').catch(e => e);
        expect(err.code).toBe('COVER_ALREADY_EXISTS');
    });

    it('throws ApiError with GALLERY_LIMIT_EXCEEDED for gallery', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'GALLERY_LIMIT_EXCEEDED', message: 'Max 10 gallery images' } }, { status: 400 })));
        const err = await uploadVenueListingMedia(VENUE_DRAFT_ID, makeFile(), 'gallery').catch(e => e);
        expect(err.code).toBe('GALLERY_LIMIT_EXCEEDED');
    });
});

describe('deleteVenueListingMedia', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteVenueListingMedia(VENUE_DRAFT_ID, 30);
        expect(res).toEqual({});
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/media/:mediaId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Media not found' } }, { status: 404 })));
        const err = await deleteVenueListingMedia(VENUE_DRAFT_ID, 999).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ─── Venue packages ───────────────────────────────────────────────────────────

describe('getVenuePackages', () => {
    it('returns array of packages', async () => {
        const res = await getVenuePackages(VENUE_DRAFT_ID);
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].name).toBe('Basic Package');
        expect(data[0].duration_minutes).toBe(240);
    });
});

describe('createVenuePackage', () => {
    it('sends package payload and returns created package', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/packages/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockVenuePackages[0] }, { status: 201 });
        }));
        await createVenuePackage(VENUE_DRAFT_ID, {
            name: 'Premium Package',
            price: 10000,
            description: 'Full day access',
            duration_minutes: 480,
            max_guests: 100,
        });
        expect(captured.name).toBe('Premium Package');
        expect(captured.duration_minutes).toBe(480);
        expect(captured.max_guests).toBe(100);
    });

    it('throws ApiError with VALIDATION_ERROR on invalid data', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/packages/`, () =>
            HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'duration_minutes must be positive' } }, { status: 400 })));
        const err = await createVenuePackage(VENUE_DRAFT_ID, { name: 'Bad', price: 0, duration_minutes: -1, max_guests: 10 }).catch(e => e);
        expect(err.code).toBe('VALIDATION_ERROR');
    });
});

describe('updateVenuePackage', () => {
    it('sends updated package data', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/packages/:pkgId`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockVenuePackages[0] });
        }));
        await updateVenuePackage(VENUE_DRAFT_ID, 1, { price: 6000, max_guests: 75 });
        expect(captured.price).toBe(6000);
        expect(captured.max_guests).toBe(75);
    });
});

describe('deleteVenuePackage', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteVenuePackage(VENUE_DRAFT_ID, 1);
        expect(res).toEqual({});
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/packages/:pkgId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Package not found' } }, { status: 404 })));
        const err = await deleteVenuePackage(VENUE_DRAFT_ID, 999).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ─── Venue availability ───────────────────────────────────────────────────────

describe('getVenueAvailability', () => {
    it('returns array of availability slots', async () => {
        const res = await getVenueAvailability(VENUE_DRAFT_ID);
        const data = res.data || res;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].date).toBe('2026-07-15');
        expect(data[0].start_time).toBe('09:00:00');
    });
});

describe('createVenueAvailabilitySlot', () => {
    it('sends slot payload and returns created slot', async () => {
        let captured: any = null;
        server.use(http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/availability/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockVenueSlots[0] }, { status: 201 });
        }));
        await createVenueAvailabilitySlot(VENUE_DRAFT_ID, {
            date: '2026-08-01',
            start_time: '10:00:00',
            end_time: '14:00:00',
            note: 'Afternoon slot',
        });
        expect(captured.date).toBe('2026-08-01');
        expect(captured.note).toBe('Afternoon slot');
    });

    it('throws ApiError with VALIDATION_ERROR when end_time before start_time', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/availability/`, () =>
            HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'end_time must be after start_time' } }, { status: 400 })));
        const err = await createVenueAvailabilitySlot(VENUE_DRAFT_ID, { date: '2026-08-01', start_time: '14:00:00', end_time: '10:00:00' }).catch(e => e);
        expect(err.code).toBe('VALIDATION_ERROR');
    });
});

describe('updateVenueAvailabilitySlot', () => {
    it('sends updated slot data', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/availability/:slotId`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: mockVenueSlots[0] });
        }));
        await updateVenueAvailabilitySlot(VENUE_DRAFT_ID, 1, { date: '2026-07-20', start_time: '11:00:00', end_time: '15:00:00' });
        expect(captured.date).toBe('2026-07-20');
        expect(captured.start_time).toBe('11:00:00');
    });
});

describe('deleteVenueAvailabilitySlot', () => {
    it('returns empty object on 204', async () => {
        const res = await deleteVenueAvailabilitySlot(VENUE_DRAFT_ID, 1);
        expect(res).toEqual({});
    });

    it('throws ApiError on 404', async () => {
        server.use(http.delete(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/availability/:slotId`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Slot not found' } }, { status: 404 })));
        const err = await deleteVenueAvailabilitySlot(VENUE_DRAFT_ID, 999).catch(e => e);
        expect(err.code).toBe('NOT_FOUND');
    });
});

// ─── Venue attendee fields ────────────────────────────────────────────────────

describe('getVenueAttendeeFields', () => {
    it('returns current attendee fields', async () => {
        const res = await getVenueAttendeeFields(VENUE_DRAFT_ID);
        const data = res.data || res;
        expect(data.fields).toContain('child_name');
        expect(data.fields).toContain('contact_number');
    });
});

describe('updateVenueAttendeeFields', () => {
    it('sends fields array and returns updated fields', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/attendee-fields/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { fields: ['child_name', 'contact_number', 'email'] } });
        }));
        const res = await updateVenueAttendeeFields(VENUE_DRAFT_ID, ['child_name', 'contact_number', 'email']);
        expect(captured.fields).toEqual(['child_name', 'contact_number', 'email']);
        expect((res.data || res).fields).toHaveLength(3);
    });

    it('accepts empty fields array', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/attendee-fields/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { fields: [] } });
        }));
        await updateVenueAttendeeFields(VENUE_DRAFT_ID, []);
        expect(captured.fields).toEqual([]);
    });
});

// ─── Venue discovery ──────────────────────────────────────────────────────────

describe('getVenueDiscovery', () => {
    it('returns discovery metadata with all three type arrays', async () => {
        const res = await getVenueDiscovery(VENUE_DRAFT_ID);
        const data = res.data || res;
        expect(data).toHaveProperty('outing_types');
        expect(data).toHaveProperty('activity_types');
        expect(data).toHaveProperty('format_types');
    });
});

describe('updateVenueDiscovery', () => {
    it('sends all three discovery arrays', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/discovery/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: { outing_types: ['outdoor'], activity_types: ['sports'], format_types: ['group'] } });
        }));
        const res = await updateVenueDiscovery(VENUE_DRAFT_ID, {
            outing_types: ['outdoor'],
            activity_types: ['sports'],
            format_types: ['group'],
        });
        expect(captured.outing_types).toEqual(['outdoor']);
        expect(captured.activity_types).toEqual(['sports']);
        expect((res.data || res).format_types).toEqual(['group']);
    });

    it('accepts partial update with only some arrays', async () => {
        let captured: any = null;
        server.use(http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/discovery/`, async ({ request }) => {
            captured = await request.json();
            return HttpResponse.json({ success: true, data: {} });
        }));
        await updateVenueDiscovery(VENUE_DRAFT_ID, { outing_types: ['indoor'] });
        expect(captured.outing_types).toEqual(['indoor']);
        expect(captured.activity_types).toBeUndefined();
    });

    it('throws ApiError on server failure', async () => {
        server.use(http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/discovery/`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 })));
        await expect(updateVenueDiscovery(VENUE_DRAFT_ID, {})).rejects.toBeInstanceOf(ApiError);
    });
});
