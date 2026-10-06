import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppSubmitted } from '../AppSubmitted';
import { AppApproved } from '../AppApproved';

// "Contact Support" here was a button with no handler — it did nothing.
describe('onboarding status screens', () => {
    it.each([
        ['AppSubmitted', AppSubmitted],
        ['AppApproved', AppApproved],
    ])('%s has no dead Contact Support button', (_name, Screen) => {
        render(<Screen onNavigate={vi.fn()} />);
        expect(screen.queryByRole('button', { name: /Contact Support/i })).not.toBeInTheDocument();
        // Every remaining button actually does something.
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
});
