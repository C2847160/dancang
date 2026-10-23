/**
 * Auth controller: HTTP boundary only (spec.md R4).
 * The body is validated by `validateBody(loginSchema)` before this runs.
 */
import type { Request, Response } from 'express';
import type { LoginRequest, LoginResponse } from '@repo/shared-types';
import { AppError } from '../../middlewares/error-handler';
import * as authService from './auth.service';

/** POST /login — 200 with the user, 401 when the credentials do not match. */
export function login(
  req: Request<Record<string, string>, LoginResponse, LoginRequest>,
  res: Response<LoginResponse>,
): void {
  const user = authService.login(req.body);
  if (user === undefined) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }
  res.json({ user });
}
