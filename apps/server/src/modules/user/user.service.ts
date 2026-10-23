/**
 * User service: in-memory data store and user business operations.
 * Strictly non-HTTP (spec.md R4): no Express types, no status codes, no req/res.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { CreateUserRequest, UpdateUserRequest, User } from './user.types';

/** Persisted shape: the public entity plus credentials that never leave the server. */
interface StoredUser extends User {
  passwordSalt: string;
  passwordHash: string;
}

/** Module-private in-memory user store (never exported). */
const users: StoredUser[] = [];

/** Monotonic id counter; ids are generated from ES built-ins only. */
let nextId = 1;

const KEY_LENGTH = 64;

/**
 * Derives a salted password hash. scrypt is intentionally used via the sync
 * API: this store is in-memory and single-process, so blocking for a few
 * milliseconds is cheaper than the complexity of an async queue here.
 */
function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, KEY_LENGTH).toString('hex');
}

/** Drops credential fields before a user crosses the API boundary. */
function toPublicUser(user: StoredUser): User {
  const publicUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
  if (user.avatarUrl !== undefined) {
    publicUser.avatarUrl = user.avatarUrl;
  }
  return publicUser;
}

/** Returns all users. */
export function getAll(): User[] {
  return users.map(toPublicUser);
}

/** Returns the user with the given id, or undefined when not found. */
export function getById(id: string): User | undefined {
  const user = users.find((candidate) => candidate.id === id);
  return user === undefined ? undefined : toPublicUser(user);
}

/** Creates a user from the given input and returns the stored entity. */
export function create(input: CreateUserRequest): User {
  const passwordSalt = randomBytes(16).toString('hex');
  const user: StoredUser = {
    id: `usr_${nextId}`,
    email: input.email,
    name: input.name,
    createdAt: new Date().toISOString(),
    passwordSalt,
    passwordHash: hashPassword(input.password, passwordSalt),
  };
  nextId += 1;
  users.push(user);
  return toPublicUser(user);
}

/**
 * Partially updates the user with the given id (defined fields only).
 * Returns the updated user, or undefined when the id is not found.
 */
export function update(id: string, input: UpdateUserRequest): User | undefined {
  const user = users.find((candidate) => candidate.id === id);
  if (user === undefined) {
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
  return toPublicUser(user);
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

/**
 * Verifies an email/password pair. Returns the matching user, or undefined
 * when the email is unknown or the password does not match.
 */
export function verifyCredentials(email: string, password: string): User | undefined {
  const user = users.find((candidate) => candidate.email === email);
  if (user === undefined) {
    return undefined;
  }
  const actual = Buffer.from(hashPassword(password, user.passwordSalt), 'hex');
  const expected = Buffer.from(user.passwordHash, 'hex');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return undefined;
  }
  return toPublicUser(user);
}

/** Clears all users and resets id generation. Test-only helper. */
export function reset(): void {
  users.length = 0;
  nextId = 1;
}
