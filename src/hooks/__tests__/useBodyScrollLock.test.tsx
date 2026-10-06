import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortalModal } from '../../components/portal';
import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from '../useBodyScrollLock';

describe('useBodyScrollLock (QA: the page behind a pop-up kept scrolling)', () => {
    it('locks page scroll while a modal is open and restores it on close', async () => {
        const Harness = () => {
            const [open, setOpen] = React.useState(false);
            return (
                <>
                    <button onClick={() => setOpen(true)}>open</button>
                    <PortalModal open={open} onClose={() => setOpen(false)} title="Preview">
                        <button onClick={() => setOpen(false)}>close</button>
                    </PortalModal>
                </>
            );
        };
        const user = userEvent.setup();
        render(<Harness />);
        expect(document.body.style.overflow).toBe('');

        await user.click(screen.getByText('open'));
        expect(document.body.style.overflow).toBe('hidden');

        await user.click(screen.getByText('close'));
        expect(document.body.style.overflow).toBe('');
    });

    it('stays locked until the LAST of several nested overlays closes', () => {
        const outer = renderHook(({ on }) => useBodyScrollLock(on), { initialProps: { on: true } });
        const inner = renderHook(({ on }) => useBodyScrollLock(on), { initialProps: { on: true } });

        inner.rerender({ on: false });
        expect(document.body.style.overflow).toBe('hidden');

        outer.rerender({ on: false });
        expect(document.body.style.overflow).toBe('');
    });

    it('releases if the overlay unmounts while open (e.g. navigating away)', () => {
        const { unmount } = renderHook(() => useBodyScrollLock(true));
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('');
    });
});
