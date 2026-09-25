import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
    { ignores: ['dist', 'node_modules', 'coverage', 'scripts/**'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            // Classic hooks rules only — v7's "recommended" config bundles the full
            // React Compiler-readiness rule set (static-components, purity,
            // set-state-in-effect, immutability, …), which would require large
            // architectural refactors across the codebase rather than being a
            // lint-adoption concern. Keep just the two universally-agreed rules.
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            // Vite's fast-refresh boundary check — warn only, some files
            // intentionally export non-component helpers alongside a component.
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            // Large existing codebase relies on `any` at API/error boundaries
            // (backend response shapes, catch blocks) — keep it visible but non-blocking.
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        },
    },
    eslintConfigPrettier
);
