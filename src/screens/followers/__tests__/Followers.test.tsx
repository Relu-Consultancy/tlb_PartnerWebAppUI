import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import Followers from '../Followers';

const BASE = 'https://tlb-api.reluconsultancy.in';

const defaultProps = {
    onNavigate: vi.fn(),
    onOpenSidebar: vi.fn(),
};

beforeEach(() => {
    sessionStorage.clear();
});

describe('Followers screen', () => {
    it('loads and shows the total follower count', async () => {
        render(<Followers {...defaultProps} />);
        await waitFor(() => expect(screen.getByText('87')).toBeInTheDocument());
        expect(screen.getByText(/total followers/i)).toBeInTheDocument();
    });

    it('renders follower rows from the API (tolerating name / full_name shapes)', async () => {
        render(<Followers {...defaultProps} />);
        await waitFor(() => expect(screen.getByText('Aarav Mehta')).toBeInTheDocument());
        expect(screen.getByText('Diya Kapoor')).toBeInTheDocument();
    });

    it('filters followers by search query', async () => {
        const user = userEvent.setup();
        render(<Followers {...defaultProps} />);
        await waitFor(() => screen.getByText('Aarav Mehta'));
        await user.type(screen.getByPlaceholderText(/search followers/i), 'Diya');
        expect(screen.queryByText('Aarav Mehta')).not.toBeInTheDocument();
        expect(screen.getByText('Diya Kapoor')).toBeInTheDocument();
    });

    it('shows an empty state when there are no followers', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/:id/followers/`, () =>
                HttpResponse.json({ success: true, data: [] })),
            http.get(`${BASE}/api/v1/partner/:id/followers/count/`, () =>
                HttpResponse.json({ success: true, data: { follower_count: 0 } })),
        );
        render(<Followers {...defaultProps} />);
        await waitFor(() => expect(screen.getByText(/no followers yet/i)).toBeInTheDocument());
    });

    it('surfaces an error with a retry action when loading fails', async () => {
        server.use(
            http.get(`${BASE}/api/v1/partner/me/`, () =>
                HttpResponse.json({ error: { message: 'boom' } }, { status: 500 })),
        );
        render(<Followers {...defaultProps} />);
        await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument());
    });
});
