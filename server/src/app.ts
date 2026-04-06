import Fastify from 'fastify';
import { registerCors } from './middleware/cors';
import { registerErrorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import cloudflareRoutes from './routes/cloudflareRoutes';
import userRoutes from './routes/userRoutes';
import loadBalancerRoutes from './routes/loadBalancerRoutes';

export const buildServer = () => {
  const app = Fastify({
    logger: false,
  });

  registerCors(app);
  registerErrorHandler(app);

  app.get('/health', async () => ({
    success: true,
    message: 'Server is running',
  }));

  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(cloudflareRoutes, { prefix: '/api/cloudflare' });
  app.register(userRoutes, { prefix: '/api/user' });
  app.register(loadBalancerRoutes, { prefix: '/api/loadbalancers' });

  return app;
};
