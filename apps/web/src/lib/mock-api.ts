/**
 * Built-in demo dataset for deployments without a backend.
 *
 * Used only when `IS_MOCK_MODE` is true (src/lib/api.ts). It exists so a static
 * deployment stays fully operable: the login form accepts the demo account and
 * the user list renders a real row, with no network involved.
 */
import type { LoginRequest, User, UserListResponse } from '@repo/shared-types';

export const DEMO_EMAIL = 'ada@example.com';
export const DEMO_PASSWORD = 'password123';

const DEMO_USER: User = {
  id: 'usr_demo_1',
  email: DEMO_EMAIL,
  name: 'Ada Lovelace',
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** Small delay so the loading states are observable in the demo too. */
const MOCK_LATENCY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

/** Fake user list, shaped exactly like GET /api/users. */
export async function mockGetUsers(): Promise<UserListResponse> {
  await delay();
  return { items: [DEMO_USER], total: 1 };
}

/**
 * Fake credential check, shaped exactly like POST /api/auth/login.
 * Throws the same message the real server returns on bad credentials.
 */
export async function mockLogin(input: LoginRequest): Promise<User> {
  await delay();
  if (input.email !== DEMO_EMAIL || input.password !== DEMO_PASSWORD) {
    throw new Error('Invalid email or password');
  }
  return DEMO_USER;
}
