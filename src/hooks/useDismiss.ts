import { useEffect, useRef } from 'react';

/**
 * Closes a popover on an outside mousedown or Escape while `open` is true.
 * `onClose` is read through a ref so callers can pass inline functions.
 */
export const useDismiss = (
    ref: { current: HTMLElement | null },
    open: boolean,
    onClose: () => void,
): void => {
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current();
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeRef.current();
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, ref]);
};
