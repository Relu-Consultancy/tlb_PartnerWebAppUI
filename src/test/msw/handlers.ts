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

// ─── Partner verticals fixture (Services & categories self-service) ───────────

export const mockVerticals = [
    { id: 1, name: 'Events' },
    { id: 2, name: 'Classes' },
];

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

// ─── Reviews fixtures ─────────────────────────────────────────────────────────

export const mockReviewsList = [
    { id: 'rev-1', listing_id: 'l1', listing_title: 'Pottery Term — 6 weeks', listing_type: 'class', rating: 5, comment: 'Unhurried and warm.', reviewer_name: 'Meera K.', created_at: '2026-08-01T10:00:00Z' },
    { id: 'rev-2', listing_id: 'l2', listing_title: 'Daylight Studio — Photoshoot hire', listing_type: 'venue', rating: 3, comment: 'Studio was nice but ran late opening.', reviewer_name: 'Arun V.', created_at: '2026-08-10T10:00:00Z' },
];

// ─── Bank details fixture (Revenue & payouts screen) ───────────────────────────

export const mockBankDetails = {
    account_holder_name: 'Aviraj Studio',
    bank_name: 'HDFC Bank',
    branch_name: 'Indiranagar',
    account_number_masked: '••4412',
    ifsc_code: 'HDFC0000123',
    cancelled_cheque_url: '',
    consent_given: true,
    verification_status: 'verified',
    verification_note: '',
    updated_at: '2026-08-01T10:00:00Z',
};

// ─── Coupon fixtures ──────────────────────────────────────────────────────────

export const mockCoupon = {
    id: 'coupon-1',
    code: 'MONSOON20',
    discount_type: 'percent',
    discount_value: 20,
    is_active: true,
    usage_count: 28,
    usage_limit: 100,
    expires_at: '2099-08-31',
    description: 'Monsoon weekday push',
    max_discount: 400,
    min_order_value: null,
    per_user_limit: 1,
    starts_at: '2020-08-01',
    target_listings: [],
    target_listing_types: [],
    target_genders: [],
    target_min_age: null,
    target_max_age: null,
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

export const mockStatsRevenue = {
    period: '30d',
    gross_revenue: '124600.00',
    platform_fees: '18690.00',
    refunds: '2000.00',
    net_earnings: '105910.00',
    confirmed_bookings: 57,
    avg_order_value: '2186.00',
    this_month: '124600.00',
    prev_month: '98900.00',
    revenue_growth_pct: 26,
    revenue_by_type: [
        { type: 'event', amount: '47300.00', count: 28 },
        { type: 'class', amount: '36150.00', count: 14 },
        { type: 'venue', amount: '26200.00', count: 9 },
    ],
    revenue_trend: [
        { month: 'Jun 2026', year: 2026, count: 40, earnings: '98900.00' },
        { month: 'Jul 2026', year: 2026, count: 57, earnings: '124600.00' },
    ],
};

export const mockStatsOverviewAll = {
    period: '30d',
    listing_type: null,
    gross_revenue: '124600.00',
    revenue_growth_pct: 26.0,
    confirmed_bookings: 57,
    bookings_growth_pct: 20.0,
    avg_order_value: '2186.00',
    conversion_rate: 67.0,
    repeat_customers_pct: 31.0,
    revenue_by_type: [
        { type: 'event', amount: '47300.00', count: 22 },
        { type: 'class', amount: '38150.00', count: 18 },
        { type: 'venue', amount: '26200.00', count: 9 },
    ],
    revenue_by_listing: null,
    demand_funnel: { listing_views: 3077, enquiries: 84, confirmed_bookings: 57 },
    weekly_trend: [
        { week_start: '2026-07-27', revenue: '8200.00', bookings: 6 },
        { week_start: '2026-08-03', revenue: '11400.00', bookings: 8 },
    ],
    top_city: { city: 'Bengaluru', pct: 86.0 },
};

export const mockStatsOverviewAllVenue = {
    period: '30d',
    listing_type: 'venue',
    gross_revenue: '26200.00',
    revenue_growth_pct: 10.0,
    confirmed_bookings: 9,
    bookings_growth_pct: 5.0,
    avg_order_value: '2911.00',
    conversion_rate: 45.0,
    repeat_customers_pct: 22.0,
    revenue_by_type: null,
    revenue_by_listing: [
        { listing_id: 'v1', listing_title: 'Grand Hall', amount: '18000.00', count: 5 },
        { listing_id: 'v2', listing_title: 'Rooftop Lounge', amount: '8200.00', count: 4 },
    ],
    demand_funnel: { listing_views: 500, enquiries: 20, confirmed_bookings: 9 },
    weekly_trend: [],
};

export const mockStatsOverviewAllEvent = {
    period: '30d',
    listing_type: 'event',
    gross_revenue: '47300.00',
    revenue_growth_pct: 8.0,
    confirmed_bookings: 22,
    bookings_growth_pct: 4.0,
    avg_order_value: '2150.00',
    conversion_rate: 0.0,
    repeat_customers_pct: 12.0,
    revenue_by_type: null,
    revenue_by_listing: [
        { listing_id: 'e1', listing_title: 'Summer Fest', amount: '30000.00', count: 14 },
    ],
    demand_funnel: { listing_views: 1200, enquiries: 0, confirmed_bookings: 22 },
    weekly_trend: [],
};

export const mockListingPerformance = {
    count: 2, page: 1, page_size: 10, next: null, previous: null,
    results: [
        {
            listing_id: 'l1', listing_title: 'Indigo Dyeing Evening', listing_type: 'event',
            thumbnail_url: 'https://example.com/indigo.jpg', price: '1100', average_rating: '4.9',
            views: 1243, enquiries: 39, booked: 42, conversion_rate: 3.1, revenue: '47300.00',
        },
        {
            listing_id: 'l2', listing_title: 'Beginners Pottery', listing_type: 'class',
            thumbnail_url: null, price: null, average_rating: null,
            views: 300, enquiries: 0, booked: 0, conversion_rate: 0, revenue: '0.00',
        },
    ],
};

export const mockStatsReviews = {
    avg_rating: 4.6,
    total_reviews: 46,
    reviews_this_month: 5,
    reviews_prev_month: 3,
    rating_distribution: [{ rating: 5, count: 30 }, { rating: 4, count: 10 }],
    avg_rating_trend: [{ month: 'Jul 2026', avg_rating: 4.6, count: 5 }],
    recent_reviews: [],
};

export const mockStatsTraffic = {
    period: { type: 'this_month', date_from: '2026-09-01', date_to: '2026-09-15', label: 'This Month' },
    totals: { views: 340, unique_viewers: 210, enquiries: 28 },
    daily_trend: [
        { date: '2026-09-01', views: 12 },
        { date: '2026-09-02', views: 18 },
        { date: '2026-09-03', views: 0 },
    ],
    by_source: [
        { source: 'instagram', views: 140 },
        { source: 'organic/direct', views: 90 },
        { source: 'google', views: 60 },
    ],
};

export const mockTrafficDetailByDay = {
    count: 3, page: 1, page_size: 20, next: null, previous: null,
    results: [
        { date: '2026-09-01', views: 12, unique_viewers: 10, enquiries: 2 },
        { date: '2026-09-02', views: 18, unique_viewers: 15, enquiries: 3 },
        { date: '2026-09-03', views: 0, unique_viewers: 0, enquiries: 0 },
    ],
};

export const mockTrafficDetailByListing = {
    count: 2, page: 1, page_size: 20, next: null, previous: null,
    results: [
        { listing_id: 'l1', listing_name: 'Beginners Pottery', views: 210, unique_viewers: 140, enquiries: 19, conversion_rate: 9.05 },
        { listing_id: 'l2', listing_name: 'Studio Rental — Hourly', views: 130, unique_viewers: 70, enquiries: 9, conversion_rate: 6.92 },
    ],
};

// ─── Followers fixtures ───────────────────────────────────────────────────────

export const mockFollowers = [
    { id: 'f1', user: { name: 'Aarav Mehta', city: 'Mumbai' }, followed_at: '2026-06-20T10:00:00Z' },
    { id: 'f2', user: { full_name: 'Diya Kapoor', city: 'Pune' }, followed_at: '2026-06-25T10:00:00Z' },
];

// Flat shape the current `getFollowers()` (src/api/followers.ts) actually returns —
// distinct from the nested `mockFollowers` shape above, which backs the older
// id-scoped `/partner/:id/followers/` endpoint used elsewhere (e.g. profile previews).
export const mockFollowersList = [
    { user_id: 'u1', full_name: 'Aarav Mehta', city: 'Mumbai', gender: 'male', followed_at: '2026-06-20T10:00:00Z' },
    { user_id: 'u2', full_name: 'Diya Kapoor', city: 'Pune', gender: 'female', followed_at: '2026-06-25T10:00:00Z' },
];

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
    http.get(`${BASE}/api/v1/partner/stats/revenue/`, () =>
        HttpResponse.json({ success: true, data: mockStatsRevenue })),
    http.get(`${BASE}/api/v1/partner/stats/overview-all/`, ({ request }) => {
        const listingType = new URL(request.url).searchParams.get('listing_type');
        if (listingType === 'venue') return HttpResponse.json({ success: true, data: mockStatsOverviewAllVenue });
        if (listingType === 'event') return HttpResponse.json({ success: true, data: mockStatsOverviewAllEvent });
        return HttpResponse.json({ success: true, data: mockStatsOverviewAll });
    }),
    http.get(`${BASE}/api/v1/partner/stats/listing-performance/`, () =>
        HttpResponse.json({ success: true, data: mockListingPerformance })),

    // ─── CSV report downloads — raw text/csv, not the {success,data} envelope ───
    http.get(`${BASE}/api/v1/partner/reports/earnings-statement/`, () =>
        new HttpResponse('period_start,period_end,gross_amount,commission_percent,commission_amount,net_payable,status,paid_at\n2026-08-01,2026-08-31,50000.00,15,7500.00,42500.00,paid,2026-09-05', {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="earnings-statement_20260917.csv"' },
        })),
    http.get(`${BASE}/api/v1/partner/reports/booking-register/`, () =>
        new HttpResponse('booking_reference,created_at,customer_name,customer_email,listing_title,booking_type,status,total_amount\nBKG-1,2026-08-10,Asha Rao,asha@example.com,Indigo Dyeing Evening,event,confirmed,1100.00', {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="booking-register_20260917.csv"' },
        })),
    http.get(`${BASE}/api/v1/partner/reports/enquiry-response-log/`, () =>
        new HttpResponse('service_type,listing_title,attendee_name,status,created_at,responded_at,response_hours,within_sla\nclass,Beginners Pottery,Neha Rao,closed,2026-08-10,2026-08-11,20,true', {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="enquiry-response-log_20260917.csv"' },
        })),
    http.get(`${BASE}/api/v1/partner/reports/reviews-export/`, () =>
        new HttpResponse('listing_title,rating,comment,created_at\nIndigo Dyeing Evening,5,Loved it,2026-08-12', {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="reviews-export_20260917.csv"' },
        })),

    http.get(`${BASE}/api/v1/partner/stats/reviews/`, () =>
        HttpResponse.json({ success: true, data: mockStatsReviews })),
    http.post(`${BASE}/api/v1/partner/:id/track-view/`, () =>
        HttpResponse.json({ success: true, data: { message: 'tracked' } })),
    http.get(`${BASE}/api/v1/partner/stats/traffic/`, () =>
        HttpResponse.json({ success: true, data: mockStatsTraffic })),
    http.get(`${BASE}/api/v1/partner/stats/traffic/detail/`, ({ request }) => {
        const groupBy = new URL(request.url).searchParams.get('group_by');
        return HttpResponse.json({ success: true, data: groupBy === 'listing' ? mockTrafficDetailByListing : mockTrafficDetailByDay });
    }),

    // ─── Followers ───
    http.get(`${BASE}/api/v1/partner/:id/followers/count/`, () =>
        HttpResponse.json({ success: true, data: { partner_id: 1, follower_count: 87 } })),
    http.get(`${BASE}/api/v1/partner/:id/followers/`, () =>
        HttpResponse.json({ success: true, data: mockFollowers })),
    // Self-scoped list the Followers screen itself calls (src/api/followers.ts).
    http.get(`${BASE}/api/v1/partner/followers/`, ({ request }) => {
        const search = new URL(request.url).searchParams.get('search')?.toLowerCase() || '';
        const results = search
            ? mockFollowersList.filter(f => f.full_name.toLowerCase().includes(search))
            : mockFollowersList;
        return HttpResponse.json({ success: true, data: { count: 87, page: 1, page_size: 20, next: null, previous: null, results } });
    }),

    // ─── Coupons ───
    http.get(`${BASE}/api/v1/partner/coupons/`, () =>
        HttpResponse.json({ success: true, data: [] })),
    http.get(`${BASE}/api/v1/partner/coupons/:id/`, ({ params }) =>
        HttpResponse.json({ success: true, data: { ...mockCoupon, id: params.id } })),
    http.get(`${BASE}/api/v1/partner/coupons/:id/usages/`, () =>
        HttpResponse.json({ success: true, data: [] })),
    http.post(`${BASE}/api/v1/partner/coupons/`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: { ...mockCoupon, id: 'new-coupon-id', ...body } }, { status: 201 });
    }),
    http.patch(`${BASE}/api/v1/partner/coupons/:id/`, async ({ request, params }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: { ...mockCoupon, id: params.id, ...body } });
    }),

    // ─── Reviews list (Reviews screen) ───
    http.get(`${BASE}/api/v1/partner/reviews/`, () =>
        HttpResponse.json({ success: true, data: { count: mockReviewsList.length, next: null, previous: null, results: mockReviewsList } })),

    // ─── Bank details (Revenue & payouts screen) ───
    http.get(`${BASE}/api/v1/partner/bank-details/`, () =>
        HttpResponse.json({ success: true, data: mockBankDetails })),

    // ─── Partner verticals (Services & categories self-service) ───
    http.get(`${BASE}/api/v1/partner/verticals/`, () =>
        HttpResponse.json({ success: true, data: mockVerticals })),
    http.post(`${BASE}/api/v1/partner/verticals/`, async ({ request }) => {
        const body = await request.json() as { category: string };
        return HttpResponse.json({ success: true, data: { id: 99, name: body.category } });
    }),
    http.delete(`${BASE}/api/v1/partner/verticals/`, () =>
        HttpResponse.json({ success: true, data: { message: 'removed' } })),
];
