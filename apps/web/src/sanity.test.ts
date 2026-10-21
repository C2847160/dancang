import { describe, expect, it } from 'vitest';

describe('web sanity', () => {
  it('basic arithmetic holds', () => {
    expect(1 + 1).toBe(2);
  });
});
