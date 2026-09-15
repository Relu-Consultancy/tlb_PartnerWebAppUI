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
        expect(screen.getByText('followers')).toBeInTheDocument();
    });

    it('renders follower rows from the API', async () => {
        render(<Followers {...defaultProps} />);
        await waitFor(() => expect(screen.getByText('Aarav Mehta')).toBeInTheDocument());
        expect(screen.getByText('Diya Kapoor')).toBeInTheDocument();
    });

    it('filters followers by search query', async () => {
        const user = userEvent.setup();
        render(<Followers {...defaultProps} />);
        await waitFor(() => screen.getByText('Aarav Mehta'));
        await user.type(screen.getByPlaceholderText(/search followers/i), 'Diya');
        await waitFor(() => expect(screen.queryByText('Aarav Mehta')).not.toBeInTheDocument());
        expect(screen.getByText('Diya Kapoor')).toBeInTheDocument();
    });

    it('shows an empty state when there are no followers', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/followers/`, () =>
            HttpResponse.json({ success: true, data: { count: 0, page: 1, page_size: 20, next: null, previous: null, results: [] } })));
        render(<Followers {...defaultProps} />);
        await waitFor(() => expect(screen.getByText(/no followers yet/i)).toBeInTheDocument());
    });

    it('surfaces an error with a retry action when loading fails', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/followers/`, () =>
            HttpResponse.json({ error: { message: 'boom' } }, { status: 500 })));
        render(<Followers {...defaultProps} />);
        await waitFor(() => expect(screen.getByText(/boom/i)).toBeInTheDocument());
    });
});
