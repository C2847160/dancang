/**
 * Runtime validation schemas for the user module.
 * They mirror the contract types in @repo/shared-types (spec.md R2.2): the
 * contract stays type-only, the runtime checks live here on the server.
 */
import { z } from 'zod';
import type { CreateUserRequest, UpdateUserRequest } from './user.types';

export const createUserSchema = z.object({
  email: z.string().trim().email('A valid email address is required'),
  name: z.string().trim().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
}) satisfies z.ZodType<CreateUserRequest>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  email: z.string().trim().email('A valid email address is required').optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').optional(),
}) satisfies z.ZodType<UpdateUserRequest>;
