import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { runHandlers } from '../../utils/routeRunner';
import { createGateway } from './controllers/create.controller';
import { listGateways } from './controllers/list.controller';
import { getGateway } from './controllers/get.controller';
import { updateGateway } from './controllers/update.controller';
import { deleteGateway } from './controllers/delete.controller';
import { validateGatewayHostname } from './controllers/validate.controller';
import { pauseGateway } from './controllers/pause.controller';
import { resumeGateway } from './controllers/resume.controller';

const TEST = process.env.NODE_ENV === 'test';
const STRICT = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 5, timeWindow: '15 minutes' };
const MODERATE = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 20, timeWindow: '1 minute' };
const RELAXED = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 60, timeWindow: '1 minute' };

export default async function gatewayRoutes(app: FastifyInstance) {
  app.get('/', { config: { rateLimit: RELAXED } }, async (request, reply) => runHandlers([authenticate, listGateways], request, reply));
  app.get('/:id', { config: { rateLimit: RELAXED } }, async (request, reply) => runHandlers([authenticate, getGateway], request, reply));
  app.post('/', { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, createGateway], request, reply));
  app.put('/:id', { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, updateGateway], request, reply));
  app.delete('/:id', { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, deleteGateway], request, reply));
  app.post('/validate-hostname', { config: { rateLimit: MODERATE } }, async (request, reply) => runHandlers([authenticate, validateGatewayHostname], request, reply));
  app.post('/:id/pause', { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, pauseGateway], request, reply));
  app.post('/:id/resume', { config: { rateLimit: MODERATE } }, async (request, reply) => runHandlers([authenticate, resumeGateway], request, reply));
}
