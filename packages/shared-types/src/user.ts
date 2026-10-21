/**
 * User contract types (contract layer).
 * Rules (spec.md R2.5): type-only — no runtime logic, no runtime dependencies.
 */

/** User entity. `createdAt` is an ISO 8601 string, e.g. "2026-10-20T08:30:00.000Z". */
export interface User {
  id: string;
  email: string;
  name: string;
  /** Optional avatar image URL. */
  avatarUrl?: string;
  createdAt: string;
}

/** Payload for creating a user. */
export interface CreateUserRequest {
  email: string;
  name: string;
}

/** Payload for partially updating a user. All fields optional. */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

/** Paginated user list response. */
export interface UserListResponse {
  items: User[];
  total: number;
}
