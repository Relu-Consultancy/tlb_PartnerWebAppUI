import React from 'react';
import { describe, it, expect } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { toast, Toaster, ToastContainer, useToasts } from '../Toast';

const DUMP = "{'email': [ErrorDetail(string='This field may not be blank.', code='blank')]}";

describe('toasts never show a raw backend validation dump', () => {
    it('global toast.error', () => {
        render(<Toaster />);
        act(() => {
            toast.error(DUMP);
        });
        expect(screen.getByText('Please fill in Email.')).toBeInTheDocument();
        expect(screen.queryByText(/ErrorDetail/)).not.toBeInTheDocument();
    });

    it('screen-local showToast (auth and onboarding screens)', () => {
        const { result } = renderHook(() => useToasts());
        act(() => {
            result.current.showToast(DUMP, 'error');
        });
        render(<ToastContainer toasts={result.current.toasts} onDismiss={() => {}} />);
        expect(screen.getAllByText('Please fill in Email.').length).toBeGreaterThan(0);
    });
});

describe('repeat taps do not stack identical toasts', () => {
    it('global toast: the same message twice shows once', () => {
        render(<Toaster />);
        act(() => {
            toast.warning('Add your bank account below to submit.');
            toast.warning('Add your bank account below to submit.');
        });
        expect(screen.getAllByText('Add your bank account below to submit.')).toHaveLength(1);
    });

    it('screen-local showToast: the same message twice shows once', () => {
        const { result } = renderHook(() => useToasts());
        act(() => {
            result.current.showToast('Please fill in Email.', 'error');
            result.current.showToast('Please fill in Email.', 'error');
        });
        expect(result.current.toasts).toHaveLength(1);
    });
});
