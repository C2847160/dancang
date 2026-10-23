import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest runs component tests in jsdom, which needs a DOM implementation the
 * Vite dev/build config does not provide. Kept as a separate file so the
 * browser-facing config (proxy, plugins) stays untouched by test concerns.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
  },
});
