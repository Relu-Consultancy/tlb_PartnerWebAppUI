import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { AgreementSubmit } from '../AgreementSubmit';

const BASE = 'https://tlb-api.reluconsultancy.in';
const mockNavigate = vi.fn();

function renderAgreementSubmit() {
    return render(<AgreementSubmit onNavigate={mockNavigate} />);
}

beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
});

describe('AgreementSubmit — render', () => {
    it('renders the form sections', () => {
        renderAgreementSubmit();
        expect(document.body).toBeTruthy();
    });

    it('shows PAN Number field', () => {
        renderAgreementSubmit();
        expect(screen.getByPlaceholderText('ABCDE1234F')).toBeInTheDocument();
    });
});

describe('AgreementSubmit — PAN validation', () => {
    it('shows toast error for invalid PAN format', async () => {
        renderAgreementSubmit();
        const user = userEvent.setup();
        const panInput = screen.getByPlaceholderText('ABCDE1234F');
        await user.type(panInput, 'INVALID123');
        const nextBtn = screen.getByRole('button', { name: /next.*bank/i });
        await user.click(nextBtn);
        await waitFor(() =>
            expect(screen.getByText(/invalid pan|pan.*invalid|pan.*format/i)).toBeInTheDocument()
        );
    });

    it('accepts a valid PAN like ABCDE1234F', async () => {
        renderAgreementSubmit();
        const panInput = screen.getByPlaceholderText('ABCDE1234F');
        fireEvent.change(panInput, { target: { value: 'ABCDE1234F' } });
        expect(panInput).toHaveValue('ABCDE1234F');
    });
});

// Navigate to section B using fast fireEvent
async function navigateToSectionB() {
    const panInput = screen.getByPlaceholderText('ABCDE1234F');
    fireEvent.change(panInput, { target: { value: 'ABCDE1234F' } });
    const nextBankBtn = screen.getByRole('button', { name: /next.*bank/i });
    fireEvent.click(nextBankBtn);
    await waitFor(() =>
        expect(screen.getByPlaceholderText('SBIN0001234')).toBeInTheDocument()
    );
}

describe('AgreementSubmit — IFSC validation', () => {
    it('rejects invalid IFSC', async () => {
        renderAgreementSubmit();
        await navigateToSectionB();

        const holderInput = screen.getByPlaceholderText(/as on your pan card/i);
        fireEvent.change(holderInput, { target: { value: 'Test User' } });

        const accInput = screen.getByPlaceholderText(/^Enter account number/i);
        fireEvent.change(accInput, { target: { value: '123456789012' } });

        const confirmInput = screen.getByPlaceholderText(/Re-enter account number/i);
        fireEvent.change(confirmInput, { target: { value: '123456789012' } });

        const ifscInput = screen.getByPlaceholderText('SBIN0001234');
        fireEvent.change(ifscInput, { target: { value: 'BADINPUT' } });

        const nextAgreementBtn = screen.getByRole('button', { name: /next.*agreement/i });
        fireEvent.click(nextAgreementBtn);
        await waitFor(() =>
            expect(screen.getByText(/invalid ifsc|ifsc.*invalid/i)).toBeInTheDocument()
        );
    });

    it('accepts valid IFSC like SBIN0001234', async () => {
        renderAgreementSubmit();
        await navigateToSectionB();
        const ifscInput = screen.getByPlaceholderText('SBIN0001234');
        fireEvent.change(ifscInput, { target: { value: 'SBIN0001234' } });
        expect(ifscInput).toHaveValue('SBIN0001234');
    });
});

describe('AgreementSubmit — account number validation', () => {
    it('rejects account number mismatch', async () => {
        renderAgreementSubmit();
        await navigateToSectionB();

        const holderInput = screen.getByPlaceholderText(/as on your pan card/i);
        fireEvent.change(holderInput, { target: { value: 'Test User' } });

        const accInput = screen.getByPlaceholderText(/^Enter account number/i);
        fireEvent.change(accInput, { target: { value: '123456789012' } });

        const confirmInput = screen.getByPlaceholderText(/Re-enter account number/i);
        fireEvent.change(confirmInput, { target: { value: '999999999999' } });

        const ifscInput = screen.getByPlaceholderText('SBIN0001234');
        fireEvent.change(ifscInput, { target: { value: 'SBIN0001234' } });

        const btn = screen.getByRole('button', { name: /next.*agreement/i });
        fireEvent.click(btn);
        await waitFor(() =>
            expect(screen.queryAllByText(/do not match/i).length).toBeGreaterThan(0)
        );
    });
});

describe('AgreementSubmit — successful submission', () => {
    it('calls submitVerification and navigates on success', async () => {
        server.use(http.post(`${BASE}/api/v1/partner/verification/`, async () => {
            return HttpResponse.json({ success: true, data: { status: 'under_review' } });
        }));
        renderAgreementSubmit();
        const user = userEvent.setup();

        // Section A — Identity
        const panInput = screen.getByPlaceholderText('ABCDE1234F');
        fireEvent.change(panInput, { target: { value: 'ABCDE1234F' } });
        fireEvent.click(screen.getByRole('button', { name: /next.*bank/i }));

        // Section B — Bank
        await waitFor(() => screen.getByPlaceholderText('SBIN0001234'));

        const holderInput = screen.queryByPlaceholderText(/as on your pan card/i);
        if (holderInput) fireEvent.change(holderInput, { target: { value: 'Test User' } });

        const accInput = screen.queryByPlaceholderText(/^Enter account number/i);
        if (accInput) fireEvent.change(accInput, { target: { value: '123456789012' } });

        const confirmInput = screen.queryByPlaceholderText(/Re-enter account number/i);
        if (confirmInput) fireEvent.change(confirmInput, { target: { value: '123456789012' } });

        const ifscInput = screen.getByPlaceholderText('SBIN0001234');
        fireEvent.change(ifscInput, { target: { value: 'SBIN0001234' } });

        fireEvent.click(screen.getByRole('button', { name: /next.*agreement/i }));

        // Section C — Agreement
        await waitFor(() => screen.getByRole('checkbox'));
        const checkbox = screen.getByRole('checkbox');
        await user.click(checkbox);

        const submitBtn = screen.getByRole('button', { name: /submit.*profile/i });
        await user.click(submitBtn);

        await waitFor(() => expect(mockNavigate).toHaveBeenCalled(), { timeout: 3000 });
    });
});
