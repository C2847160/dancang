/**
 * ESLint flat config (root).
 *
 * Enforces the architecture rules from spec.md:
 *  - strict TypeScript via typescript-eslint
 *  - React + Hooks rules for apps/web
 *  - eslint-plugin-boundaries: hard dependency direction (R3.x)
 *
 * All ESLint plugins are declared as root devDependencies so they resolve
 * from this config file's directory regardless of which package is linted.
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.d.ts',
      '.trae/**',
    ],
  },

  // Base JS rules (all files).
  {
    ...js.configs.recommended,
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 },
    },
  },

  // TypeScript rules (all .ts/.tsx).
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ['**/*.{ts,tsx}'],
  })),

  // React + Hooks (apps/web only).
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React 17+ JSX runtime: no React import required.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },

  // Boundaries: enforce dependency direction (spec.md R3.1–R3.4).
  // In eslint-plugin-boundaries v5, imports within the same package are
  // always allowed; only cross-package imports are checked against the
  // `allow` lists below. `default: 'disallow'` makes anything not listed
  // an error.
  {
    plugins: { boundaries },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'web-app', allow: ['shared-types', 'shared-utils'] },
            { from: 'server-app', allow: ['shared-types', 'shared-utils'] },
            { from: 'shared-types', allow: [] },
            { from: 'shared-utils', allow: ['shared-types'] },
          ],
        },
      ],
    },
    settings: {
      // Root must be the repo root so patterns resolve regardless of which
      // workspace runs `eslint .`.
      'boundaries/root-path': import.meta.dirname,
      // Use the bundled node resolver but teach it about TS extensions so
      // extensionless imports (e.g. `./foo`, `@repo/shared-types`) resolve
      // to actual .ts/.tsx files and can be matched to an element type.
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      'boundaries/elements': [
        { type: 'web-app', pattern: 'apps/web', mode: 'folder' },
        { type: 'server-app', pattern: 'apps/server', mode: 'folder' },
        { type: 'shared-types', pattern: 'packages/shared-types', mode: 'folder' },
        { type: 'shared-utils', pattern: 'packages/shared-utils', mode: 'folder' },
      ],
    },
  },

  // MUST be last: disables every formatting rule that overlaps Prettier.
  // Otherwise ESLint and Prettier will fight, and husky pre-commit will
  // fail on harmless formatting-only edits.
  prettier,
];
