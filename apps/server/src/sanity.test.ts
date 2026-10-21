import { describe, expect, it } from 'vitest';
import * as userService from './modules/user/user.service';

describe('user.service', () => {
  it('creates and retrieves a user', () => {
    const before = userService.getAll().length;
    const created = userService.create({ email: 's@x.y', name: 'S' });
    expect(created.id).toMatch(/^usr_/);
    expect(userService.getAll().length).toBe(before + 1);
    expect(userService.getById(created.id)?.email).toBe('s@x.y');
  });
});
