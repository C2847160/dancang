/**
 * HTTP-level tests: they go through the real app (routing → validation →
 * controller → service → error handler), so the middleware chain itself is
 * covered rather than mocked.
 */
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './server';
import * as userService from './modules/user/user.service';

const app = createApp();

const validUser = { email: 'ada@example.com', name: 'Ada', password: 'correct-horse' };

beforeEach(() => {
  userService.reset();
});

describe('POST /api/users', () => {
  it('returns 400 with one detail per missing field', async () => {
    const response = await request(app).post('/api/users').send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    const paths: string[] = response.body.error.details.map(
      (detail: { path: string }) => detail.path,
    );
    expect(paths).toEqual(expect.arrayContaining(['email', 'name', 'password']));
  });

  it('rejects a password shorter than eight characters', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ ...validUser, password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([
      { path: 'password', message: 'Password must be at least 8 characters' },
    ]);
  });

  it('rejects a malformed email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ ...validUser, email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates the user with 201 and omits credentials', async () => {
    const response = await request(app).post('/api/users').send(validUser);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ email: 'ada@example.com', name: 'Ada' });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('passwordSalt');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    userService.create(validUser);
  });

  it('returns the user for a valid pair', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'correct-horse' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: 'ada@example.com', name: 'Ada' });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 for a wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
    });
  });

  it('returns 401 for an unknown email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'correct-horse' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for a malformed body', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    const paths: string[] = response.body.error.details.map(
      (detail: { path: string }) => detail.path,
    );
    expect(paths).toEqual(expect.arrayContaining(['email', 'password']));
  });
});

describe('error envelope', () => {
  it('returns a JSON 404 for an unknown route', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  it('returns a JSON 404 for an unknown user id', async () => {
    const response = await request(app).get('/api/users/usr_missing');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'User usr_missing not found' },
    });
  });
});
