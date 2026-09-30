import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { invalidatePortalSummary } from '../../api/portalSummary';
import { ApprovalGate, isApprovalError } from '../ApprovalGate';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

const partnerIs = (data: Record<string, unknown>) =>
    server.use(http.get(`${BASE}/api/v1/partner/me/`, () => HttpResponse.json({ success: true, data })));

function renderGate(feature = 'Coupons') {
    return render(
        <ApprovalGate feature={feature} onNavigate={mockNavigate}>
            <div>Coupons screen</div>
        </ApprovalGate>
    );
}

beforeEach(() => {
    mockNavigate.mockClear();
    // Partner reads are memoised app-wide — each case needs its own fetch.
    invalidatePortalSummary();
});

describe('ApprovalGate', () => {
    it('renders the screen for an approved partner', async () => {
        partnerIs({ id: 1, status: 'approved', is_verified: true });
        renderGate();
        await waitFor(() => expect(screen.getByText('Coupons screen')).toBeInTheDocument());
    });

    it('blocks a pending partner and points them at the documents they still owe', async () => {
        partnerIs({ id: 1, status: 'activated_limited', is_verified: false });
        renderGate();

        await waitFor(() => expect(screen.getByText(/Coupons unlock once TLB approves your profile/i)).toBeInTheDocument());
        expect(screen.queryByText('Coupons screen')).not.toBeInTheDocument();
        expect(screen.getByText(/Identity & tax/i)).toBeInTheDocument();
        expect(screen.getByText(/Bank account/i)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /Upload documents/i }));
        expect(mockNavigate).toHaveBeenCalledWith('DOCUMENTS');
    });

    it('tells an under-review partner to wait instead of re-uploading', async () => {
        partnerIs({ id: 1, status: 'under_review', is_verified: false });
        renderGate('Analytics');

        await waitFor(() => expect(screen.getByText(/Your documents are with the TLB team/i)).toBeInTheDocument());
        expect(screen.queryByText(/Identity & tax/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Review documents/i })).toBeInTheDocument();
    });

    it('fails open when the partner status cannot be read', async () => {
        server.use(http.get(`${BASE}/api/v1/partner/me/`, () => HttpResponse.error()));
        renderGate();
        await waitFor(() => expect(screen.getByText('Coupons screen')).toBeInTheDocument());
    });
});

describe('isApprovalError', () => {
    it('recognises the backend’s approved-partner refusals', () => {
        expect(isApprovalError('This feature requires a fully approved partner account.')).toBe(true);
        expect(isApprovalError(new Error('Partner is not approved'))).toBe(true);
        expect(isApprovalError({ message: 'Forbidden (HTTP 403)' })).toBe(true);
    });

    it('recognises a 403 whatever the wording — the status is what counts', () => {
        // DRF's default refusal used to slip through prose-only matching, which
        // is why the notice appeared on some screens and not others.
        expect(isApprovalError({ status: 403, message: 'You do not have permission to perform this action.' })).toBe(true);
        expect(isApprovalError({ status: 403, message: 'Something entirely different' })).toBe(true);
        expect(isApprovalError({ status: 500, message: 'Server error' })).toBe(false);
    });

    it('leaves real outages alone, so they still read as errors', () => {
        expect(isApprovalError('Failed to load coupons.')).toBe(false);
        expect(isApprovalError(new Error('Network request failed'))).toBe(false);
        expect(isApprovalError(null)).toBe(false);
        expect(isApprovalError(undefined)).toBe(false);
    });
});

describe('ApprovalGate — transient read failures', () => {
    it('retries once before falling back to letting the screen through', async () => {
        let calls = 0;
        server.use(
            http.get(`${BASE}/api/v1/partner/me/`, () => {
                calls += 1;
                // First read fails the way a 429 / mid-refresh read does.
                if (calls === 1) return HttpResponse.error();
                return HttpResponse.json({ success: true, data: { id: 1, status: 'activated_limited', is_verified: false } });
            })
        );
        renderGate();

        // Without the retry this rendered the screen and left the partner on a raw 403.
        await waitFor(() => expect(screen.getByText(/Coupons unlock once TLB approves your profile/i)).toBeInTheDocument(), {
            timeout: 3000,
        });
        expect(calls).toBeGreaterThan(1);
    });
});
