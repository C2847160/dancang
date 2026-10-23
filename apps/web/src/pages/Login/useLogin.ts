/**
 * Custom hook that owns the sign-in request (POST /api/auth/login).
 * Mirrors the `useUsers` pattern: the request lifecycle lives in a hook so the
 * page can render from plain state, and LoginForm stays presentational.
 */
import { useState } from 'react';
import type { ApiErrorBody, LoginRequest, LoginResponse, User } from '@repo/shared-types';

/** Request lifecycle shown by the page. */
export type LoginStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseLoginResult {
  status: LoginStatus;
  error: string | null;
  /** Resolves to the authenticated user, or null when the attempt failed. */
  login: (credentials: LoginRequest) => Promise<User | null>;
}

/** Reads the server's message out of the shared error envelope, with a fallback. */
function readErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const { error } = body as ApiErrorBody;
    if (typeof error.message === 'string' && error.message.length > 0) {
      return error.message;
    }
  }
  return fallback;
}

/** Posts credentials and exposes loading / error state for rendering. */
export function useLogin(): UseLoginResult {
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function login(credentials: LoginRequest): Promise<User | null> {
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      // The API always answers with JSON (see the global error handler), but a
      // proxy/gateway failure can return a body-less response, hence the guard.
      const body: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus('error');
        setError(readErrorMessage(body, `Login failed with status ${res.status}`));
        return null;
      }

      const data = body as LoginResponse;
      setStatus('success');
      return data.user;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  return { status, error, login };
}
