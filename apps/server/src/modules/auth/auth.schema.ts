import { z } from 'zod';
import type { LoginRequest } from '@repo/shared-types';

/**
 * Login payload validation. Shape is deliberately stricter than "any string":
 * an email must look like an email, and an empty password is rejected before
 * it ever reaches the service (where hashing would be wasted work).
 */
export const loginSchema = z.object({
  email: z.string().trim().email('A valid email address is required'),
  password: z.string().min(1, 'Password is required'),
}) satisfies z.ZodType<LoginRequest>;
