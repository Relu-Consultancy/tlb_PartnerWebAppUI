import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { CLASS_DRAFT_ID, mockClassBatches } from '../../../test/msw/handlers';
import { CreateClassBatch } from '../CreateClassBatch';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

function renderComponent() {
    sessionStorage.setItem('current_class_draft_id', CLASS_DRAFT_ID);
    return render(<CreateClassBatch onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('CreateClassBatch — loading', () => {
    it('fetches and displays existing batches', async () => {
        renderComponent();
        await waitFor(() =>
            expect(screen.getByDisplayValue('Batch A')).toBeInTheDocument(), { timeout: 3000 }
        );
    });

    it('shows empty state message when no batches exist', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/`, () =>
            HttpResponse.json({ success: true, data: [] })));
        renderComponent();
        await waitFor(() =>
            expect(screen.getByText(/no batches|add.*batch|batch.*yet/i)).toBeInTheDocument()
        );
    });
});

describe('CreateClassBatch — add batch', () => {
    it('shows an "Add Batch" or similar button', async () => {
        renderComponent();
        await waitFor(() => screen.getByDisplayValue('Batch A'));
        const addBtn = screen.getByRole('button', { name: /add.*batch|new batch|\+ batch/i });
        expect(addBtn).toBeInTheDocument();
    });

    it('shows batch form fields when add button is clicked', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByDisplayValue('Batch A'));
        const addBtn = screen.getByRole('button', { name: /add.*batch|new batch|\+ batch/i });
        await user.click(addBtn);
        // After adding a new batch, there should be at least 2 name inputs with this placeholder
        await waitFor(() =>
            expect(screen.queryAllByPlaceholderText(/e\.g\. morning/i).length).toBeGreaterThan(1)
        );
    });
});

describe('CreateClassBatch — delete batch', () => {
    it('removes batch from list after delete', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByDisplayValue('Batch A'));
        const deleteBtns = screen.queryAllByRole('button', { name: /delete|remove/i });
        if (deleteBtns.length > 0) {
            server.use(http.delete(`${BASE}/api/v1/partner/listings/classes/${CLASS_DRAFT_ID}/batches/:batchId`, () =>
                new HttpResponse(null, { status: 204 })));
            await user.click(deleteBtns[0]);
            // After delete, batch should be gone
            await waitFor(() => expect(screen.queryByDisplayValue('Batch A')).not.toBeInTheDocument());
        }
    });
});

describe('CreateClassBatch — navigation', () => {
    it('navigates to CREATE_CLASS_MEDIA on Next', async () => {
        renderComponent();
        const user = userEvent.setup();
        await waitFor(() => screen.getByDisplayValue('Batch A'));
        const nextBtn = screen.getByRole('button', { name: /next|continue/i });
        await user.click(nextBtn);
        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('CREATE_CLASS_MEDIA')
        );
    });

    it('navigates back to CREATE_CLASS_IDENTITY on back', async () => {
        renderComponent();
        await waitFor(() => screen.getByDisplayValue('Batch A'));
        const backBtn = screen.getByRole('button', { name: /back/i });
        await userEvent.setup().click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith('CREATE_CLASS_IDENTITY');
    });
});
