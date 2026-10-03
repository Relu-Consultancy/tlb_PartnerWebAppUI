import { useCallback, useEffect, useRef } from 'react';

/**
 * Guards async loads against out-of-order responses. Call the returned
 * function when a request starts; the `isCurrent()` it hands back turns false
 * as soon as a newer request begins or the component unmounts.
 *
 * Without it, switching the reporting period (or a filter) quickly let the
 * slower, superseded response land last and overwrite fresher data — e.g.
 * 7-day revenue shown under a "30 days" label.
 */
export const useLatestRequest = () => {
    const seq = useRef(0);

    // Unmounting supersedes everything still in flight.
    useEffect(
        () => () => {
            seq.current += 1;
        },
        []
    );

    return useCallback(() => {
        const id = ++seq.current;
        return () => id === seq.current;
    }, []);
};
