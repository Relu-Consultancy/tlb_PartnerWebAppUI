import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { DRAFT_ID, mockDraft } from '../../../test/msw/handlers';
import { CreateEventPreview } from '../CreateEventPreview';
import { setCurrentDraftId, getCurrentDraftId } from '../../../api/listings';

const BASE = 'https://tlb-api.reluconsultancy.in';

const mockNavigate = vi.fn();
const props = { onNavigate: mockNavigate, onOpenSidebar: vi.fn() };

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('CreateEventPreview — loading and error states', () => {
    it('shows error when no draft id in sessionStorage', async () => {
        render(<CreateEventPreview {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/no active draft/i)).toBeInTheDocument()
        );
    });

    it('shows loading spinner initially when draft exists', () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventPreview {...props} />);
        expect(screen.getByText(/loading preview/i)).toBeInTheDocument();
    });

    it('shows error message on API failure', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.get(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, { status: 404 })));
        render(<CreateEventPreview {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/listing not found/i)).toBeInTheDocument()
        );
    });
});

describe('CreateEventPreview — event details display', () => {
    it('shows event title', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventPreview {...props} />);
        await waitFor(() =>
            expect(screen.getByText('Test Event')).toBeInTheDocument()
        );
    });

    it('shows category breadcrumb', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventPreview {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/dance/i)).toBeInTheDocument()
        );
    });

    it('shows event description', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventPreview {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/a test event description/i)).toBeInTheDocument()
        );
    });

    it('shows free ticket when price_type is free', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventPreview {...props} />);
        await waitFor(() =>
            expect(screen.getByText('Free')).toBeInTheDocument()
        );
    });

    it('shows cover image', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventPreview {...props} />);
        await waitFor(() => {
            const img = document.querySelector('img[alt="Cover"]');
            expect(img).toBeInTheDocument();
        });
    });
});

describe('CreateEventPreview — submission readiness', () => {
    it('shows Ready to submit when all required fields present', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventPreview {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/ready to submit/i)).toBeInTheDocument()
        );
    });

    it('shows Submit for Review button', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventPreview {...props} />);
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /submit for review/i })).toBeInTheDocument()
        );
    });

    it('shows missing fields list when required fields absent', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.get(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/`, () =>
            HttpResponse.json({
                success: true,
                data: { ...mockDraft, title: '', media: [] },
            })));
        render(<CreateEventPreview {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/missing for submission/i)).toBeInTheDocument()
        );
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Cover image')).toBeInTheDocument();
    });
});

describe('CreateEventPreview — submit modals', () => {
    it('shows Event Under Review modal on successful submit', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventPreview {...props} />);
        await waitFor(() => screen.getByRole('button', { name: /submit for review/i }));
        await user.click(screen.getByRole('button', { name: /submit for review/i }));
        await waitFor(() =>
            expect(screen.getByText('Event Under Review')).toBeInTheDocument()
        );
        expect(screen.getByText(/pending admin approval/i)).toBeInTheDocument();
        expect(screen.getByText(/won't be able to create new events/i)).toBeInTheDocument();
    });

    it('shows Profile Under Review modal when PARTNER_UNDER_REVIEW error code', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/submit/`, () =>
            HttpResponse.json({
                error: { code: 'PARTNER_UNDER_REVIEW', message: 'Partner under review' },
            }, { status: 403 })));
        const user = userEvent.setup();
        render(<CreateEventPreview {...props} />);
        await waitFor(() => screen.getByRole('button', { name: /submit for review/i }));
        await user.click(screen.getByRole('button', { name: /submit for review/i }));
        await waitFor(() =>
            expect(screen.getByText('Profile Under Review')).toBeInTheDocument()
        );
        expect(screen.queryByText('Event Under Review')).not.toBeInTheDocument();
    });

    it('does NOT show Profile Under Review for non-PARTNER_UNDER_REVIEW errors', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/submit/`, () =>
            HttpResponse.json({
                error: { code: 'LISTING_INCOMPLETE', message: 'Listing is incomplete' },
            }, { status: 400 })));
        const user = userEvent.setup();
        render(<CreateEventPreview {...props} />);
        await waitFor(() => screen.getByRole('button', { name: /submit for review/i }));
        await user.click(screen.getByRole('button', { name: /submit for review/i }));
        await waitFor(() =>
            expect(screen.getByText('Submission Failed')).toBeInTheDocument()
        );
        expect(screen.queryByText('Profile Under Review')).not.toBeInTheDocument();
    });

    it('shows error message in Submission Failed modal', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/submit/`, () =>
            HttpResponse.json({
                error: { code: 'SERVER_ERROR', message: 'Internal server error' },
            }, { status: 500 })));
        const user = userEvent.setup();
        render(<CreateEventPreview {...props} />);
        await waitFor(() => screen.getByRole('button', { name: /submit for review/i }));
        await user.click(screen.getByRole('button', { name: /submit for review/i }));
        await waitFor(() =>
            expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
        );
    });

    it('navigates to SERVICE_LISTINGS when success modal is closed', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventPreview {...props} />);
        await waitFor(() => screen.getByRole('button', { name: /submit for review/i }));
        await user.click(screen.getByRole('button', { name: /submit for review/i }));
        await waitFor(() => screen.getByText('Event Under Review'));
        await user.click(screen.getByText(/okay, go to my listings/i));
        expect(mockNavigate).toHaveBeenCalledWith('SERVICE_LISTINGS');
    });

    it('clears draft id when success modal is closed', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventPreview {...props} />);
        await waitFor(() => screen.getByRole('button', { name: /submit for review/i }));
        await user.click(screen.getByRole('button', { name: /submit for review/i }));
        await waitFor(() => screen.getByText('Event Under Review'));
        await user.click(screen.getByText(/okay, go to my listings/i));
        expect(getCurrentDraftId()).toBeNull();
    });

    it('navigates to SERVICE_LISTINGS when Profile Under Review modal is closed', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.post(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/submit/`, () =>
            HttpResponse.json({
                error: { code: 'PARTNER_UNDER_REVIEW', message: 'Partner under review' },
            }, { status: 403 })));
        const user = userEvent.setup();
        render(<CreateEventPreview {...props} />);
        await waitFor(() => screen.getByRole('button', { name: /submit for review/i }));
        await user.click(screen.getByRole('button', { name: /submit for review/i }));
        await waitFor(() => screen.getByText('Profile Under Review'));
        await user.click(screen.getByText(/back to listings/i));
        expect(mockNavigate).toHaveBeenCalledWith('SERVICE_LISTINGS');
    });
});

describe('CreateEventPreview — navigation', () => {
    it('navigates back to CREATE_EVENT_MEDIA on Back click', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventPreview {...props} />);
        await waitFor(() => screen.getByText(/← back/i));
        await user.click(screen.getByText(/← back/i));
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_MEDIA');
    });
});
