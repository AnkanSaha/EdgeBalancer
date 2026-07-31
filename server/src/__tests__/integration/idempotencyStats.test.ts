// Local mock so SCAN can page and repeat keys the way real Redis is allowed to.
const pages = [
  { cursor: '17', keys: ['idempotency:a', 'idempotency:processing:x'] },
  { cursor: '0', keys: ['idempotency:a', 'idempotency:b'] },
];

jest.mock('../../utils/redisClient', () => {
  const slots = new Map<string, number>();
  let call = 0;

  const client = {
    get: async () => null,
    set: async () => 'OK',
    exists: async () => 0,
    del: async () => 1,
    keys: async () => {
      throw new Error('KEYS must not be used — it blocks single-threaded Redis');
    },
    scan: async () => pages[call++] ?? { cursor: '0', keys: [] },
    scriptLoad: async () => 'test-sha',
    eval: async () => 1,
    evalSha: async (_sha: string, opts: { keys: string[]; arguments: string[] }) => {
      const window = Number(opts.arguments[0]);
      const now = Date.now();
      const slotKey = `${opts.keys[0]}:${Math.floor(now / window)}`;
      const current = (slots.get(slotKey) ?? 0) + 1;
      slots.set(slotKey, current);
      return [current, window - (now % window)];
    },
  };

  return { getRedisClient: async () => client, closeRedisClient: async () => undefined };
});

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

describe('GET /api/idempotency/stats', () => {
  it('401 without a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/idempotency/stats' });
    expect(res.statusCode).toBe(401);
  });

  it('pages through SCAN and counts each key once', async () => {
    const { cookie } = await createTestUser();

    const res = await app.inject({ method: 'GET', url: '/api/idempotency/stats', headers: cookie });

    expect(res.statusCode).toBe(200);
    // 'idempotency:a' appears on both pages and must not be double counted.
    expect(res.json().data).toEqual({ totalKeys: 2, processingKeys: 1 });
  });
});
