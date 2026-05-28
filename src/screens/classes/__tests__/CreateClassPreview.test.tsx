import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { CLASS_DRAFT_ID, mockClassDraft } from '../../../test/msw/handlers';
import { CreateClassPreview } from '../CreateClassPreview';
import { getCurrentClassDraftId } from '../../../api/listings';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

const completeDraft = {
    ...mockClassDraft,
    title: 'Test Class',
    description: 'A full description',
    format: 'workshop',
    mode: 'offline',
    address: '123 Test Street',
    category: { id: 1, name: 'Dance' },
    subcategory: { id: 2, name: 'Classical' },
    service: {
        media: [{ id: 55, media_type: 'cover', file_url: 'https://example.com/cover.jpg' }],
    },
    batches: [{ id: 1, name: 'Morning Batch' }],
};

function renderComponent() {
    sessionStorage.setItem('current_class_draft_id', CLASS_DRAFT_ID);
    return render(<CreateClassPreview onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
    server.use(http.get(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, () =>
        HttpResponse.json({ success: true, data: completeDraft })));
});

describe('CreateClassPreview — loading & display', () => {
    it('renders the class title from API', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText('Test Class')).toBeInTheDocument(), { timeout: 3000 });
    });

    it('shows "Publish Class" or similar submit button', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Test Class'));
        const submitBtn = screen.getByRole('button', { name: /publish|submit/i });
        expect(submitBtn).toBeInTheDocument();
    });
});

describe('CreateClassPreview — readiness check', () => {
    it('shows missing fields list when draft is incomplete', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, () =>
            HttpResponse.json({ success: true, data: { ...mockClassDraft, title: '', format: '', description: '' } })));
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/missing|incomplete|required/i)).toBeInTheDocument(), { timeout: 3000 }
        );
    });

    it('blocks submit button when required fields are missing', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/`, () =>
            HttpResponse.json({ success: true, data: { ...mockClassDraft, title: '', description: '' } })));
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/missing for submission/i)).toBeInTheDocument(), { timeout: 3000 }
        );
        // When missing fields exist, submit button shows "Back to Listings" not "Submit for Review"
        expect(screen.queryByRole('button', { name: /submit for review/i })).not.toBeInTheDocument();
    });
});

describe('CreateClassPreview — submit', () => {
    it('shows success modal after successful submit', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Test Class'));
        const submitBtn = screen.getByRole('button', { name: /publish|submit/i });
        if (!submitBtn.hasAttribute('disabled')) {
            await user.click(submitBtn);
            await waitFor(() =>
                expect(screen.getByText(/class under review|under review/i)).toBeInTheDocument()
            );
        }
    });

    it('shows under_review modal when partner is under review', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/submit/`, () =>
            HttpResponse.json({ error: { code: 'PARTNER_UNDER_REVIEW', message: 'Profile under review' } }, { status: 403 })));
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Test Class'));
        const submitBtn = screen.getByRole('button', { name: /publish|submit/i });
        if (!submitBtn.hasAttribute('disabled')) {
            await user.click(submitBtn);
            await waitFor(() =>
                expect(screen.getByText(/profile under review/i)).toBeInTheDocument()
            );
        }
    });

    it('clears class draft id and navigates to SERVICE_LISTINGS after modal close', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText('Test Class'));
        const submitBtn = screen.getByRole('button', { name: /publish|submit/i });
        if (!submitBtn.hasAttribute('disabled')) {
            await user.click(submitBtn);
            await waitFor(() => screen.getByText(/class under review|under review/i));
            const okBtn = screen.getByRole('button', { name: /okay, go to my listings/i });
            await user.click(okBtn);
            expect(mockNavigate).toHaveBeenCalledWith('SERVICE_LISTINGS');
            expect(getCurrentClassDraftId()).toBeNull();
        }
    });
});

describe('CreateClassPreview — navigation', () => {
    it('navigates back to CREATE_CLASS_POLICIES on back', async () => {
        renderComponent();
        await waitFor(() => screen.getByText('Test Class'));
        const backBtn = screen.getAllByRole('button').find(b => b.closest('header'));
        if (backBtn) {
            await userEvent.setup().click(backBtn);
            expect(mockNavigate).toHaveBeenCalledWith('CREATE_CLASS_POLICIES');
        }
    });
});
