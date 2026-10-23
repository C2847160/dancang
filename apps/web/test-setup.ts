/**
 * Vitest setup for component tests.
 *
 * - Registers jest-dom matchers (toBeInTheDocument, toHaveValue, …).
 * - Unmounts rendered trees after every test. Testing Library only performs
 *   automatic cleanup when a global `afterEach` exists, which is not the case
 *   here (tests import from 'vitest' instead of using globals), so without this
 *   the second test would see the first test's DOM and queries would match
 *   twice.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
