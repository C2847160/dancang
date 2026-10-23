import { beforeEach, describe, expect, it } from 'vitest';
import * as userService from './user.service';

const validInput = { email: 'ada@example.com', name: 'Ada', password: 'correct-horse' };

beforeEach(() => {
  userService.reset();
});

describe('userService.create', () => {
  it('stores the user and never exposes credential fields', () => {
    const user = userService.create(validInput);

    expect(user).toEqual({
      id: 'usr_1',
      email: 'ada@example.com',
      name: 'Ada',
      createdAt: expect.any(String),
    });
    expect(Object.keys(user)).not.toContain('passwordHash');
    expect(Object.keys(user)).not.toContain('passwordSalt');
  });

  it('assigns a distinct id to every created user', () => {
    const first = userService.create(validInput);
    const second = userService.create({ ...validInput, email: 'grace@example.com' });

    expect(first.id).not.toBe(second.id);
    expect(userService.getAll()).toHaveLength(2);
  });
});

describe('userService.read/update/remove', () => {
  it('reads a user by id', () => {
    const created = userService.create(validInput);

    expect(userService.getById(created.id)).toEqual(created);
  });

  it('returns undefined for an unknown id', () => {
    expect(userService.getById('usr_missing')).toBeUndefined();
    expect(userService.update('usr_missing', { name: 'Nobody' })).toBeUndefined();
    expect(userService.remove('usr_missing')).toBe(false);
  });

  it('applies only the provided fields on update', () => {
    const created = userService.create(validInput);

    const updated = userService.update(created.id, { name: 'Ada Lovelace' });

    expect(updated).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.com' });
  });

  it('removes a user', () => {
    const created = userService.create(validInput);

    expect(userService.remove(created.id)).toBe(true);
    expect(userService.getAll()).toHaveLength(0);
  });
});

describe('userService.verifyCredentials', () => {
  it('returns the user for a matching email/password pair', () => {
    const created = userService.create(validInput);

    expect(userService.verifyCredentials('ada@example.com', 'correct-horse')).toEqual(created);
  });

  it('returns undefined for a wrong password', () => {
    userService.create(validInput);

    expect(userService.verifyCredentials('ada@example.com', 'wrong-password')).toBeUndefined();
  });

  it('returns undefined for an unknown email', () => {
    userService.create(validInput);

    expect(userService.verifyCredentials('nobody@example.com', 'correct-horse')).toBeUndefined();
  });
});
