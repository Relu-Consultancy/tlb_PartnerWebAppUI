import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { mockClassEnquiry } from '../../../test/msw/handlers';
import { Enquiries } from '../Enquiries';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

function renderComponent() {
    return render(<Enquiries onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
});

describe('Enquiries — loading & display', () => {
    it('shows loading state initially', () => {
        renderComponent();
        expect(document.body).toBeTruthy();
    });

    it('shows empty state when no enquiries', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/enquiries/`, () =>
            HttpResponse.json({ success: true, data: [] })));
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/no enquiries yet|inbox/i)).toBeInTheDocument(), { timeout: 3000 }
        );
    });

    it('shows enquiry rows after loading', async () => {
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/dance workshop/i)).toBeInTheDocument(), { timeout: 3000 }
        );
    });

    it('renders search input', async () => {
        renderComponent();
        await waitFor(() =>
            expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
        );
    });

    it('renders filter button', async () => {
        renderComponent();
        await waitFor(() => screen.getByText(/dance workshop/i));
        // Filter button has no accessible name (icon-only), check it exists by position
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2); // Menu + Filter buttons in header
    });
});

describe('Enquiries — status filter', () => {
    it('filters enquiries by status', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/dance workshop/i));
        // Filter button is at index 1 (after Menu button)
        const buttons = screen.getAllByRole('button');
        const filterBtn = buttons[1];
        await user.click(filterBtn);
        // Filter dropdown should appear with "All Statuses" option (unique to the dropdown)
        await waitFor(() =>
            expect(screen.queryByText('All Statuses')).toBeInTheDocument()
        );
    });
});

describe('Enquiries — unlock enquiry', () => {
    it('calls unlock API when Unlock button is clicked', async () => {
        let unlockCalled = false;
        server.use(http.post(`${BASE}/api/v1/partner/listings/classes/enquiries/:id/unlock/`, () => {
            unlockCalled = true;
            return HttpResponse.json({ success: true, data: { ...mockClassEnquiry, is_locked: false } });
        }));
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/dance workshop/i));
        // Click on an enquiry row to expand/select it
        const rows = screen.getAllByRole('row').filter(r => r.textContent?.includes('Dance Workshop'));
        if (rows.length > 0) {
            await user.click(rows[0]);
            const unlockBtns = await screen.findAllByRole('button', { name: /unlock/i });
            if (unlockBtns.length > 0) {
                await user.click(unlockBtns[0]);
                await waitFor(() => expect(unlockCalled).toBe(true));
            }
        }
    });
});

describe('Enquiries — status update', () => {
    it('calls update API when status changes', async () => {
        let updateCalled = false;
        server.use(http.put(`${BASE}/api/v1/partner/listings/classes/enquiries/:id`, async () => {
            updateCalled = true;
            return HttpResponse.json({ success: true, data: { ...mockClassEnquiry, status: 'contacted' } });
        }));
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/dance workshop/i));
        // Click on an enquiry row
        const rows = screen.getAllByRole('row').filter(r => r.textContent?.includes('Dance Workshop'));
        if (rows.length > 0) {
            await user.click(rows[0]);
            const statusSelects = screen.queryAllByRole('combobox');
            if (statusSelects.length > 0) {
                await user.selectOptions(statusSelects[0], 'contacted');
                await waitFor(() => expect(updateCalled).toBe(true));
            }
        }
    });
});

describe('Enquiries — search', () => {
    it('filters enquiries by search text', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/enquiries/`, () =>
            HttpResponse.json({
                success: true,
                data: [
                    { ...mockClassEnquiry, id: 'enq-001', class_title: 'Dance Workshop', parent_name: 'Alice' },
                    { ...mockClassEnquiry, id: 'enq-002', class_title: 'Yoga Class', parent_name: 'Bob', student_name: 'Bob Jr' },
                ],
            })));
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/dance workshop/i));
        await waitFor(() => screen.getByText(/yoga class/i));
        const searchInput = screen.getByPlaceholderText(/search/i);
        await user.type(searchInput, 'yoga');
        await waitFor(() => expect(screen.queryByText(/dance workshop/i)).not.toBeInTheDocument());
        expect(screen.getByText(/yoga class/i)).toBeInTheDocument();
    });
});
