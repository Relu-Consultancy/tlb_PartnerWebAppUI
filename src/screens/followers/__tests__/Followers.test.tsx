import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import Followers from '../Followers';

const BASE = 'https://tlb-api.reluconsultancy.in';

const mockNavigate = vi.fn();
const renderScreen = () => render(<Followers onNavigate={mockNavigate} />);

const listResponse = (results: unknown[], count = results.length) =>
    HttpResponse.json({ success: true, data: { count, page: 1, page_size: 20, next: null, previous: null, results } });

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('Followers — headline stats', () => {
    it('shows the server-wide total, not just the rows on screen', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByText('Aarav Mehta')).toBeInTheDocument());
        expect(screen.getByText('87')).toBeInTheDocument();
        // The footer carries the loaded-vs-total count, next to "Load more".
        expect(screen.getByText('Showing 2 of 87 followers')).toBeInTheDocument();
    });

    it('marks the 30-day count as a floor while older followers are still unloaded', async () => {
        // Newest-first, every loaded row inside the window, more pages to come →
        // the real number can only be "at least this many".
        const recent = new Date().toISOString();
        server.use(
            http.get(`${BASE}/api/v1/partner/followers/`, () =>
                listResponse([{ user_id: 'u1', full_name: 'Aarav Mehta', city: 'Mumbai', gender: 'male', followed_at: recent }], 87)
            )
        );
        renderScreen();
        await waitFor(() => expect(screen.getByText('1+')).toBeInTheDocument());
        expect(screen.getByText(/load more to see the rest/i)).toBeInTheDocument();
    });
});

describe('Followers — list and filters', () => {
    it('renders follower rows from the API', async () => {
        renderScreen();
        await waitFor(() => expect(screen.getByText('Aarav Mehta')).toBeInTheDocument());
        expect(screen.getByText('Diya Kapoor')).toBeInTheDocument();
        expect(screen.getByText('Pune')).toBeInTheDocument();
    });

    it('searches server-side after the debounce', async () => {
        const user = userEvent.setup();
        renderScreen();
        await waitFor(() => screen.getByText('Aarav Mehta'));
        await user.type(screen.getByPlaceholderText(/search followers/i), 'Diya');
        await waitFor(() => expect(screen.queryByText('Aarav Mehta')).not.toBeInTheDocument());
        expect(screen.getByText('Diya Kapoor')).toBeInTheDocument();
    });

    it('passes the gender filter to the API as a real query param', async () => {
        let requestedGender: string | null = null;
        server.use(
            http.get(`${BASE}/api/v1/partner/followers/`, ({ request }) => {
                requestedGender = new URL(request.url).searchParams.get('gender');
                return listResponse([
                    { user_id: 'u2', full_name: 'Diya Kapoor', city: 'Pune', gender: 'female', followed_at: '2026-06-25T10:00:00Z' },
                ]);
            })
        );
        const user = userEvent.setup();
        renderScreen();
        await waitFor(() => screen.getByText('Diya Kapoor'));
        await user.selectOptions(screen.getByLabelText('Filter by gender'), 'female');
        await waitFor(() => expect(requestedGender).toBe('female'));
    });
});

describe('Followers — detail', () => {
    it('opens a follower and shows their engagement and contact details', async () => {
        const user = userEvent.setup();
        renderScreen();
        await waitFor(() => screen.getByText('Aarav Mehta'));
        await user.click(screen.getByText('Aarav Mehta'));

        const dialog = await screen.findByRole('dialog');
        await waitFor(() => expect(within(dialog).getByText('aarav@example.com')).toBeInTheDocument());
        expect(within(dialog).getByText('Returning customer')).toBeInTheDocument();
        expect(within(dialog).getByText('Bookings with you')).toBeInTheDocument();
    });
});

describe('Followers — empty and error states', () => {
    it('shows an empty state when there are no followers', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/followers/`, () => listResponse([], 0)));
        renderScreen();
        await waitFor(() => expect(screen.getByText(/no followers yet/i)).toBeInTheDocument());
    });

    it('surfaces an error with a retry action when loading fails', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/followers/`, () => HttpResponse.json({ error: { message: 'boom' } }, { status: 500 })));
        renderScreen();
        await waitFor(() => expect(screen.getByText(/boom/i)).toBeInTheDocument());
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
});
