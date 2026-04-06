import type { FastifyInstance } from 'fastify';
import { getProfile, changePassword } from '../controllers/userController';
import { changePasswordValidation } from '../middleware/validators/userValidators';
import { authenticate } from '../middleware/auth';
import { runHandlers } from '../utils/routeRunner';

export default async function userRoutes(app: FastifyInstance) {
  app.get('/profile', async (request, reply) => runHandlers([authenticate, getProfile], request, reply));
  app.put('/password', async (request, reply) => runHandlers([authenticate, ...changePasswordValidation, changePassword], request, reply));
}
