/**
 * Single place where the web app talks to the API.
 *
 * Two modes, decided deterministically at build time (never by sniffing errors,
 * which is unreliable: a static host answering `/api/*` with index.html looks
 * like a successful response):
 *
 * - real: `VITE_API_BASE_URL` is set, or the dev server proxy is used in
 *   development. Requests go to `${API_BASE_URL}/api/...` and server errors are
 *   surfaced as-is.
 * - demo: production build with no `VITE_API_BASE_URL`, or
 *   `VITE_USE_MOCK_API=true`. No network at all, so a frontend-only deployment
 *   can never white-screen and still demonstrates the login flow.
 */
import type {
  ApiErrorBody,
  LoginRequest,
  LoginResponse,
  User,
  UserListResponse,
} from '@repo/shared-types';
import { mockGetUsers, mockLogin } from './mock-api';

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Backend origin without a trailing slash; empty means same-origin (dev proxy). */
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

/**
 * In development an empty base means same-origin, so the Vite proxy reaches the
 * real server on :3100. In a production build an empty base means there is no
 * backend to reach, hence the demo dataset.
 */
export const IS_MOCK_MODE =
  import.meta.env.VITE_USE_MOCK_API === 'true' || (import.meta.env.PROD && API_BASE_URL === '');

/** Failure that carries the server's message and (when available) its status. */
export class ApiError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Reads `error.message` out of the shared envelope, falling back to `fallback`. */
function readErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const { error } = body as ApiErrorBody;
    if (typeof error.message === 'string' && error.message.length > 0) {
      return error.message;
    }
  }
  return fallback;
}

/** Performs one JSON request and normalises every failure into an ApiError. */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (err) {
    // Transport failure: DNS, TLS, CORS, offline, or an aborted request.
    const detail = err instanceof Error ? err.message : String(err);
    throw new ApiError(`Cannot reach the API at ${API_BASE_URL || 'same origin'}: ${detail}`);
  }

  // The API always answers with JSON (see the server's error handler), but a
  // proxy or gateway can return a body-less response.
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      readErrorMessage(body, `Request failed with status ${response.status}`),
      response.status,
    );
  }

  if (body === null) {
    throw new ApiError('Response was not valid JSON', response.status);
  }

  return body as T;
}

/** Fetches the user list (GET /api/users). */
export async function getUsers(signal?: AbortSignal): Promise<UserListResponse> {
  if (IS_MOCK_MODE) {
    return mockGetUsers();
  }
  return requestJson<UserListResponse>('/api/users', { signal });
}

/** Authenticates a user (POST /api/auth/login) and returns the user on success. */
export async function login(credentials: LoginRequest): Promise<User> {
  if (IS_MOCK_MODE) {
    return mockLogin(credentials);
  }
  const data = await requestJson<LoginResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return data.user;
}
