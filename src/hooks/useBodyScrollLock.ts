import { useEffect } from 'react';

// Shared across every overlay so nested ones (a confirm inside a modal) don't
// release the lock while an outer overlay is still open.
let activeLocks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

/**
 * Stops the page behind an overlay from scrolling while `active`.
 *
 * QA: with a pop-up open, the mouse wheel / touchpad scrolled the whole site in
 * the background. No overlay locked the body. The scrollbar's width is
 * replaced with padding so content doesn't jump sideways when it disappears.
 */
export const useBodyScrollLock = (active: boolean) => {
    useEffect(() => {
        if (!active) return;
        const body = document.body;
        if (activeLocks === 0) {
            const scrollbar = window.innerWidth - document.documentElement.clientWidth;
            saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
            body.style.overflow = 'hidden';
            if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
        }
        activeLocks += 1;
        return () => {
            activeLocks -= 1;
            if (activeLocks === 0 && saved) {
                body.style.overflow = saved.overflow;
                body.style.paddingRight = saved.paddingRight;
                saved = null;
            }
        };
    }, [active]);
};
