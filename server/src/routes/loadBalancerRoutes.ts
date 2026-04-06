import type { FastifyInstance } from 'fastify';
import {
  getLoadBalancers,
  getLoadBalancer,
  createLoadBalancer,
  updateLoadBalancer,
  deleteLoadBalancer,
  cancelLoadBalancerDeployment,
  validateLoadBalancerHostname,
} from '../controllers/loadBalancerController';
import { authenticate } from '../middleware/auth';
import { createLoadBalancerValidator } from '../middleware/validators/loadBalancerValidators';
import { runHandlers } from '../utils/routeRunner';

export default async function loadBalancerRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => runHandlers([authenticate, getLoadBalancers], request, reply));
  app.post('/', async (request, reply) => runHandlers([authenticate, ...createLoadBalancerValidator, createLoadBalancer], request, reply));
  app.post('/validate-hostname', async (request, reply) => runHandlers([authenticate, validateLoadBalancerHostname], request, reply));
  app.post('/operations/:operationId/cancel', async (request, reply) => runHandlers([authenticate, cancelLoadBalancerDeployment], request, reply));
  app.get('/:id', async (request, reply) => runHandlers([authenticate, getLoadBalancer], request, reply));
  app.put('/:id', async (request, reply) => runHandlers([authenticate, ...createLoadBalancerValidator, updateLoadBalancer], request, reply));
  app.delete('/:id', async (request, reply) => runHandlers([authenticate, deleteLoadBalancer], request, reply));
}
