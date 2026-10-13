import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppSubmitted } from '../AppSubmitted';

// Once an application is submitted there's no going back to Registration —
// a header back arrow here let partners re-open (and re-submit) the form.
describe('AppSubmitted', () => {
    it('has no back button', () => {
        render(<AppSubmitted onNavigate={vi.fn()} />);
        expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument();
    });

    it('still lets the partner continue to the dashboard', () => {
        const onNavigate = vi.fn();
        render(<AppSubmitted onNavigate={onNavigate} />);
        screen.getByRole('button', { name: /go to dashboard/i }).click();
        expect(onNavigate).toHaveBeenCalledWith('HOME');
        expect(onNavigate).not.toHaveBeenCalledWith('REGISTRATION');
    });
});
