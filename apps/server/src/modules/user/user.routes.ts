/**
 * User routes: HTTP method/path → controller mappings only.
 * No business logic and no direct service/repository access (spec.md R4).
 */
// Intended mount point: app.use('/api/users', userRouter)
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { validateBody } from '../../middlewares/validate';
import * as userController from './user.controller';
import { createUserSchema, updateUserSchema } from './user.schema';

// Explicit annotation: required for declaration emit under composite builds
// (TS2742 — the inferred type is not portable across project references).
export const userRouter: ExpressRouter = Router();

userRouter.get('/', userController.getAllUsers);
userRouter.get('/:id', userController.getUserById);
userRouter.post('/', validateBody(createUserSchema), userController.createUser);
userRouter.patch('/:id', validateBody(updateUserSchema), userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);
