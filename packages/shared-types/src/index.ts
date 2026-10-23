/**
 * Single entry point of the contract layer (@repo/shared-types).
 * All cross-boundary types must be exported from here (spec.md R2.x).
 */
export type {
  CreateUserRequest,
  LoginRequest,
  LoginResponse,
  UpdateUserRequest,
  User,
  UserListResponse,
} from './user';
export type { ApiErrorBody, ApiErrorCode, ApiErrorDetail } from './error';
