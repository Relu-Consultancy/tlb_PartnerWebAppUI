import { http, HttpResponse } from 'msw';

const BASE = 'https://tlb-api.reluconsultancy.in';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

export const DRAFT_ID = 'draft-uuid-1234';

export const mockDraft = {
    id: DRAFT_ID,
    listing_type: 'event',
    title: 'Test Event',
    description: 'A test event description',
    status: 'draft',
    category: { id: 1, name: 'Dance' },
    subcategory: { id: 2, name: 'Classical' },
    format: 'workshop',
    age_group: { type: 'static', min_age: 6, max_age: 8 },
    start_datetime: '2026-07-01T10:00:00Z',
    end_datetime: '2026-07-01T14:00:00Z',
    registration_deadline: '2026-06-28T23:59:59Z',
    mode: 'offline',
    city: 'Mumbai',
    area: 'Bandra',
    address: '123 Test St',
    meeting_link: null,
    price_type: 'free',
    capacity: 50,
    available_seats: 50,
    tickets: [
        { id: 1, name: 'Free Entry', price: 0, total_quantity: 50, available_quantity: 50, description: '', is_default: true, created_at: '2026-05-07T10:00:00Z' },
    ],
    media: [
        { id: 55, media_type: 'cover', file_url: 'https://example.com/cover.jpg', created_at: '2026-05-07T10:00:00Z' },
    ],
};

export const mockCategories = [
    { id: 1, name: 'Dance', slug: 'dance', subcategories: [{ id: 2, name: 'Classical', slug: 'classical' }] },
    { id: 3, name: 'Sports', slug: 'sports', subcategories: [{ id: 4, name: 'Football', slug: 'football' }] },
];

export const mockFormats = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'camp', label: 'Camp' },
    { value: 'masterclass', label: 'Masterclass' },
];

export const mockAgeGroups = {
    static_ranges: [
        { min_age: 0, max_age: 3, label: '0–3 years' },
        { min_age: 3, max_age: 5, label: '3–5 years' },
        { min_age: 6, max_age: 8, label: '6–8 years' },
        { min_age: 9, max_age: 12, label: '9–12 years' },
        { min_age: 13, max_age: 16, label: '13–16 years' },
    ],
    custom_range: { enabled: true, min_allowed_age: 0, max_allowed_age: 18 },
};

export const mockListing = {
    id: DRAFT_ID,
    title: 'Test Event',
    status: 'draft',
    listing_type: 'event',
    category: { id: 1, name: 'Dance' },
    subcategory: { id: 2, name: 'Classical' },
    format: 'workshop',
    age_group: { type: 'static', min_age: 6, max_age: 8 },
    start_datetime: '2026-07-01T10:00:00Z',
    cover_url: 'https://example.com/cover.jpg',
    created_at: '2026-05-07T12:00:00Z',
};

// ─── Default handlers ─────────────────────────────────────────────────────────

export const handlers = [
    // Metadata
    http.get(`${BASE}/api/v1/listings/metadata/categories/`, () =>
        HttpResponse.json({ success: true, data: mockCategories })),

    http.get(`${BASE}/api/v1/listings/metadata/formats/`, () =>
        HttpResponse.json({ success: true, data: mockFormats })),

    http.get(`${BASE}/api/v1/listings/metadata/age-groups/`, () =>
        HttpResponse.json({ success: true, data: mockAgeGroups })),

    // Listings
    http.get(`${BASE}/api/v1/partners/listings/`, () =>
        HttpResponse.json({ success: true, data: [mockListing] })),

    http.get(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: mockDraft })),

    http.post(`${BASE}/api/v1/partners/listings/create/`, () =>
        HttpResponse.json({ success: true, data: mockDraft }, { status: 201 })),

    http.put(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/update/`, () =>
        HttpResponse.json({ success: true, data: mockDraft })),

    http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/submit/`, () =>
        HttpResponse.json({ success: true, data: { ...mockDraft, status: 'pending' } })),

    // Media
    http.get(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: mockDraft.media })),

    http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: { id: 99, media_type: 'cover', file_url: 'https://example.com/new.jpg', created_at: '2026-05-07T12:00:00Z' } }, { status: 201 })),

    http.delete(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/:mediaId`, () =>
        new HttpResponse(null, { status: 204 })),

    // Tickets
    http.get(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/`, () =>
        HttpResponse.json({ success: true, data: mockDraft.tickets })),

    http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/`, () =>
        HttpResponse.json({ success: true, data: { id: 10, name: 'General', price: 499, total_quantity: 50, available_quantity: 50, description: '', is_default: false, created_at: '2026-05-07T12:00:00Z' } }, { status: 201 })),

    http.put(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/:ticketId`, () =>
        HttpResponse.json({ success: true, data: {} })),

    http.delete(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/tickets/:ticketId`, () =>
        new HttpResponse(null, { status: 204 })),
];
