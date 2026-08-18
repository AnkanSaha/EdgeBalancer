import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { RedisSlidingWindowStore } from './rateLimitStore';

export const registerRateLimit = async (app: FastifyInstance) => {
  await app.register(rateLimit, {
    global: true,
    max: process.env.NODE_ENV === 'test' ? 1000 : 100,
    timeWindow: '1 minute',
    store: RedisSlidingWindowStore,
    skipOnError: true, // a Redis outage must not 500 every request
    // Cloudflare strips cf-connecting-ip from client input, so it can't be forged.
    keyGenerator: (request) =>
      (request.headers['cf-connecting-ip'] as string | undefined) ?? request.ip,
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429, // required: the custom error handler reads it off this object
      success: false,
      message: `Too many requests. Retry in ${Math.ceil(ctx.ttl / 1000)}s.`,
      data: null,
    }),
  });
};
