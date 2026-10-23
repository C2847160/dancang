/**
 * User controller: HTTP boundary only (spec.md R4).
 * Parses the request, delegates to the service, maps the result to status/body.
 * Bodies are already validated by `validateBody`, so `req.body` is typed by the
 * Request generic instead of being cast (spec.md R4.3 keeps response types in
 * the contract layer).
 */
import type { Request, Response } from 'express';
import type { CreateUserRequest, UpdateUserRequest, User, UserListResponse } from './user.types';
import { AppError } from '../../middlewares/error-handler';
import * as userService from './user.service';

type IdParams = { id: string };

/** GET / — list all users. */
export function getAllUsers(_req: Request, res: Response<UserListResponse>): void {
  const items = userService.getAll();
  res.json({ items, total: items.length });
}

/** GET /:id — fetch one user; 404 when the id is unknown. */
export function getUserById(req: Request<IdParams>, res: Response<User>): void {
  const user = userService.getById(req.params.id);
  if (user === undefined) {
    throw new AppError(404, 'NOT_FOUND', `User ${req.params.id} not found`);
  }
  res.json(user);
}

/** POST / — create a user; 201 with the created entity. */
export function createUser(
  req: Request<Record<string, string>, User, CreateUserRequest>,
  res: Response<User>,
): void {
  const user = userService.create(req.body);
  res.status(201).json(user);
}

/** PATCH /:id — partially update a user; 404 when the id is unknown. */
export function updateUser(
  req: Request<IdParams, User, UpdateUserRequest>,
  res: Response<User>,
): void {
  const user = userService.update(req.params.id, req.body);
  if (user === undefined) {
    throw new AppError(404, 'NOT_FOUND', `User ${req.params.id} not found`);
  }
  res.json(user);
}

/** DELETE /:id — remove a user; 204 on success, 404 when the id is unknown. */
export function deleteUser(req: Request<IdParams>, res: Response): void {
  if (!userService.remove(req.params.id)) {
    throw new AppError(404, 'NOT_FOUND', `User ${req.params.id} not found`);
  }
  res.sendStatus(204);
}
