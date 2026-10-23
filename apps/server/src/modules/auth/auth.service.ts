/**
 * Auth service: credential checking only. No HTTP concerns (spec.md R4).
 * Credentials live with the user module (it owns the store), so this service
 * orchestrates rather than duplicating storage.
 */
import type { LoginRequest, User } from '@repo/shared-types';
import * as userService from '../user/user.service';

/** Returns the authenticated user, or undefined when the pair is invalid. */
export function login(input: LoginRequest): User | undefined {
  return userService.verifyCredentials(input.email, input.password);
}
