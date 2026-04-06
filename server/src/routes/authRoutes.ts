import type { FastifyInstance } from 'fastify';
import { register, login, logout, getCurrentUser, googleAuth } from '../controllers/authController';
import { registerValidation, loginValidation, googleAuthValidation } from '../middleware/validators/authValidators';
import { authenticate } from '../middleware/auth';
import { runHandlers } from '../utils/routeRunner';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => runHandlers([...registerValidation, register], request, reply));
  app.post('/login', async (request: any, reply: any) => runHandlers([...loginValidation, login], request, reply));
  app.post('/google', async (request, reply) => runHandlers([...googleAuthValidation, googleAuth], request, reply));
  app.post('/logout', async (request, reply) => runHandlers([logout], request, reply));
  app.get('/me', async (request, reply) => runHandlers([authenticate, getCurrentUser], request, reply));
}
