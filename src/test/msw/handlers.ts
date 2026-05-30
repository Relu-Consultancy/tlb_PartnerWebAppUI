import { http, HttpResponse } from 'msw';

const BASE = 'https://tlb-api.reluconsultancy.in';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

export const DRAFT_ID = 'draft-uuid-1234';
export const CLASS_DRAFT_ID = 'class-draft-uuid-1234';
export const PROGRAM_DRAFT_ID = 'program-draft-uuid-1234';
export const VENUE_DRAFT_ID = 'venue-draft-uuid-1234';

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

// ─── Class fixtures ───────────────────────────────────────────────────────────

export const mockClassBatches = [
    {
        id: 1,
        name: 'Batch A',
        start_date: '2026-07-01',
        end_date: '2026-08-01',
        start_time: '10:00:00',
        end_time: '11:00:00',
        fee: '500.00',
        total_seats: 20,
        days_of_week: ['monday', 'wednesday'],
        is_active: true,
    },
];

export const mockClassEnquiry = {
    id: 'enq-001',
    class_title: 'Dance Workshop',
    parent_name: 'Priya Sharma',
    child_name: 'Aryan Sharma',
    contact_number: '9876543210',
    email: 'priya@example.com',
    status: 'new',
    is_locked: true,
    created_at: '2026-05-10T09:00:00Z',
};

export const mockClassDraft = {
    id: CLASS_DRAFT_ID,
    listing_type: 'class',
    title: 'Test Class',
    description: 'A test class description',
    status: 'draft',
    category: { id: 1, name: 'Dance' },
    subcategory: { id: 2, name: 'Classical' },
    format: 'workshop',
    booking_type: 'enquiry',
    is_live: false,
    created_at: '2026-05-07T12:00:00Z',
};

export const mockClassListing = {
    id: CLASS_DRAFT_ID,
    title: 'Test Class',
    status: 'draft',
    listing_type: 'class',
    is_live: false,
    created_at: '2026-05-07T12:00:00Z',
};

// ─── Program fixtures ─────────────────────────────────────────────────────────

export const mockProgramBatches = [
    {
        id: 1,
        name: 'Cohort 1',
        start_date: '2026-08-01',
        end_date: '2026-10-01',
        start_time: '09:00:00',
        end_time: '11:00:00',
        fee: '2000.00',
        total_seats: 15,
        days_of_week: ['tuesday', 'thursday'],
        is_active: true,
    },
];

export const mockProgramEnquiry = {
    id: 1,
    program_title: 'STEM Bootcamp',
    parent_name: 'Ramesh Gupta',
    contact_number: '9123456780',
    email: 'ramesh@example.com',
    status: 'new',
    partner_note: '',
    created_at: '2026-05-12T10:00:00Z',
};

export const mockProgramFaqs = [
    { id: 1, question: 'What is the age group?', answer: 'Ages 8–14', sort_order: 1 },
    { id: 2, question: 'Is equipment provided?', answer: 'Yes', sort_order: 2 },
];

export const mockProgramDraft = {
    id: PROGRAM_DRAFT_ID,
    listing_type: 'program',
    title: 'STEM Bootcamp',
    short_description: 'A fun STEM program',
    description: 'Detailed program description',
    status: 'draft',
    delivery_mode: 'offline',
    booking_type: 'enquiry',
    min_age: 8,
    max_age: 14,
    max_capacity: 30,
    category: { id: 1, name: 'Dance' },
    created_at: '2026-05-07T12:00:00Z',
};

export const mockProgramListing = {
    id: PROGRAM_DRAFT_ID,
    title: 'STEM Bootcamp',
    status: 'draft',
    listing_type: 'program',
    created_at: '2026-05-07T12:00:00Z',
};

// ─── Venue fixtures ───────────────────────────────────────────────────────────

export const mockVenuePackages = [
    {
        id: 1,
        name: 'Basic Package',
        price: '5000.00',
        description: 'Up to 4 hours',
        duration_minutes: 240,
        max_guests: 50,
    },
];

export const mockVenueSlots = [
    {
        id: 1,
        date: '2026-07-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        note: 'Morning slot',
    },
];

export const mockVenueDraft = {
    id: VENUE_DRAFT_ID,
    listing_type: 'venue',
    title: 'Test Venue',
    description: 'A test venue',
    status: 'draft',
    location_type: 'indoor',
    city: 'Mumbai',
    area: 'Andheri',
    address: '456 Venue St',
    min_capacity: 10,
    max_capacity: 100,
    created_at: '2026-05-07T12:00:00Z',
};

// ─── Statistics fixtures ──────────────────────────────────────────────────────

export const mockStatsOverview = {
    profile_views: 1240,
    followers: 87,
    new_enquiries: 12,
    active_batches: 6,
};

export const mockStatsEvents = {
    upcoming: 3,
    tickets_sold: 152,
    registrations: 168,
    event_reach: 4200,
    engagement_rate: null,
    booking_conv_rate: 42.5,
    this_month_tickets: 60,
    prev_month_tickets: 45,
    ticket_growth_pct: 33.3,
    weekly_ticket_sales: [
        { day: 'Mon', date: '2026-05-25', count: 5 },
        { day: 'Tue', date: '2026-05-26', count: 8 },
        { day: 'Wed', date: '2026-05-27', count: 3 },
        { day: 'Thu', date: '2026-05-28', count: 12 },
        { day: 'Fri', date: '2026-05-29', count: 7 },
        { day: 'Sat', date: '2026-05-30', count: 15 },
        { day: 'Sun', date: '2026-05-31', count: 10 },
    ],
    ticket_sales_trend: [
        { month: 'Dec 2025', year: 2025, count: 30, earnings: '30000.00' },
        { month: 'Jan 2026', year: 2026, count: 45, earnings: '45000.00' },
        { month: 'Feb 2026', year: 2026, count: 60, earnings: '60000.00' },
    ],
    by_category: [
        { category: 'Music', count: 80, amount: '120000.00' },
        { category: 'Dance', count: 72, amount: '95000.00' },
    ],
};

export const mockStatsVenues = {
    total_bookings: 48,
    upcoming: 5,
    monthly_earnings: '200000.00',
    occupancy_rate: 67,
    avg_duration_minutes: 90,
    repeat_clients: 14,
    revenue_trend: [
        { month: 'Dec 2025', year: 2025, count: 10, earnings: '100000.00' },
        { month: 'Jan 2026', year: 2026, count: 15, earnings: '150000.00' },
        { month: 'Feb 2026', year: 2026, count: 20, earnings: '200000.00' },
    ],
};

export const mockStatsEnquiries = {
    conversion_funnel: { new_leads: 100, contacted: 60, converted: 25, conversion_rate: 25 },
    trial_requests: 18,
    avg_response_hours: 4.5,
    student_retention_pct: 78,
    monthly_enrolments: 9,
    monthly_trend: [
        { month: 'Dec 2025', year: 2025, count: 20, earnings: '0' },
        { month: 'Jan 2026', year: 2026, count: 28, earnings: '0' },
        { month: 'Feb 2026', year: 2026, count: 35, earnings: '0' },
    ],
};

// ─── Default handlers ─────────────────────────────────────────────────────────

export const handlers = [
    // Auth endpoints
    http.post(`${BASE}/api/v1/auth/request-otp/`, () =>
        HttpResponse.json({ success: true, message: 'OTP sent' })),

    http.post(`${BASE}/api/v1/auth/verify-otp/`, () =>
        HttpResponse.json({ success: true, data: { access_token: 'test-access-token', refresh_token: 'test-refresh-token' } })),

    http.get(`${BASE}/api/v1/auth/me/`, () =>
        HttpResponse.json({ success: true, data: { id: 1, email: 'test@example.com' } })),

    http.post(`${BASE}/api/v1/auth/logout/`, () =>
        HttpResponse.json({ success: true })),

    // Partner endpoints
    http.get(`${BASE}/api/v1/partners/me/`, () =>
        HttpResponse.json({ success: true, data: { id: 1, status: 'activated_limited', is_active: true, is_verified: false, business_name: 'Test Studio', bank_account: null } })),

    // The api client actually hits the singular form (/partner/me/) — keep both so tests
    // that exercise getCurrentPartner via either codepath stay green.
    http.get(`${BASE}/api/v1/partner/me/`, () =>
        HttpResponse.json({ success: true, data: { id: 1, status: 'activated_limited', is_active: true, is_verified: false, business_name: 'Test Studio', bank_account: null } })),

    http.post(`${BASE}/api/v1/partner/verification/`, () =>
        HttpResponse.json({ success: true, data: { status: 'under_review' } })),

    // Event metadata
    http.get(`${BASE}/api/v1/listings/events/metadata/categories/`, () =>
        HttpResponse.json({ success: true, data: mockCategories })),

    http.get(`${BASE}/api/v1/listings/events/metadata/formats/`, () =>
        HttpResponse.json({ success: true, data: mockFormats })),

    http.get(`${BASE}/api/v1/listings/events/metadata/age-groups/`, () =>
        HttpResponse.json({ success: true, data: mockAgeGroups })),

    // Venue metadata
    http.get(`${BASE}/api/v1/listings/venues/metadata/categories/`, () =>
        HttpResponse.json({ success: true, data: [] })),

    http.get(`${BASE}/api/v1/listings/venues/metadata/discovery-enums/`, () =>
        HttpResponse.json({ success: true, data: {} })),

    http.get(`${BASE}/api/v1/listings/venues/metadata/occasions/`, () =>
        HttpResponse.json({ success: true, data: [] })),

    // Event listings
    http.get(`${BASE}/api/v1/partner/listings/events/`, () =>
        HttpResponse.json({ success: true, data: [mockListing] })),

    http.get(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: mockDraft })),

    http.post(`${BASE}/api/v1/partner/listings/events/`, () =>
        HttpResponse.json({ success: true, data: mockDraft }, { status: 201 })),

    http.patch(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: mockDraft })),

    http.post(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/submit/`, () =>
        HttpResponse.json({ success: true, data: { ...mockDraft, status: 'pending' } })),

    // Event media
    http.get(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: mockDraft.media })),

    http.post(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: { id: 99, media_type: 'cover', file_url: 'https://example.com/new.jpg', created_at: '2026-05-07T12:00:00Z' } }, { status: 201 })),

    http.delete(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/media/:mediaId`, () =>
        new HttpResponse(null, { status: 204 })),

    // Event tickets
    http.get(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/tickets/`, () =>
        HttpResponse.json({ success: true, data: mockDraft.tickets })),

    http.post(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/tickets/`, () =>
        HttpResponse.json({ success: true, data: { id: 10, name: 'General', price: 499, total_quantity: 50, available_quantity: 50, description: '', is_default: false, created_at: '2026-05-07T12:00:00Z' } }, { status: 201 })),

    http.put(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/tickets/:ticketId`, () =>
        HttpResponse.json({ success: true, data: {} })),

    http.delete(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/tickets/:ticketId`, () =>
        new HttpResponse(null, { status: 204 })),

    // Venue listings
    http.get(`${BASE}/api/v1/partner/listings/venues/`, () =>
        HttpResponse.json({ success: true, data: [] })),

    // ─── Class metadata ───────────────────────────────────────────────────────

    http.get(`${BASE}/api/v1/listings/classes/metadata/categories/`, () =>
        HttpResponse.json({ success: true, data: mockCategories })),

    http.get(`${BASE}/api/v1/listings/classes/metadata/formats/`, () =>
        HttpResponse.json({ success: true, data: { modes: [
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'Offline' },
            { value: 'hybrid', label: 'Hybrid' },
        ]}})),

    // ─── Class fixtures ───────────────────────────────────────────────────────

    http.get(`${BASE}/api/v1/partner/listings/classes/`, () =>
        HttpResponse.json({ success: true, data: [mockClassListing] })),

    http.get(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: mockClassDraft })),

    http.post(`${BASE}/api/v1/partner/listings/classes/`, () =>
        HttpResponse.json({ success: true, data: mockClassDraft }, { status: 201 })),

    http.patch(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: mockClassDraft })),

    http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/submit/`, () =>
        HttpResponse.json({ success: true, data: { ...mockClassDraft, status: 'pending' } })),

    http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/live/`, () =>
        HttpResponse.json({ success: true, data: { ...mockClassDraft, is_live: true } })),

    http.get(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/`, () =>
        HttpResponse.json({ success: true, data: mockClassBatches })),

    http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/`, () =>
        HttpResponse.json({ success: true, data: mockClassBatches[0] }, { status: 201 })),

    http.put(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/:batchId`, () =>
        HttpResponse.json({ success: true, data: mockClassBatches[0] })),

    http.delete(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/:batchId`, () =>
        new HttpResponse(null, { status: 204 })),

    http.get(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: [] })),

    http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: { id: 10, media_type: 'cover', file_url: 'https://example.com/class-cover.jpg', created_at: '' } }, { status: 201 })),

    http.delete(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/media/:mediaId`, () =>
        new HttpResponse(null, { status: 204 })),

    http.get(`${BASE}/api/v1/partner/listings/classes/enquiries/`, () =>
        HttpResponse.json({ success: true, data: [mockClassEnquiry] })),

    http.get(`${BASE}/api/v1/partner/listings/classes/enquiries/:enquiryId`, () =>
        HttpResponse.json({ success: true, data: mockClassEnquiry })),

    http.put(`${BASE}/api/v1/partner/listings/classes/enquiries/:enquiryId`, () =>
        HttpResponse.json({ success: true, data: { ...mockClassEnquiry, status: 'contacted' } })),

    http.post(`${BASE}/api/v1/partner/listings/classes/enquiries/:enquiryId/unlock/`, () =>
        HttpResponse.json({ success: true, data: { ...mockClassEnquiry, is_locked: false } })),

    // ─── Program metadata ─────────────────────────────────────────────────────

    http.get(`${BASE}/api/v1/listings/programs/metadata/categories/`, () =>
        HttpResponse.json({ success: true, data: mockCategories })),

    http.get(`${BASE}/api/v1/listings/programs/metadata/formats/`, () =>
        HttpResponse.json({ success: true, data: mockFormats })),

    http.get(`${BASE}/api/v1/listings/programs/metadata/tags/`, () =>
        HttpResponse.json({ success: true, data: [{ id: 1, name: 'STEM' }, { id: 2, name: 'Arts' }] })),

    // ─── Program fixtures ─────────────────────────────────────────────────────

    http.get(`${BASE}/api/v1/partner/listings/programs/`, () =>
        HttpResponse.json({ success: true, data: [mockProgramListing] })),

    http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: mockProgramDraft })),

    http.post(`${BASE}/api/v1/partner/listings/programs/`, () =>
        HttpResponse.json({ success: true, data: mockProgramDraft }, { status: 201 })),

    http.patch(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: mockProgramDraft })),

    http.delete(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/`, () =>
        new HttpResponse(null, { status: 204 })),

    http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/submit/`, () =>
        HttpResponse.json({ success: true, data: { ...mockProgramDraft, status: 'pending' } })),

    http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/archive/`, () =>
        HttpResponse.json({ success: true, data: { ...mockProgramDraft, status: 'archived' } })),

    http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/unarchive/`, () =>
        HttpResponse.json({ success: true, data: { ...mockProgramDraft, status: 'draft' } })),

    http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/batches/`, () =>
        HttpResponse.json({ success: true, data: mockProgramBatches })),

    http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/batches/`, () =>
        HttpResponse.json({ success: true, data: mockProgramBatches[0] }, { status: 201 })),

    http.put(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/batches/:batchId`, () =>
        HttpResponse.json({ success: true, data: mockProgramBatches[0] })),

    http.delete(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/batches/:batchId`, () =>
        new HttpResponse(null, { status: 204 })),

    http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/enquiries/`, () =>
        HttpResponse.json({ success: true, data: [mockProgramEnquiry] })),

    http.patch(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/enquiries/:enquiryId`, () =>
        HttpResponse.json({ success: true, data: { ...mockProgramEnquiry, status: 'contacted' } })),

    http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/faqs/`, () =>
        HttpResponse.json({ success: true, data: mockProgramFaqs })),

    http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/faqs/`, () =>
        HttpResponse.json({ success: true, data: mockProgramFaqs[0] }, { status: 201 })),

    http.put(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/faqs/:faqId`, () =>
        HttpResponse.json({ success: true, data: mockProgramFaqs[0] })),

    http.delete(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/faqs/:faqId`, () =>
        new HttpResponse(null, { status: 204 })),

    http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: [] })),

    http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: { id: 20, media_type: 'cover', file_url: 'https://example.com/program-cover.jpg', created_at: '' } }, { status: 201 })),

    http.delete(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/media/:mediaId`, () =>
        new HttpResponse(null, { status: 204 })),

    // ─── Venue fixtures ───────────────────────────────────────────────────────

    http.get(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: mockVenueDraft })),

    http.post(`${BASE}/api/v1/partner/listings/venues/`, () =>
        HttpResponse.json({ success: true, data: mockVenueDraft }, { status: 201 })),

    http.patch(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: mockVenueDraft })),

    http.delete(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/`, () =>
        new HttpResponse(null, { status: 204 })),

    http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/submit/`, () =>
        HttpResponse.json({ success: true, data: { ...mockVenueDraft, status: 'pending' } })),

    http.get(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: [] })),

    http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/media/`, () =>
        HttpResponse.json({ success: true, data: { id: 30, media_type: 'cover', file_url: 'https://example.com/venue-cover.jpg', created_at: '' } }, { status: 201 })),

    http.delete(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/media/:mediaId`, () =>
        new HttpResponse(null, { status: 204 })),

    http.get(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/packages/`, () =>
        HttpResponse.json({ success: true, data: mockVenuePackages })),

    http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/packages/`, () =>
        HttpResponse.json({ success: true, data: mockVenuePackages[0] }, { status: 201 })),

    http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/packages/:pkgId`, () =>
        HttpResponse.json({ success: true, data: mockVenuePackages[0] })),

    http.delete(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/packages/:pkgId`, () =>
        new HttpResponse(null, { status: 204 })),

    http.get(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/availability/`, () =>
        HttpResponse.json({ success: true, data: mockVenueSlots })),

    http.post(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/availability/`, () =>
        HttpResponse.json({ success: true, data: mockVenueSlots[0] }, { status: 201 })),

    http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/availability/:slotId`, () =>
        HttpResponse.json({ success: true, data: mockVenueSlots[0] })),

    http.delete(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/availability/:slotId`, () =>
        new HttpResponse(null, { status: 204 })),

    http.get(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/attendee-fields/`, () =>
        HttpResponse.json({ success: true, data: { fields: ['child_name', 'contact_number'] } })),

    http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/attendee-fields/`, () =>
        HttpResponse.json({ success: true, data: { fields: ['child_name', 'contact_number', 'email'] } })),

    http.get(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/discovery/`, () =>
        HttpResponse.json({ success: true, data: { outing_types: [], activity_types: [], format_types: [] } })),

    http.put(`${BASE}/api/v1/partner/listings/venues/${VENUE_DRAFT_ID}/discovery/`, () =>
        HttpResponse.json({ success: true, data: { outing_types: ['outdoor'], activity_types: ['sports'], format_types: ['group'] } })),

    // ─── Partner statistics ───
    http.get(`${BASE}/api/v1/partner/stats/overview/`, () =>
        HttpResponse.json({ success: true, data: mockStatsOverview })),
    http.get(`${BASE}/api/v1/partner/stats/events/`, () =>
        HttpResponse.json({ success: true, data: mockStatsEvents })),
    http.get(`${BASE}/api/v1/partner/stats/venues/`, () =>
        HttpResponse.json({ success: true, data: mockStatsVenues })),
    http.get(`${BASE}/api/v1/partner/stats/enquiries/`, () =>
        HttpResponse.json({ success: true, data: mockStatsEnquiries })),
    http.post(`${BASE}/api/v1/partner/:id/track-view/`, () =>
        HttpResponse.json({ success: true, data: { message: 'tracked' } })),
];
