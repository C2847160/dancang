/**
 * User routes: HTTP method/path → controller mappings only.
 * No business logic and no direct service/repository access (spec.md R4).
 */
// Intended mount point: app.use('/api/users', userRouter)
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import * as userController from './user.controller';

// Explicit annotation: required for declaration emit under composite builds
// (TS2742 — the inferred type is not portable across project references).
export const userRouter: ExpressRouter = Router();

userRouter.get('/', userController.getAllUsers);
userRouter.get('/:id', userController.getUserById);
userRouter.post('/', userController.createUser);
userRouter.patch('/:id', userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);
