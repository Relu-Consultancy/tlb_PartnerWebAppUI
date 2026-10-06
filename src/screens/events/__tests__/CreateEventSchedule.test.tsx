import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { DRAFT_ID } from '../../../test/msw/handlers';
import { CreateEventSchedule } from '../CreateEventSchedule';
import { setCurrentDraftId } from '../../../api/listings';
import { toast } from '../../../components/ui';

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
        await waitFor(() => expect(screen.getByText(/no active draft/i)).toBeInTheDocument());
    });

    it('shows loading spinner initially when draft exists', () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventSchedule {...props} />);
        expect(screen.getByText(/loading draft/i)).toBeInTheDocument();
    });

    it('shows error message on API failure', async () => {
        setCurrentDraftId(DRAFT_ID);
        server.use(
            http.get(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/`, () =>
                HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, { status: 404 })
            )
        );
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => expect(screen.getByText(/listing not found/i)).toBeInTheDocument());
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

    it('shows Free event selected when draft has price_type free', async () => {
        setCurrentDraftId(DRAFT_ID);
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => {
            const freeBtn = screen.getByText('Free event').closest('button');
            expect(freeBtn?.className).toContain('is-on');
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
    it('shows ticket tiers section when Paid event is selected', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Free event'));
        await user.click(screen.getByText('Paid event'));
        expect(screen.getByText(/ticket tiers/i)).toBeInTheDocument();
    });

    it('shows warning banner when price_type is switched', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid event'));
        await user.click(screen.getByText('Paid event'));
        expect(screen.getByText(/switching pricing type/i)).toBeInTheDocument();
    });

    it('hides capacity field when Paid event is selected', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid event'));
        await user.click(screen.getByText('Paid event'));
        expect(screen.queryByPlaceholderText(/e\.g\. 100/i)).not.toBeInTheDocument();
    });
});

describe('CreateEventSchedule — ticket management', () => {
    it('can add a new ticket tier', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid event'));
        await user.click(screen.getByText('Paid event'));
        await user.click(screen.getByText(/add ticket tier/i));
        const tiers = screen.getAllByText(/tier \d/i);
        expect(tiers.length).toBeGreaterThan(0);
    });

    it('can remove a ticket tier when multiple exist', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid event'));
        await user.click(screen.getByText('Paid event'));
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
        const toastSpy = vi.spyOn(toast, 'warning').mockImplementation(() => 0);
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => document.querySelectorAll('input[type="date"]').length > 0);

        const dateInputs = document.querySelectorAll('input[type="date"]');
        const timeInputs = document.querySelectorAll('input[type="time"]');
        fireEvent.change(dateInputs[0], { target: { value: '2026-07-02' } }); // start
        fireEvent.change(timeInputs[0], { target: { value: '10:00' } });
        fireEvent.change(dateInputs[1], { target: { value: '2026-07-01' } }); // end before start
        fireEvent.change(timeInputs[1], { target: { value: '10:00' } });
        await user.click(screen.getByText(/next: media/i));
        expect(toastSpy).toHaveBeenCalledWith(expect.stringMatching(/end date/i));
        toastSpy.mockRestore();
    });

    it('shows a friendly message (not the raw backend error) when the registration deadline is after the event start', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        const toastSpy = vi.spyOn(toast, 'warning').mockImplementation(() => 0);
        let updateCalled = false;
        server.use(
            http.patch(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/`, () => {
                updateCalled = true;
                return HttpResponse.json({ success: true, data: {} });
            })
        );
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => document.querySelectorAll('input[type="date"]').length > 0);

        const dateInputs = document.querySelectorAll('input[type="date"]');
        fireEvent.change(dateInputs[0], { target: { value: '2026-09-01' } }); // start
        fireEvent.change(dateInputs[1], { target: { value: '2026-09-10' } }); // end
        fireEvent.change(dateInputs[2], { target: { value: '2026-09-30' } }); // registration deadline
        await user.click(screen.getByText(/next: media/i));

        expect(toastSpy).toHaveBeenCalledWith('Registration deadline must be on or before the event start date.');
        // The bad request should never reach the backend — this is caught client-side.
        expect(updateCalled).toBe(false);
        toastSpy.mockRestore();
    });
});

describe('CreateEventSchedule — required fields', () => {
    it('lists missing start/end/capacity on Next and never calls the backend', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        const toastSpy = vi.spyOn(toast, 'warning').mockImplementation(() => 0);
        let updateCalled = false;
        server.use(
            http.patch(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/`, () => {
                updateCalled = true;
                return HttpResponse.json({ success: true, data: {} });
            })
        );
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => document.querySelectorAll('input[type="date"]').length > 0);

        const dateInputs = document.querySelectorAll('input[type="date"]');
        fireEvent.change(dateInputs[0], { target: { value: '' } });
        fireEvent.change(dateInputs[1], { target: { value: '' } });
        fireEvent.change(screen.getByPlaceholderText(/e\.g\. 100/i), { target: { value: '' } });
        await user.click(screen.getByText(/next: media/i));

        expect(toastSpy).toHaveBeenCalledWith('Please complete before continuing: Event start date, Event end date, Capacity.');
        expect(updateCalled).toBe(false);
        expect(mockNavigate).not.toHaveBeenCalled();
        toastSpy.mockRestore();
    });

    it('requires at least one complete ticket for a paid event', async () => {
        setCurrentDraftId(DRAFT_ID);
        const user = userEvent.setup();
        const toastSpy = vi.spyOn(toast, 'warning').mockImplementation(() => 0);
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid event'));
        await user.click(screen.getByText('Paid event'));
        // The draft's existing Free Entry ticket loads with it — drop it so no tier is complete.
        await user.click(document.querySelector('button[aria-label="Remove ticket"]') as HTMLButtonElement);
        await user.click(screen.getByText(/next: media/i));
        expect(toastSpy).toHaveBeenCalledWith(expect.stringMatching(/At least 1 ticket/));
        expect(mockNavigate).not.toHaveBeenCalled();
        toastSpy.mockRestore();
    });
});

describe('CreateEventSchedule — Next navigation', () => {
    it('calls updateListing and navigates to CREATE_EVENT_MEDIA', async () => {
        setCurrentDraftId(DRAFT_ID);
        let updateCalled = false;
        server.use(
            http.patch(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/`, () => {
                updateCalled = true;
                return HttpResponse.json({ success: true, data: {} });
            })
        );
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText(/next: media/i));
        await user.click(screen.getByText(/next: media/i));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_MEDIA'));
        expect(updateCalled).toBe(true);
    });

    it('shows error alert on API failure', async () => {
        setCurrentDraftId(DRAFT_ID);
        const toastSpy = vi.spyOn(toast, 'error').mockImplementation(() => 0);
        server.use(
            http.patch(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/`, () =>
                HttpResponse.json({ error: { code: 'LISTING_LOCKED', message: 'Listing is locked' } }, { status: 400 })
            )
        );
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText(/next: media/i));
        await user.click(screen.getByText(/next: media/i));
        await waitFor(() => expect(toastSpy).toHaveBeenCalled());
        toastSpy.mockRestore();
    });
});

describe('CreateEventSchedule — a fresh event switched to Paid (QA: "Ticket not found")', () => {
    // As live: a new draft is free and carries the backend's automatic
    // "Free Entry" ticket (id 1, in the default fixture). Changing the price
    // type makes the backend clear every ticket — so ticket 1 is gone by the
    // time the tickets are saved.
    const backend = () => {
        const state = { cleared: false, puts: [] as number[], posts: [] as any[], failPostNamed: '' as string };
        server.use(
            http.patch(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/`, async ({ request }) => {
                const body = (await request.json()) as any;
                if (body.price_type === 'paid') state.cleared = true;
                return HttpResponse.json({ success: true, data: {} });
            }),
            http.put(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/tickets/:ticketId/`, ({ params }) => {
                const id = Number(params.ticketId);
                state.puts.push(id);
                if (id === 1 && state.cleared) {
                    return HttpResponse.json(
                        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Ticket not found.' } },
                        { status: 404 }
                    );
                }
                return HttpResponse.json({ success: true, data: { id } });
            }),
            http.post(`${BASE}/api/v1/partner/listings/events/${DRAFT_ID}/tickets/`, async ({ request }) => {
                const body = (await request.json()) as any;
                state.posts.push(body);
                if (state.failPostNamed && body.name === state.failPostNamed) {
                    state.failPostNamed = '';
                    return HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Temporary failure' } }, { status: 500 });
                }
                return HttpResponse.json({ success: true, data: { id: 100 + state.posts.length, ...body } }, { status: 201 });
            })
        );
        return state;
    };

    const editTier = async (user: ReturnType<typeof userEvent.setup>, index: number, name: string, price: string, qty: string) => {
        const names = screen.getAllByPlaceholderText(/e\.g\. General Admission/i);
        await user.clear(names[index]);
        await user.type(names[index], name);
        await user.clear(screen.getAllByPlaceholderText('499')[index]);
        await user.type(screen.getAllByPlaceholderText('499')[index], price);
        await user.clear(screen.getAllByPlaceholderText('50')[index]);
        await user.type(screen.getAllByPlaceholderText('50')[index], qty);
    };

    it('saves the tier instead of failing with "Ticket not found"', async () => {
        setCurrentDraftId(DRAFT_ID);
        const state = backend();
        const toastError = vi.spyOn(toast, 'error').mockImplementation(() => 0);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid event'));
        await user.click(screen.getByText('Paid event'));
        // The screenshot: Tier 1 is the loaded Free Entry row, typed over.
        await editTier(user, 0, 'Entry free', '300', '23');
        await user.click(screen.getByText(/next: media/i));

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_MEDIA'));
        expect(toastError).not.toHaveBeenCalled();
        expect(state.puts).toEqual([1]); // tried the old id, got 404…
        expect(state.posts).toEqual([expect.objectContaining({ name: 'Entry free', price: 300, total_quantity: 23 })]); // …so created it
        toastError.mockRestore();
    });

    it('never creates a ticket twice when it is saved again after a failure', async () => {
        setCurrentDraftId(DRAFT_ID);
        const state = backend();
        state.failPostNamed = 'VIP'; // the second tier fails once
        const toastError = vi.spyOn(toast, 'error').mockImplementation(() => 0);
        const user = userEvent.setup();
        render(<CreateEventSchedule {...props} />);
        await waitFor(() => screen.getByText('Paid event'));
        await user.click(screen.getByText('Paid event'));
        await editTier(user, 0, 'Entry', '300', '23');
        await user.click(screen.getByText(/add ticket tier/i));
        await editTier(user, 1, 'VIP', '900', '5');

        await user.click(screen.getByText(/next: media/i));
        await waitFor(() => expect(toastError).toHaveBeenCalled());
        expect(mockNavigate).not.toHaveBeenCalledWith('CREATE_EVENT_MEDIA');

        await user.click(screen.getByText(/next: media/i));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('CREATE_EVENT_MEDIA'));
        expect(state.posts.filter((p) => p.name === 'Entry')).toHaveLength(1);
        expect(state.posts.filter((p) => p.name === 'VIP')).toHaveLength(2); // failed once, then saved
        toastError.mockRestore();
    });
});
