import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
        css: false,
        // The suite includes whole-app integration tests; under a full parallel run
        // the machine saturates and the 5s default made unrelated tests flake.
        testTimeout: 20000,
        coverage: {
            reporter: ['text', 'lcov'],
            include: ['src/api/**', 'src/screens/events/**', 'src/screens/services/ServiceListings.tsx'],
        },
    },
});
