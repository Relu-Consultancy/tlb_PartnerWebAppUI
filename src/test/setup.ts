import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test (prevents handler leakage)
afterEach(() => {
    server.resetHandlers();
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
});

// Stop server after all tests
afterAll(() => server.close());
