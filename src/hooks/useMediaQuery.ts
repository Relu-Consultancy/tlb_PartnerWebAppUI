import { useEffect, useState } from 'react';

const query = (q: string): MediaQueryList | null =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(q) : null;

/**
 * Whether a CSS media query matches, kept live as the window resizes. For
 * layouts that need different markup (a table vs. cards), not just different
 * styles — hiding one copy with CSS would still render both. Without
 * matchMedia (tests, very old browsers) it reports false: the wide layout.
 */
export const useMediaQuery = (q: string): boolean => {
    const [matches, setMatches] = useState(() => query(q)?.matches ?? false);

    useEffect(() => {
        const mql = query(q);
        if (!mql) return;
        const onChange = () => setMatches(mql.matches);
        onChange();
        mql.addEventListener?.('change', onChange);
        return () => mql.removeEventListener?.('change', onChange);
    }, [q]);

    return matches;
};

/** Phones — Tailwind's `md` breakpoint is where the wide tables fit. */
export const PHONE_QUERY = '(max-width: 767px)';
