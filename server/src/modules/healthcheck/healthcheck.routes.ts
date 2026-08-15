import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { runHandlers } from '../../utils/routeRunner';
import { restartOriginHealth } from './controllers/restart-origin.controller';

const TEST = process.env.NODE_ENV === 'test';
const MODERATE = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 20, timeWindow: '1 minute' };

export default async function healthCheckRoutes(app: FastifyInstance) {
  app.post(
    '/:id/health/restart-origin',
    { config: { rateLimit: MODERATE } },
    async (request, reply) => runHandlers([authenticate, restartOriginHealth], request, reply)
  );
}
