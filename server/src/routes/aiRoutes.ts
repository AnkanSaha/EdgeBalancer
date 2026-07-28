import type { FastifyInstance } from 'fastify';
import { generateWithAi } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { runHandlers } from '../utils/routeRunner';

const TEST = process.env.NODE_ENV === 'test';
// A single run can fan out into many model calls and Cloudflare writes.
const STRICT = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 5, timeWindow: '15 minutes' };

export default async function aiRoutes(app: FastifyInstance) {
  app.post('/generate', { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, generateWithAi], request, reply));
}
