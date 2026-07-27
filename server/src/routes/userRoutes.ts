import type { FastifyInstance } from 'fastify';
import { getProfile } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { runHandlers } from '../utils/routeRunner';

const TEST = process.env.NODE_ENV === 'test';
const RELAXED = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 60, timeWindow: '1 minute' };

export default async function userRoutes(app: FastifyInstance) {
  app.get('/profile', { config: { rateLimit: RELAXED } }, async (request, reply) => runHandlers([authenticate, getProfile], request, reply));
}
