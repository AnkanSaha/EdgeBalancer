import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import crypto from 'crypto';
import { getRedisClient } from '../../utils/redisClient';
import { verifyToken } from '../../utils/jwt';
import { authenticate } from '../auth';
import { runHandlers } from '../../utils/routeRunner';

interface IdempotencyRecord {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  requestBodyHash: string;
}

const TTL_SECONDS = 24 * 60 * 60;
const PROCESSING_TTL_SECONDS = 300;

function idempKey(composite: string): string {
  return `idempotency:${composite}`;
}

function processingKey(composite: string): string {
  return `idempotency:processing:${composite}`;
}

function hashBody(body: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
}

function extractUserId(request: FastifyRequest): string {
  try {
    const cookieHeader = request.headers.cookie || '';
    const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, c) => {
      const [k, ...v] = c.trim().split('=');
      if (k) acc[decodeURIComponent(k.trim())] = decodeURIComponent(v.join('=') || '');
      return acc;
    }, {});
    const token = cookies['token'];
    if (!token) return 'anonymous';
    return verifyToken(token).userId;
  } catch {
    return 'anonymous';
  }
}

async function idempotencyPlugin(fastify: FastifyInstance) {
  // preHandler: body is fully parsed, cookies available from raw header
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;

    const idempotencyKey = request.headers['idempotency-key'] as string;
    if (!idempotencyKey) return;

    if (idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid idempotency key format. Must be 16-128 characters.',
      });
    }

    const userId = extractUserId(request);
    const compositeKey = crypto
      .createHash('sha256')
      .update(`${userId}:${request.url}:${idempotencyKey}`)
      .digest('hex');

    const redis = await getRedisClient();

    const isProcessing = await redis.exists(processingKey(compositeKey));
    if (isProcessing) {
      return reply.status(409).send({
        success: false,
        message: 'Request is already being processed. Please wait.',
      });
    }

    const raw = await redis.get(idempKey(compositeKey));
    if (raw) {
      const cached: IdempotencyRecord = JSON.parse(raw);
      const incomingBodyHash = hashBody(request.body);

      if (cached.requestBodyHash !== incomingBodyHash) {
        return reply.status(409).send({
          success: false,
          message: 'Idempotency key reused with different request body',
          code: 'IDEMPOTENCY_KEY_MISMATCH',
        });
      }

      return reply.status(cached.statusCode).headers(cached.headers).send(cached.body);
    }

    await redis.set(processingKey(compositeKey), '1', { EX: PROCESSING_TTL_SECONDS });
    (request as any).idempotencyKey = compositeKey;
    (request as any).idempotencyBodyHash = hashBody(request.body);
  });

  fastify.addHook('preSerialization', async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
    const compositeKey = (request as any).idempotencyKey;
    if (!compositeKey) return payload;

    const redis = await getRedisClient();
    const statusCode = reply.statusCode;

    if (statusCode >= 200 && statusCode < 500) {
      const record: IdempotencyRecord = {
        statusCode,
        headers: reply.getHeaders() as Record<string, string>,
        body: payload,
        requestBodyHash: (request as any).idempotencyBodyHash,
      };
      await redis.set(idempKey(compositeKey), JSON.stringify(record), { EX: TTL_SECONDS });
    }

    await redis.del(processingKey(compositeKey));
    return payload;
  });

  // Enumerating the keyspace stalls single-threaded Redis, and Redis is on the hot path for every
  // request — so this is authenticated, rate limited, and cursor-based rather than KEYS.
  fastify.get(
    '/api/idempotency/stats',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) =>
      runHandlers(
        [
          authenticate,
          async (_req, res) => {
            const redis = await getRedisClient();
            let cursor = '0';
            let total = 0;
            let processing = 0;
            const seen = new Set<string>();

            do {
              const batch = await redis.scan(cursor, { MATCH: 'idempotency:*', COUNT: 500 });
              cursor = String(batch.cursor);

              for (const key of batch.keys) {
                // SCAN can return the same key more than once across iterations.
                if (seen.has(key)) continue;
                seen.add(key);
                key.includes(':processing:') ? processing++ : total++;
              }
            } while (cursor !== '0');

            res.json({ success: true, data: { totalKeys: total, processingKeys: processing } });
          },
        ],
        request,
        reply
      )
  );
}

export default fp(idempotencyPlugin, {
  name: 'idempotency',
  fastify: '5.x',
});
