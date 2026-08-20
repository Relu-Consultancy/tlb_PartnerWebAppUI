import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { DRAFT_ID, mockDraft } from '../../../test/msw/handlers';
import { CreateEventDetails } from '../CreateEventDetails';
import * as listingsApi from '../../../api/listings';
import { toast } from '../../../components/ui';

const BASE = 'https://tlb-api.reluconsultancy.in';

const mockNavigate = vi.fn();
const defaultProps = {
    onNavigate: mockNavigate,
    onOpenSidebar: vi.fn(),
};

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('CreateEventDetails — metadata loading', () => {
    it('shows a loading state while fetching metadata', () => {
        render(<CreateEventDetails {...defaultProps} />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders categories from API after loading', async () => {
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => expect(screen.getByText('Dance')).toBeInTheDocument());
        expect(screen.getByText('Sports')).toBeInTheDocument();
    });

    it('renders format chips from API', async () => {
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => expect(screen.getByText('Workshop')).toBeInTheDocument());
        expect(screen.getByText('Camp')).toBeInTheDocument();
        expect(screen.getByText('Masterclass')).toBeInTheDocument();
    });

    it('renders static age group presets from API', async () => {
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => expect(screen.getByText('6–8 yrs')).toBeInTheDocument());
        expect(screen.getByText('0–3 yrs')).toBeInTheDocument();
    });

    it('shows error message when metadata fails', async () => {
        server.use(
            http.get(`${BASE}/api/v1/listings/events/metadata/categories/`, () =>
                HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Server down' } }, { status: 500 }))
        );
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => expect(screen.getByText(/server down/i)).toBeInTheDocument());
    });
});

describe('CreateEventDetails — pre-fill from existing draft', () => {
    it('pre-fills title and description when draft id exists', async () => {
        listingsApi.setCurrentDraftId(DRAFT_ID);
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => {
            const input = screen.getByPlaceholderText(/summer art festival/i);
            expect((input as HTMLInputElement).value).toBe('Test Event');
        });
    });

    it('pre-selects mode from existing draft', async () => {
        listingsApi.setCurrentDraftId(DRAFT_ID);
        render(<CreateEventDetails {...defaultProps} />);
        // mockDraft has mode: 'offline'
        await waitFor(() => {
            const offlineBtn = screen.getByText('Offline').closest('button');
            expect(offlineBtn?.className).toContain('border-blue-400');
        });
    });
});

describe('CreateEventDetails — form interactions', () => {
    it('selects a category and shows its subcategories', async () => {
        const user = userEvent.setup();
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByText('Dance'));
        await user.click(screen.getByText('Dance'));
        expect(screen.getByText('Classical')).toBeInTheDocument();
    });

    it('selecting a format chip highlights it', async () => {
        const user = userEvent.setup();
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByText('Workshop'));
        const chip = screen.getByText('Workshop');
        await user.click(chip);
        expect(chip.className).toContain('bg-purple-500');
    });

    it('toggles format off when clicked again', async () => {
        const user = userEvent.setup();
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByText('Workshop'));
        const chip = screen.getByText('Workshop');
        await user.click(chip);
        await user.click(chip);
        expect(chip.className).not.toContain('bg-purple-500');
    });

    it('shows the location picker and address box when offline mode is selected', async () => {
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByText('Offline'));
        // Offline is default
        expect(screen.getByPlaceholderText(/search for the venue's address/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Street, building, landmark')).toBeInTheDocument();
    });

    it('shows meeting link when online mode is selected', async () => {
        const user = userEvent.setup();
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByText('Online'));
        await user.click(screen.getByText('Online'));
        expect(screen.getByPlaceholderText(/meet\.google\.com/i)).toBeInTheDocument();
    });

    it('hides the location picker when online mode is selected', async () => {
        const user = userEvent.setup();
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByText('Online'));
        await user.click(screen.getByText('Online'));
        expect(screen.queryByPlaceholderText(/search for the venue's address/i)).not.toBeInTheDocument();
    });

    it('switches between Preset and Custom age group tabs', async () => {
        const user = userEvent.setup();
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByText('Custom'));
        await user.click(screen.getByText('Custom'));
        expect(screen.getByPlaceholderText('Min')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Max')).toBeInTheDocument();
    });
});

describe('CreateEventDetails — Next button', () => {
    it('shows an alert when title is empty', async () => {
        const user = userEvent.setup();
        const toastSpy = vi.spyOn(toast, 'warning').mockImplementation(() => 0);
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByText('Workshop'));
        await user.click(screen.getByText(/next: schedule/i));
        expect(toastSpy).toHaveBeenCalledWith(expect.stringMatching(/title/i));
        toastSpy.mockRestore();
    });

    it('creates a new draft and navigates to schedule on Next', async () => {
        const user = userEvent.setup();
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByPlaceholderText(/summer art festival/i));
        await user.type(screen.getByPlaceholderText(/summer art festival/i), 'My Festival');
        await user.click(screen.getByText(/next: schedule/i));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_SCHEDULE'));
        expect(listingsApi.getCurrentDraftId()).toBe(DRAFT_ID);
    });

    it('updates existing draft instead of creating new one when draft id already set', async () => {
        listingsApi.setCurrentDraftId(DRAFT_ID);
        let createCalled = false;
        server.use(http.post(`${BASE}/api/v1/partner/listings/events/`, () => {
            createCalled = true;
            return HttpResponse.json({ success: true, data: mockDraft }, { status: 201 });
        }));
        const user = userEvent.setup();
        render(<CreateEventDetails {...defaultProps} />);
        await waitFor(() => screen.getByPlaceholderText(/summer art festival/i));
        await user.type(screen.getByPlaceholderText(/summer art festival/i), 'Updated Title');
        await user.click(screen.getByText(/next: schedule/i));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_SCHEDULE'));
        expect(createCalled).toBe(false); // should not create, only update
    });
});
