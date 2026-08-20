import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { PROGRAM_DRAFT_ID, mockProgramDraft } from '../../../test/msw/handlers';
import { CreateProgramIdentity } from '../CreateProgramIdentity';
import { getCurrentProgramDraftId } from '../../../api/listings';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

function renderComponent() {
    return render(<CreateProgramIdentity onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('CreateProgramIdentity — render', () => {
    it('shows the wizard heading', async () => {
        renderComponent();
        await waitFor(() =>
            expect(screen.getAllByText(/program/i).length).toBeGreaterThan(0)
        );
    });

    it('shows a Title input', async () => {
        renderComponent();
        await waitFor(() =>
            expect(screen.getByPlaceholderText('e.g. Advanced Robotics Program')).toBeInTheDocument()
        );
    });
});

describe('CreateProgramIdentity — metadata loading', () => {
    it('renders categories from API', async () => {
        renderComponent();
        await waitFor(() => expect(screen.queryByText('Dance')).toBeInTheDocument(), { timeout: 3000 });
    });

    it('renders subcategories after selecting a category', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.queryByText('Dance'));
        await user.click(screen.getByText('Dance'));
        await waitFor(() => expect(screen.queryByText('Classical')).toBeInTheDocument());
    });

    it('renders program tags from API', async () => {
        renderComponent();
        await waitFor(() => expect(screen.queryByText('STEM')).toBeInTheDocument(), { timeout: 3000 });
    });

    it('shows meta error on API failure', async () => {
        server.use(http.get(`${BASE}/api/v1/listings/programs/metadata/categories/`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Failed to load metadata.' } }, { status: 500 })));
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/failed to load metadata/i)).toBeInTheDocument(), { timeout: 3000 }
        );
    });
});

describe('CreateProgramIdentity — delivery mode', () => {
    it('shows the location picker for offline mode (default)', async () => {
        renderComponent();
        await waitFor(() => screen.queryByText('Dance'));
        expect(screen.queryByPlaceholderText(/search for the venue's address/i)).toBeInTheDocument();
    });

    it('shows meeting link for online mode', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.queryByText('Dance'));
        const onlineBtn = screen.queryByText(/^online$/i);
        if (onlineBtn) {
            await user.click(onlineBtn);
            await waitFor(() =>
                expect(screen.queryByPlaceholderText(/meet\.google\.com/i)).toBeInTheDocument()
            );
        }
    });
});

describe('CreateProgramIdentity — Next validation', () => {
    it('shows error when title is empty', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.queryByText('Dance'));
        const nextBtn = screen.getByRole('button', { name: /next|continue/i });
        await user.click(nextBtn);
        await waitFor(() =>
            expect(screen.getByText('Program title is required.')).toBeInTheDocument()
        );
    });

    it('creates draft and navigates to CREATE_PROGRAM_BATCH on success', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.queryByText('Dance'));
        const titleInput = screen.getByPlaceholderText('e.g. Advanced Robotics Program');
        await user.type(titleInput, 'New STEM Program');
        const nextBtn = screen.getByRole('button', { name: /next|continue/i });
        await user.click(nextBtn);
        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('CREATE_PROGRAM_BATCH')
        );
    });

    it('stores program draft id in sessionStorage after creation', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.queryByText('Dance'));
        const titleInput = screen.getByPlaceholderText('e.g. Advanced Robotics Program');
        await user.type(titleInput, 'Test Program');
        await user.click(screen.getByRole('button', { name: /next|continue/i }));
        await waitFor(() => expect(getCurrentProgramDraftId()).toBe(PROGRAM_DRAFT_ID));
    });
});

describe('CreateProgramIdentity — pre-fill from existing draft', () => {
    it('pre-fills title from existing draft', async () => {
        sessionStorage.setItem('current_program_draft_id', PROGRAM_DRAFT_ID);
        server.use(http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/`, () =>
            HttpResponse.json({ success: true, data: { ...mockProgramDraft, title: 'Existing Program' } })));
        renderComponent();
        await waitFor(() =>
            expect(screen.getByDisplayValue('Existing Program')).toBeInTheDocument(), { timeout: 3000 }
        );
    });
});

describe('CreateProgramIdentity — booking type', () => {
    it('does not expose a Direct Booking / Enquiry option in the UI', async () => {
        renderComponent();
        await waitFor(() => expect(screen.queryByText('Dance')).toBeInTheDocument(), { timeout: 3000 });
        expect(screen.queryByText('Direct Booking')).not.toBeInTheDocument();
        expect(screen.queryByText('Enquiry')).not.toBeInTheDocument();
    });

    it('defaults booking_type to "enquiry" in the PATCH payload', async () => {
        let patchBody: any = null;
        server.use(http.patch(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/`, async ({ request }) => {
            patchBody = await request.json();
            return HttpResponse.json({ success: true, data: mockProgramDraft });
        }));
        // No pre-existing draft: component creates via POST on Next, then PATCHes
        renderComponent();
        const user = userEvent.setup();
        // Wait for metadata to fully load before interacting
        await waitFor(() => expect(screen.queryByText('Dance')).toBeInTheDocument(), { timeout: 3000 });
        await user.type(screen.getByPlaceholderText('e.g. Advanced Robotics Program'), 'My Program');
        await user.click(screen.getByRole('button', { name: /next|continue/i }));
        await waitFor(() => expect(patchBody?.booking_type).toBe('enquiry'), { timeout: 3000 });
    });
});
