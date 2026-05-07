import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { DRAFT_ID } from '../../../test/msw/handlers';
import { CreateEventMedia } from '../CreateEventMedia';
import { setCurrentDraftId } from '../../../api/listings';

const BASE = 'https://tlb-api.reluconsultancy.in';

const mockNavigate = vi.fn();
const props = { onNavigate: mockNavigate, onOpenSidebar: vi.fn() };

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('CreateEventMedia — loading and error states', () => {
    it('shows error when no draft id in sessionStorage', async () => {
        render(<CreateEventMedia {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/no active draft/i)).toBeInTheDocument()
        );
    });

    it('shows loading spinner initially when draft exists', () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventMedia {...props} />);
        expect(screen.getByText(/loading media/i)).toBeInTheDocument();
    });

    it('shows error message on media API failure', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.get(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Media not found' } }, { status: 404 })));
        render(<CreateEventMedia {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/media not found/i)).toBeInTheDocument()
        );
    });
});

describe('CreateEventMedia — media display', () => {
    it('shows existing cover image from draft', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventMedia {...props} />);
        await waitFor(() => {
            const img = document.querySelector('img[alt="Cover"]');
            expect(img).toBeInTheDocument();
            expect(img?.getAttribute('src')).toBe('https://example.com/cover.jpg');
        });
    });

    it('shows upload cover button when no cover exists', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.get(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/`, () =>
            HttpResponse.json({ success: true, data: [] })));
        render(<CreateEventMedia {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/upload cover/i)).toBeInTheDocument()
        );
    });

    it('shows cover required warning when no cover', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.get(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/`, () =>
            HttpResponse.json({ success: true, data: [] })));
        render(<CreateEventMedia {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/cover image is required/i)).toBeInTheDocument()
        );
    });

    it('hides cover warning when cover exists', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventMedia {...props} />);
        await waitFor(() => document.querySelector('img[alt="Cover"]'));
        expect(screen.queryByText(/cover image is required/i)).not.toBeInTheDocument();
    });

    it('shows gallery Add button', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventMedia {...props} />);
        await waitFor(() =>
            expect(screen.getByText('Add')).toBeInTheDocument()
        );
    });

    it('shows gallery count label', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventMedia {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/gallery photos/i)).toBeInTheDocument()
        );
    });

    it('shows Upload Video button', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventMedia {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/upload video/i)).toBeInTheDocument()
        );
    });
});

describe('CreateEventMedia — cover deletion', () => {
    it('shows Remove cover button when cover exists', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventMedia {...props} />);
        await waitFor(() =>
            expect(document.querySelector('button[aria-label="Remove cover"]')).toBeInTheDocument()
        );
    });

    it('can delete cover and shows upload button after', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventMedia {...props} />);
        await waitFor(() => document.querySelector('button[aria-label="Remove cover"]'));
        const deleteBtn = document.querySelector('button[aria-label="Remove cover"]') as HTMLButtonElement;
        await user.click(deleteBtn);
        await waitFor(() =>
            expect(screen.getByText(/upload cover/i)).toBeInTheDocument()
        );
    });

    it('shows alert when cover delete fails', async () => {
        setCurrentDraftId(DRAFT_ID);
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        server.use(http.delete(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/media/:mediaId`, () =>
            HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Delete failed' } }, { status: 500 })));
        const user = userEvent.setup();
        render(<CreateEventMedia {...props} />);
        await waitFor(() => document.querySelector('button[aria-label="Remove cover"]'));
        await user.click(document.querySelector('button[aria-label="Remove cover"]') as HTMLButtonElement);
        await waitFor(() => expect(alertSpy).toHaveBeenCalled());
        alertSpy.mockRestore();
    });
});

describe('CreateEventMedia — navigation', () => {
    it('navigates to CREATE_EVENT_PREVIEW on Next click', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventMedia {...props} />);
        await waitFor(() => screen.getByText(/preview & publish/i));
        await user.click(screen.getByText(/preview & publish/i));
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_PREVIEW');
    });

    it('navigates back to CREATE_EVENT_SCHEDULE on Back click', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventMedia {...props} />);
        await waitFor(() => screen.getByText(/← back/i));
        await user.click(screen.getByText(/← back/i));
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_SCHEDULE');
    });
});
