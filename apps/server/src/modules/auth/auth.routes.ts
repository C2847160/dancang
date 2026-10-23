/**
 * Auth routes: mappings only (spec.md R4).
 * Mount point: app.use('/api/auth', authRouter)
 */
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { validateBody } from '../../middlewares/validate';
import * as authController from './auth.controller';
import { loginSchema } from './auth.schema';

export const authRouter: ExpressRouter = Router();

authRouter.post('/login', validateBody(loginSchema), authController.login);
