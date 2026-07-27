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

// ─── Profile ─────────────────────────────────────────────────────────────────

describe('GET /api/user/profile', () => {
  it('200 returns user profile without password field', async () => {
    const { cookie } = await createTestUser({
      name: 'Alice Smith',
      email: 'alice@example.com',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/user/profile',
      headers: cookie,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('alice@example.com');
    expect(body.data.user.name).toBe('Alice Smith');
    expect(body.data.user.password).toBeUndefined();
  });

  it('401 when not authenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/user/profile' });
    expect(res.statusCode).toBe(401);
  });
});
