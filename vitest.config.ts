import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
        css: false,
        coverage: {
            reporter: ['text', 'lcov'],
            include: ['src/api/**', 'src/screens/events/**', 'src/screens/services/ServiceListings.tsx'],
        },
    },
});
