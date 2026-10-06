import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import { server } from './msw/server';

// findBy*/waitFor default to 1s, which a saturated parallel run regularly
// exceeds — the source of the "passes alone, fails in the full run" flakes.
configure({ asyncUtilTimeout: 4000 });

// ── jsdom polyfills for motion/react (framer-motion) ──
// motion's layout / in-view features touch these browser APIs which jsdom lacks.
if (typeof globalThis.IntersectionObserver === 'undefined') {
    class IO {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
            return [];
        }
        root = null;
        rootMargin = '';
        thresholds = [];
    }
    globalThis.IntersectionObserver = IO as unknown as typeof IntersectionObserver;
}

if (typeof globalThis.ResizeObserver === 'undefined') {
    class RO {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
}

// Start MSW before all tests
// 'error', not 'warn': an unmocked request used to pass straight through to the
// live production API — slow, flaky, and tests talking to prod. Mock it instead.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test (prevents handler leakage)
afterEach(() => {
    server.resetHandlers();
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
});

// Stop server after all tests
afterAll(() => server.close());
