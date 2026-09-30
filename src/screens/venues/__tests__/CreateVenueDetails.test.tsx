import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { CreateVenueDetails } from '../CreateVenueDetails';
import { toast } from '../../../components/ui';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

function renderComponent() {
    return render(<CreateVenueDetails onNavigate={mockNavigate} onOpenSidebar={vi.fn()} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('CreateVenueDetails — mandatory field validation', () => {
    it('shows a clear, field-specific message (not a raw backend error) when only the name is filled', async () => {
        let draftCreated = false;
        server.use(
            http.post(`${BASE}/api/v1/partner/listings/venues/`, () => {
                draftCreated = true;
                return HttpResponse.json({ success: true, data: { id: 'new-draft' } }, { status: 201 });
            })
        );
        const warnSpy = vi.spyOn(toast, 'warning').mockImplementation(() => 0);
        const errorSpy = vi.spyOn(toast, 'error').mockImplementation(() => 0);
        const user = userEvent.setup();

        renderComponent();
        await waitFor(() => screen.getByPlaceholderText(/the wonder zone/i));
        await user.type(screen.getByPlaceholderText(/the wonder zone/i), 'My Test Venue');
        await user.click(screen.getByText(/next: occasions/i));

        await waitFor(() => expect(warnSpy).toHaveBeenCalled());
        const message = warnSpy.mock.calls[0][0] as string;
        // Field-specific, human-readable — names the actual missing fields.
        expect(message).toContain('Description');
        expect(message).toContain('Cover banner');
        expect(message).not.toContain('[object Object]');
        expect(message).not.toMatch(/VALIDATION_ERROR|ErrorDetail/);

        // The request should never reach the backend once client-side validation fails.
        expect(draftCreated).toBe(false);
        expect(errorSpy).not.toHaveBeenCalled();
    });
});

describe('CreateVenueDetails — language is required', () => {
    it('blocks Continue until a language is picked, and never reaches the backend', async () => {
        // Reported by QA: every other field could be filled and Continue still
        // went through with no language selected.
        let saved = false;
        server.use(
            http.post(`${BASE}/api/v1/partner/listings/venues/`, () => {
                saved = true;
                return HttpResponse.json({ success: true, data: { id: 'new-draft' } }, { status: 201 });
            })
        );
        const warnSpy = vi.spyOn(toast, 'warning').mockImplementation(() => 0);
        const user = userEvent.setup();

        renderComponent();
        await waitFor(() => screen.getByPlaceholderText(/the wonder zone/i));
        await user.type(screen.getByPlaceholderText(/the wonder zone/i), 'My Test Venue');
        await user.click(screen.getByText(/next: occasions/i));

        await waitFor(() => expect(warnSpy).toHaveBeenCalled());
        expect(saved).toBe(false);

        // Once the other fields are filled, the language message is what remains.
        expect(screen.getByRole('checkbox', { name: 'English' })).toBeInTheDocument();
    });
});
