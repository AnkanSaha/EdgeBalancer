import type { FastifyInstance } from 'fastify';
import { saveCredentials, updateCredentials, getCredentials, getZones } from '../controllers/cloudflareController';
import { credentialsValidation } from '../middleware/validators/cloudflareValidators';
import { authenticate } from '../middleware/auth';
import { runHandlers } from '../utils/routeRunner';

export default async function cloudflareRoutes(app: FastifyInstance) {
  app.post('/credentials', async (request, reply) => runHandlers([authenticate, ...credentialsValidation, saveCredentials], request, reply));
  app.put('/credentials', async (request, reply) => runHandlers([authenticate, ...credentialsValidation, updateCredentials], request, reply));
  app.get('/credentials', async (request, reply) => runHandlers([authenticate, getCredentials], request, reply));
  app.get('/zones', async (request, reply) => runHandlers([authenticate, getZones], request, reply));
}
