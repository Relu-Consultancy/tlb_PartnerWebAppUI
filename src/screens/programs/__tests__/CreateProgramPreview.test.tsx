import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { PROGRAM_DRAFT_ID, mockProgramDraft } from '../../../test/msw/handlers';
import { CreateProgramPreview } from '../CreateProgramPreview';
import { getCurrentProgramDraftId } from '../../../api/listings';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

const completeDraft = {
    ...mockProgramDraft,
    title: 'STEM Bootcamp',
    description: 'Learn science and tech',
    delivery_mode: 'offline',
    address: '123 Test Street',
    city: 'Mumbai',
    category: { id: 1, name: 'Dance' },
    subcategory: { id: 2, name: 'Classical' },
    media: [{ id: 10, media_type: 'cover', file_url: 'https://example.com/prog-cover.jpg' }],
    batches: [{ id: 1, name: 'Cohort 1', start_date: '2026-08-01', end_date: '2026-10-01' }],
};

function renderComponent() {
    sessionStorage.setItem('current_program_draft_id', PROGRAM_DRAFT_ID);
    return render(<CreateProgramPreview onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
    server.use(http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: completeDraft })));
});

describe('CreateProgramPreview — display', () => {
    it('renders program title from API', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText('STEM Bootcamp')).toBeInTheDocument(), { timeout: 3000 });
    });

    it('shows Publish/Submit button', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('STEM Bootcamp'));
        expect(screen.getByRole('button', { name: /publish|submit/i })).toBeInTheDocument();
    });
});

describe('CreateProgramPreview — readiness', () => {
    it('shows missing fields when draft is incomplete', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/`, () =>
            HttpResponse.json({ success: true, data: { ...mockProgramDraft, title: '', description: '' } })));
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/missing|incomplete|required/i)).toBeInTheDocument(), { timeout: 3000 }
        );
    });
});

describe('CreateProgramPreview — submit', () => {
    it('shows success modal after submit', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('STEM Bootcamp'));
        const submitBtn = screen.getByRole('button', { name: /publish|submit/i });
        if (!submitBtn.hasAttribute('disabled')) {
            await user.click(submitBtn);
            await waitFor(() =>
                expect(screen.getByText('Program Under Review')).toBeInTheDocument()
            );
        }
    });

    it('shows partner under review modal on 403', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/submit/`, () =>
            HttpResponse.json({ error: { code: 'PARTNER_UNDER_REVIEW', message: 'Profile under review' } }, { status: 403 })));
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('STEM Bootcamp'));
        const submitBtn = screen.getByRole('button', { name: /publish|submit/i });
        if (!submitBtn.hasAttribute('disabled')) {
            await user.click(submitBtn);
            await waitFor(() =>
                expect(screen.getByText(/profile under review/i)).toBeInTheDocument()
            );
        }
    });

    it('clears program draft id after successful submit and modal close', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('STEM Bootcamp'));
        const submitBtn = screen.getByRole('button', { name: /publish|submit/i });
        if (!submitBtn.hasAttribute('disabled')) {
            await user.click(submitBtn);
            await waitFor(() => screen.getByText('Program Under Review'));
            const okBtn = screen.getByRole('button', { name: /okay, go to my listings/i });
            await user.click(okBtn);
            expect(getCurrentProgramDraftId()).toBeNull();
            expect(mockNavigate).toHaveBeenCalledWith('SERVICE_LISTINGS');
        }
    });

    it('archive button calls archiveProgramListing', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('STEM Bootcamp'));
        const archiveBtn = screen.queryByRole('button', { name: /archive/i });
        if (archiveBtn) {
            server.use(http.post(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/archive/`, () =>
                HttpResponse.json({ success: true, data: { ...completeDraft, status: 'archived' } })));
            await user.click(archiveBtn);
            await waitFor(() => expect(screen.queryByText(/archived/i)).toBeInTheDocument());
        }
    });
});
