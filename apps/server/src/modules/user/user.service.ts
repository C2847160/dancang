/**
 * User service: in-memory data store and user business operations.
 * Strictly non-HTTP (spec.md R4): no Express types, no status codes, no req/res.
 */
import type { CreateUserRequest, UpdateUserRequest, User } from './user.types';

/** Module-private in-memory user store (never exported). */
const users: User[] = [];

/** Monotonic id counter; ids are generated from ES built-ins only. */
let nextId = 1;

/** Returns all users. */
export function getAll(): User[] {
  return users;
}

/** Returns the user with the given id, or undefined when not found. */
export function getById(id: string): User | undefined {
  return users.find((user) => user.id === id);
}

/** Creates a user from the given input and returns the stored entity. */
export function create(input: CreateUserRequest): User {
  const user: User = {
    id: `usr_${nextId}`,
    email: input.email,
    name: input.name,
    createdAt: new Date().toISOString(),
  };
  nextId += 1;
  users.push(user);
  return user;
}

/**
 * Partially updates the user with the given id (defined fields only).
 * Returns the updated user, or undefined when the id is not found.
 */
export function update(id: string, input: UpdateUserRequest): User | undefined {
  const user = getById(id);
  if (!user) {
    return undefined;
  }
  if (input.name !== undefined) {
    user.name = input.name;
  }
  if (input.email !== undefined) {
    user.email = input.email;
  }
  if (input.avatarUrl !== undefined) {
    user.avatarUrl = input.avatarUrl;
  }
  return user;
}

/** Removes the user with the given id. Returns false when the id is not found. */
export function remove(id: string): boolean {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    return false;
  }
  users.splice(index, 1);
  return true;
}
