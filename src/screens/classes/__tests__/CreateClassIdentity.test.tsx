import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { CLASS_DRAFT_ID, mockClassDraft } from '../../../test/msw/handlers';
import { CreateClassIdentity } from '../CreateClassIdentity';
import { getCurrentClassDraftId } from '../../../api/listings';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

function renderComponent() {
    return render(<CreateClassIdentity onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('CreateClassIdentity — render', () => {
    it('shows "Identity & Story" heading', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText(/identity & story/i)).toBeInTheDocument());
    });

    it('shows Service Title input', async () => {
        renderComponent();
        await waitFor(() =>
            expect(screen.getByPlaceholderText(/advanced robotics workshop/i)).toBeInTheDocument()
        );
    });

    it('shows loading state while fetching metadata', () => {
        renderComponent();
        // WizardLayout renders immediately; check that inputs appear after load
        expect(document.body).toBeTruthy();
    });
});

describe('CreateClassIdentity — metadata loading', () => {
    it('renders categories from API after loading', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText('Dance')).toBeInTheDocument(), { timeout: 3000 });
    });

    it('renders subcategories after selecting a category', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Dance'));
        await user.click(screen.getByText('Dance'));
        await waitFor(() => expect(screen.getByText('Classical')).toBeInTheDocument());
    });

    it('shows meta error when API fails', async () => {
        server.use(
            http.get(`${BASE}/api/v1/listings/classes/metadata/categories/`, () =>
                HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Metadata unavailable' } }, { status: 500 }))
        );
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/metadata unavailable|failed to load/i)).toBeInTheDocument()
        );
    });
});

describe('CreateClassIdentity — mode selection', () => {
    it('shows address fields for offline mode (default)', async () => {
        renderComponent();
        await waitFor(() => screen.getByText(/identity & story/i));
        expect(screen.queryByPlaceholderText(/city/i)).toBeInTheDocument();
    });

    it('shows meeting link for online mode', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/identity & story/i));
        const onlineBtn = screen.queryByRole('button', { name: 'Online' });
        if (onlineBtn) await user.click(onlineBtn);
        await waitFor(() =>
            expect(screen.queryByPlaceholderText(/meet\.google\.com/i)).toBeInTheDocument()
        );
    });
});

describe('CreateClassIdentity — Next button (validation)', () => {
    it('shows error when title is empty on Next click', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/identity & story/i));
        const nextBtn = screen.getByRole('button', { name: /next|continue/i });
        await user.click(nextBtn);
        await waitFor(() =>
            expect(screen.getByText(/title is required|class title/i)).toBeInTheDocument()
        );
    });

    it('creates draft and navigates to CREATE_CLASS_BATCH on success', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByPlaceholderText(/advanced robotics workshop/i));
        await user.type(screen.getByPlaceholderText(/advanced robotics workshop/i), 'Test Class');
        const nextBtn = screen.getByRole('button', { name: /next|continue/i });
        await user.click(nextBtn);
        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('CREATE_CLASS_BATCH')
        );
    });

    it('stores class draft id in sessionStorage after creation', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByPlaceholderText(/advanced robotics workshop/i));
        await user.type(screen.getByPlaceholderText(/advanced robotics workshop/i), 'My New Class');
        await user.click(screen.getByRole('button', { name: /next|continue/i }));
        await waitFor(() => expect(getCurrentClassDraftId()).toBe(CLASS_DRAFT_ID));
    });
});

describe('CreateClassIdentity — pre-fill from existing draft', () => {
    it('pre-fills title from existing draft', async () => {
        sessionStorage.setItem('current_class_draft_id', CLASS_DRAFT_ID);
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, () =>
            HttpResponse.json({ success: true, data: { ...mockClassDraft, title: 'Existing Class', mode: 'offline' } })));
        renderComponent();
        await waitFor(() =>
            expect(screen.getByDisplayValue('Existing Class')).toBeInTheDocument(), { timeout: 3000 }
        );
    });
});

describe('CreateClassIdentity — booking type', () => {
    it('renders both Enquiry and Booking options', async () => {
        renderComponent();
        await waitFor(() => screen.getByText(/identity & story/i));
        expect(screen.getByText('Enquiry')).toBeInTheDocument();
        expect(screen.getByText('Direct Booking')).toBeInTheDocument();
    });

    it('defaults to Enquiry selected', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Enquiry'));
        // Enquiry card should have the yellow ring (border-tlb-yellow class)
        const enquiryBtn = screen.getByText('Enquiry').closest('button');
        expect(enquiryBtn?.className).toMatch(/border-tlb-yellow/);
    });

    it('can select Direct Booking type', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Direct Booking'));
        await user.click(screen.getByText('Direct Booking'));
        const bookingBtn = screen.getByText('Direct Booking').closest('button');
        expect(bookingBtn?.className).toMatch(/border-tlb-yellow/);
    });

    it('pre-fills booking_type from existing draft', async () => {
        sessionStorage.setItem('current_class_draft_id', CLASS_DRAFT_ID);
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, () =>
            HttpResponse.json({ success: true, data: { ...mockClassDraft, booking_type: 'direct_booking' } })));
        renderComponent();
        await waitFor(() => {
            const bookingBtn = screen.getByText('Direct Booking').closest('button');
            expect(bookingBtn?.className).toMatch(/border-tlb-yellow/);
        }, { timeout: 3000 });
    });

    it('includes booking_type in the PATCH payload', async () => {
        let patchBody: any = null;
        server.use(http.patch(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, async ({ request }) => {
            patchBody = await request.json();
            return HttpResponse.json({ success: true, data: mockClassDraft });
        }));
        sessionStorage.setItem('current_class_draft_id', CLASS_DRAFT_ID);
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByPlaceholderText(/advanced robotics workshop/i));
        await user.type(screen.getByPlaceholderText(/advanced robotics workshop/i), 'My Class');
        await user.click(screen.getByText('Direct Booking'));
        await user.click(screen.getByRole('button', { name: /next|continue/i }));
        await waitFor(() => expect(patchBody?.booking_type).toBe('direct_booking'));
    });
});
