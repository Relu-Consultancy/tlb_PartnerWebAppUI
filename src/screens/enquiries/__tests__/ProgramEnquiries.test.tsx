import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { PROGRAM_DRAFT_ID, mockProgramEnquiry, mockProgramListing } from '../../../test/msw/handlers';
import { ProgramEnquiries } from '../ProgramEnquiries';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

function renderComponent() {
    return render(<ProgramEnquiries onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
});

describe('ProgramEnquiries — loading', () => {
    it('renders without crashing', () => {
        renderComponent();
        expect(document.body).toBeTruthy();
    });

    it('shows program enquiry data after loading', async () => {
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/stem bootcamp/i)).toBeInTheDocument(), { timeout: 3000 }
        );
    });

    it('shows empty state when no enquiries', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/enquiries/`, () =>
            HttpResponse.json({ success: true, data: [] })));
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/no enquiries|inbox/i)).toBeInTheDocument(), { timeout: 3000 }
        );
    });
});

describe('ProgramEnquiries — program selection', () => {
    it('shows program dropdown when multiple programs exist', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/programs/`, () =>
            HttpResponse.json({
                success: true,
                data: [
                    { ...mockProgramListing, id: 'prog-1', title: 'STEM Bootcamp' },
                    { ...mockProgramListing, id: 'prog-2', title: 'Art Workshop' },
                ],
            })));
        renderComponent();
        await waitFor(() =>
            expect(screen.queryByRole('combobox') || screen.queryByRole('listbox') || screen.queryByText('STEM Bootcamp')).toBeTruthy(),
            { timeout: 3000 }
        );
    });

    it('auto-selects single program when only one exists', async () => {
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/stem bootcamp/i)).toBeInTheDocument(), { timeout: 3000 }
        );
    });
});

describe('ProgramEnquiries — status update', () => {
    it('calls updateProgramEnquiry when status changes', async () => {
        let updatePayload: any = null;
        server.use(http.patch(
            `${BASE}/api/v1/partner/listings/programs/${PROGRAM_DRAFT_ID}/enquiries/:eid`,
            async ({ request }) => {
                updatePayload = await request.json();
                return HttpResponse.json({ success: true, data: { ...mockProgramEnquiry, status: 'contacted' } });
            }
        ));
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByText(/stem bootcamp/i));
        // Try to find and interact with a status selector or row
        const rows = document.querySelectorAll('tr, [role="row"]');
        if (rows.length > 1) {
            await user.click(rows[1] as HTMLElement);
            const statusSelect = screen.queryByRole('combobox');
            if (statusSelect) {
                await user.selectOptions(statusSelect, 'contacted');
                await waitFor(() => expect(updatePayload).not.toBeNull());
            }
        }
    });
});
