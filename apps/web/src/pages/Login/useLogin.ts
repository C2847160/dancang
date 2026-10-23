/**
 * Custom hook that owns the sign-in request. The request lifecycle lives here so
 * the page renders from plain state and LoginForm stays presentational.
 * The actual call (real API or built-in demo data) is decided in src/lib/api.ts.
 */
import { useState } from 'react';
import type { LoginRequest, User } from '@repo/shared-types';
import { login as loginRequest } from '../../lib/api';

/** Request lifecycle shown by the page. */
export type LoginStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseLoginResult {
  status: LoginStatus;
  error: string | null;
  /** Resolves to the authenticated user, or null when the attempt failed. */
  login: (credentials: LoginRequest) => Promise<User | null>;
}

/** Posts credentials and exposes loading / error state for rendering. */
export function useLogin(): UseLoginResult {
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function login(credentials: LoginRequest): Promise<User | null> {
    setStatus('loading');
    setError(null);

    try {
      const user = await loginRequest(credentials);
      setStatus('success');
      return user;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  return { status, error, login };
}
