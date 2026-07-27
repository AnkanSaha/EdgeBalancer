import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../app';
import { connectTestDb, clearCollections, closeTestDb } from '../helpers/db';
import { createTestUser } from '../helpers/auth';

let app: FastifyInstance;

beforeAll(async () => {
  await connectTestDb();
  app = await buildServer();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await app.close();
  await closeTestDb();
});

// ─── Logout ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('200 and clears the auth cookie', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout' });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
    const setCookie = String(res.headers['set-cookie'] ?? '');
    // Clearing the cookie means setting it with an expired date
    expect(setCookie).toContain('token=');
    expect(setCookie.toLowerCase()).toContain('expires=');
  });
});

// ─── Me ──────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('200 returns user data when a valid cookie is provided', async () => {
    const { cookie } = await createTestUser({ email: 'me@example.com' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: cookie,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.user).toBeDefined();
    expect(body.data.user.password).toBeUndefined();
  });

  it('401 when no cookie is provided', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('401 when cookie contains an invalid JWT', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: 'token=this.is.not.valid' },
    });
    expect(res.statusCode).toBe(401);
  });
});
