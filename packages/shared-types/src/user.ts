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

/** Payload for creating a user. The password is write-only and never returned. */
export interface CreateUserRequest {
  email: string;
  name: string;
  /** Plain-text password on the wire; the server stores only a salted hash. */
  password: string;
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

/** Payload for logging in with an email/password pair. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Successful login response. Never carries credentials. */
export interface LoginResponse {
  user: User;
}
