/**
 * User controller: HTTP boundary only (spec.md R4).
 * Parses the request, delegates to the service, maps the result to status/body.
 * No data access and no business logic.
 */
import type { Request, Response } from 'express';
import * as userService from './user.service';
import type { CreateUserRequest, UpdateUserRequest, UserListResponse } from './user.types';

/** GET / — list all users. */
export function getAllUsers(_req: Request, res: Response<UserListResponse>): void {
  const items = userService.getAll();
  res.json({ items, total: items.length });
}

/** GET /:id — fetch one user; 404 when the id is unknown. */
export function getUserById(req: Request, res: Response): void {
  const id = req.params.id;
  if (typeof id !== 'string') {
    res.sendStatus(404);
    return;
  }
  const user = userService.getById(id);
  if (user === undefined) {
    res.sendStatus(404);
    return;
  }
  res.json(user);
}

/** POST / — create a user; 201 with the created entity. */
export function createUser(req: Request, res: Response): void {
  const user = userService.create(req.body as CreateUserRequest);
  res.status(201).json(user);
}

/** PATCH /:id — partially update a user; 404 when the id is unknown. */
export function updateUser(req: Request, res: Response): void {
  const id = req.params.id;
  if (typeof id !== 'string') {
    res.sendStatus(404);
    return;
  }
  const user = userService.update(id, req.body as UpdateUserRequest);
  if (user === undefined) {
    res.sendStatus(404);
    return;
  }
  res.json(user);
}

/** DELETE /:id — remove a user; 204 on success, 404 when the id is unknown. */
export function deleteUser(req: Request, res: Response): void {
  const id = req.params.id;
  if (typeof id !== 'string') {
    res.sendStatus(404);
    return;
  }
  const removed = userService.remove(id);
  if (!removed) {
    res.sendStatus(404);
    return;
  }
  res.sendStatus(204);
}
