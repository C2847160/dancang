/**
 * Custom hook that owns the user list data fetch (GET /api/users).
 * Handles loading/error state, non-ok HTTP responses, and cleanup
 * via AbortController (no state updates after unmount).
 */
import { useEffect, useState } from 'react';
import type { User, UserListResponse } from '@repo/shared-types';

/** View state composed from contract types, exposed to the page component. */
export interface UseUsersResult {
  users: User[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the user list on mount.
 * @returns `{ users, loading, error }` for rendering.
 */
export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    // Guard against results arriving after unmount/abort.
    let active = true;

    const load = async (): Promise<void> => {
      try {
        const res = await fetch('/api/users', { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data = (await res.json()) as UserListResponse;
        if (active) {
          setUsers(data.items);
          setError(null);
        }
      } catch (err) {
        // Aborted requests must not touch state.
        if (!active || (err instanceof Error && err.name === 'AbortError')) {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { users, loading, error };
}
