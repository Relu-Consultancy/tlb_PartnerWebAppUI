import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { DRAFT_ID } from '../../../test/msw/handlers';
import { CreateEventSchedule } from '../CreateEventSchedule';
import { setCurrentDraftId } from '../../../api/listings';

const BASE = 'https://tlb-api.reluconsultancy.in';

const mockNavigate = vi.fn();
const props = { onNavigate: mockNavigate, onOpenSidebar: vi.fn() };

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('CreateEventSchedule — loading and error states', () => {
    it('shows error when no draft id in sessionStorage', async () => {
        render(<CreateEventSchedule {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/no active draft/i)).toBeInTheDocument()
        );
    });

    it('shows loading spinner initially when draft exists', () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventSchedule {...props} />);
        expect(screen.getByText(/loading draft/i)).toBeInTheDocument();
    });

    it('shows error message on API failure', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(http.get(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/`, () =>
            HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, { status: 404 })));
        render(<CreateEventSchedule {...props} />);
        await waitFor(() =>
            expect(screen.getByText(/listing not found/i)).toBeInTheDocument()
        );
    });
});

describe('CreateEventSchedule — pre-fill from draft', () => {
    it('pre-fills dates from existing draft', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => {
            const dateInputs = document.querySelectorAll('input[type="date"]');
            expect(dateInputs[0]).toHaveValue('2026-07-01');
        });
    });

    it('shows Free Event selected when draft has price_type free', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => {
            const freeBtn = screen.getByText('Free Event').closest('button');
            expect(freeBtn?.className).toContain('border-emerald-400');
        });
    });

    it('shows capacity field for free events', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => {
            expect(screen.getByText(/capacity/i)).toBeInTheDocument();
            expect(screen.queryByText(/ticket tiers/i)).not.toBeInTheDocument();
        });
    });
});

describe('CreateEventSchedule — pricing toggle', () => {
    it('shows ticket tiers section when Paid Event is selected', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Free Event'));
        await user.click(screen.getByText('Paid Event'));
        expect(screen.getByText(/ticket tiers/i)).toBeInTheDocument();
    });

    it('shows warning banner when price_type is switched', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid Event'));
        await user.click(screen.getByText('Paid Event'));
        expect(screen.getByText(/switching pricing type/i)).toBeInTheDocument();
    });

    it('hides capacity field when Paid Event is selected', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid Event'));
        await user.click(screen.getByText('Paid Event'));
        expect(screen.queryByPlaceholderText(/e\.g\. 100/i)).not.toBeInTheDocument();
    });
});

describe('CreateEventSchedule — ticket management', () => {
    it('can add a new ticket tier', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid Event'));
        await user.click(screen.getByText('Paid Event'));
        await user.click(screen.getByText(/add ticket tier/i));
        const tiers = screen.getAllByText(/tier \d/i);
        expect(tiers.length).toBeGreaterThan(0);
    });

    it('can remove a ticket tier when multiple exist', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid Event'));
        await user.click(screen.getByText('Paid Event'));
        // Add a second ticket
        await user.click(screen.getByText(/add ticket tier/i));
        const deleteButtons = document.querySelectorAll('button[aria-label="Remove ticket"]');
        expect(deleteButtons.length).toBe(2);
        await user.click(deleteButtons[0]);
        const tiersAfter = document.querySelectorAll('button[aria-label="Remove ticket"]');
        expect(tiersAfter.length).toBe(1);
    });
});

describe('CreateEventSchedule — date validation', () => {
    it('shows an alert when end is before start', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => document.querySelectorAll('input[type="date"]').length > 0);

        const dateInputs = document.querySelectorAll('input[type="date"]');
        const timeInputs = document.querySelectorAll('input[type="time"]');
        fireEvent.change(dateInputs[0], { target: { value: '2026-07-02' } }); // start
        fireEvent.change(timeInputs[0], { target: { value: '10:00' } });
        fireEvent.change(dateInputs[1], { target: { value: '2026-07-01' } }); // end before start
        fireEvent.change(timeInputs[1], { target: { value: '10:00' } });
        await user.click(screen.getByText(/next: media/i));
        expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/end date/i));
        alertSpy.mockRestore();
    });
});

describe('CreateEventSchedule — Next navigation', () => {
    it('calls updateListing and navigates to CREATE_EVENT_MEDIA', async () => {
        setCurrentDraftId(DRAFT_ID);
        let updateCalled = false;
        server.use(http.put(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/update/`, () => {
            updateCalled = true;
            return HttpResponse.json({ success: true, data: {} });
        }));
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText(/next: media/i));
        await user.click(screen.getByText(/next: media/i));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_MEDIA'));
        expect(updateCalled).toBe(true);
    });

    it('shows error alert on API failure', async () => {
        setCurrentDraftId(DRAFT_ID);
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        server.use(http.put(`${BASE}/api/v1/partners/listings/${DRAFT_ID}/update/`, () =>
            HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Listing is locked' } }, { status: 400 })));
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText(/next: media/i));
        await user.click(screen.getByText(/next: media/i));
        await waitFor(() => expect(alertSpy).toHaveBeenCalled());
        alertSpy.mockRestore();
    });
});

