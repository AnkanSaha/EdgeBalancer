import Fastify from 'fastify';
import mongoose from 'mongoose';
import rateLimit from '@fastify/rate-limit';
import { registerCors } from './middleware/cors';
import { registerErrorHandler } from './middleware/errorHandler';
import idempotencyPlugin from './middleware/fastifyIdempotency';
import { RedisSlidingWindowStore } from './middleware/rateLimitStore';
import authRoutes from './routes/authRoutes';
import cloudflareRoutes from './routes/cloudflareRoutes';
import userRoutes from './routes/userRoutes';
import aiRoutes from './routes/aiRoutes';
import loadBalancerRoutes from './modules/loadbalancer/loadbalancer.routes';
import healthCheckRoutes from './modules/healthcheck/healthcheck.routes';
import sessionRoutes from './modules/session/session.routes';

export const buildServer = async () => {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    routerOptions: { ignoreTrailingSlash: true },
    // Private ranges only: request.ip resolves past Traefik to the real client,
    // and a client-injected X-Forwarded-For entry is never trusted.
    trustProxy: 'loopback, linklocal, uniquelocal',
    disableRequestLogging: false,
    bodyLimit: 1048576, // 1MB
  });

  // Register plugins
  registerCors(app);
  await app.register(rateLimit, {
    global: true,
    max: process.env.NODE_ENV === 'test' ? 1000 : 100,
    timeWindow: '1 minute',
    store: RedisSlidingWindowStore,
    skipOnError: true, // a Redis outage must not 500 every request
    // Cloudflare strips cf-connecting-ip from client input, so it can't be forged.
    keyGenerator: (request) =>
      (request.headers['cf-connecting-ip'] as string | undefined) ?? request.ip,
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429, // required: the custom error handler reads it off this object
      success: false,
      message: `Too many requests. Retry in ${Math.ceil(ctx.ttl / 1000)}s.`,
      data: null,
    }),
  });
  await app.register(idempotencyPlugin);
  registerErrorHandler(app);

  // Add content type parser for application/json that allows empty bodies
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try {
      const json = body === '' ? {} : JSON.parse(body as string);
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // Kubelet probes: never rate limited, never logged.
  const probeOpts = { logLevel: 'silent' as const, config: { rateLimit: false } };

  // Readiness — drops the pod from the Service while Mongo is down.
  app.get('/health', probeOpts, async (_, reply) => {
    const dbReady = mongoose.connection.readyState === 1;
    if (!dbReady) {
      return reply.code(503).send({ status: 'degraded', db: 'disconnected' });
    }
    return reply.send({ status: 'ok' });
  });

  // Liveness — no dependency checks: failing this restarts the pod.
  app.get('/live', probeOpts, async () => ({ status: 'alive' }));

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(cloudflareRoutes, { prefix: '/api/cloudflare' });
  await app.register(userRoutes, { prefix: '/api/user' });
  await app.register(loadBalancerRoutes, { prefix: '/api/loadbalancers' });
  await app.register(healthCheckRoutes, { prefix: '/api/loadbalancers' });
  await app.register(sessionRoutes, { prefix: '/api/sessions' });
  await app.register(aiRoutes, { prefix: '/api/ai' });

  return app;
};
