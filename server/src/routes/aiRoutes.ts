import type { FastifyInstance, FastifyRequest } from 'fastify';
import { generateWithAi, listAiRuns, getAiRun } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { runHandlers } from '../utils/routeRunner';
import { parseCookies } from '../types/http';
import { verifyToken } from '../utils/jwt';

const TEST = process.env.NODE_ENV === 'test';

/**
 * Model calls are billed per person, so the allowance is counted per person rather than per
 * address. `authenticate` runs inside the handler, so `request.user` does not exist yet when the
 * rate limiter's onRequest hook fires — hence reading the cookie directly, falling back to the
 * address so unauthenticated traffic stays limited.
 */
const keyGenerator = (request: FastifyRequest): string => {
  try {
    const token = parseCookies(request.headers.cookie)?.token;
    if (token) return `u:${verifyToken(token).userId}`;
  } catch {
    // Expired or forged — `authenticate` rejects it a moment later.
  }

  return `ip:${(request.headers['cf-connecting-ip'] as string | undefined) ?? request.ip}`;
};

// One conversation turn costs one call, and a single provisioning chat runs six-plus turns —
// the cap has to fit several full conversations inside the window.
const STRICT = TEST
  ? { max: 10000, timeWindow: '1 minute' }
  : { max: 30, timeWindow: '15 minutes', keyGenerator };

const RELAXED = TEST
  ? { max: 10000, timeWindow: '1 minute' }
  : { max: 60, timeWindow: '1 minute' };

export default async function aiRoutes(app: FastifyInstance) {
  app.post('/generate', { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, generateWithAi], request, reply));
  app.get('/runs', { config: { rateLimit: RELAXED } }, async (request, reply) => runHandlers([authenticate, listAiRuns], request, reply));
  app.get('/runs/:id', { config: { rateLimit: RELAXED } }, async (request, reply) => runHandlers([authenticate, getAiRun], request, reply));
}
