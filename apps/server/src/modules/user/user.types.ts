/**
 * User module type surface.
 * Single source of truth is the contract layer (spec.md R2.2): this file only
 * re-exports the shared API/domain types — no new type definitions here.
 */
export type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListResponse,
} from '@repo/shared-types';
