/**
 * Load Balancer Routes
 *
 * Defines all routes for load balancer CRUD operations.
 */

import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { runHandlers } from '../../utils/routeRunner';
import {
  createLoadBalancerValidator,
} from '../../middleware/validators/loadBalancerValidators';

// Import controllers
import { listLoadBalancers } from './controllers/list.controller';
import { getLoadBalancer } from './controllers/get.controller';
import { createLoadBalancer } from './controllers/create.controller';
import { updateLoadBalancer } from './controllers/update.controller';
import { deleteLoadBalancer } from './controllers/delete.controller';
import { validateLoadBalancerHostname } from './controllers/validate.controller';
import { cancelLoadBalancerDeployment } from './controllers/cancel.controller';

export default async function loadBalancerRoutes(app: FastifyInstance) {
  // List all load balancers
  app.get('/', async (request, reply) =>
    runHandlers([authenticate, listLoadBalancers], request, reply)
  );

  // Get single load balancer
  app.get('/:id', async (request, reply) =>
    runHandlers([authenticate, getLoadBalancer], request, reply)
  );

  // Create load balancer
  app.post('/', async (request, reply) =>
    runHandlers([authenticate, ...createLoadBalancerValidator, createLoadBalancer], request, reply)
  );

  // Update load balancer
  app.put('/:id', async (request, reply) =>
    runHandlers([authenticate, updateLoadBalancer], request, reply)
  );

  // Delete load balancer
  app.delete('/:id', async (request, reply) =>
    runHandlers([authenticate, deleteLoadBalancer], request, reply)
  );

  // Validate hostname availability
  app.post('/validate-hostname', async (request, reply) =>
    runHandlers([authenticate, validateLoadBalancerHostname], request, reply)
  );

  // Cancel load balancer operation
  app.post('/operations/:operationId/cancel', async (request, reply) =>
    runHandlers([authenticate, cancelLoadBalancerDeployment], request, reply)
  );
}
