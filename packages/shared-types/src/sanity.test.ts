import { describe, expect, it } from 'vitest';
import type { User, UserListResponse } from './index';

describe('shared-types contract', () => {
  it('User / UserListResponse shapes are usable as contracts', () => {
    const user: User = {
      id: 'usr_1',
      email: 'a@b.c',
      name: 'A',
      createdAt: new Date(0).toISOString(),
    };
    const list: UserListResponse = { items: [user], total: 1 };
    expect(list.total).toBe(1);
    expect(list.items[0]?.id).toBe('usr_1');
  });
});
