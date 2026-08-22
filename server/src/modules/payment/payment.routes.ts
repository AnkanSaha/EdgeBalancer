import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { runHandlers } from '../../utils/routeRunner';
import { createPaymentOrder } from './controllers/create-order.controller';
import { handleWebhook } from './controllers/webhook.controller';
import { listPayments } from './controllers/payment-history.controller';
import { verifyPaymentOrder } from './controllers/verify-order.controller';
import { createUpgradeOrder } from './controllers/upgrade-order.controller';

const TEST = process.env.NODE_ENV !== 'production';
const STRICT  = TEST ? { max: 10000, timeWindow: '15 minutes' } : { max: 10, timeWindow: '15 minutes' };
const RELAXED = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 60, timeWindow: '1 minute' };

export default async function paymentRoutes(app: FastifyInstance) {
  // Create order — requires auth, rate limited
  app.post('/', { config: { rateLimit: STRICT } }, async (request, reply) =>
    runHandlers([authenticate, createPaymentOrder], request, reply)
  );

  // Cashfree webhook — no auth (verified by signature), needs raw body
  app.post('/webhook', { config: { rateLimit: RELAXED } }, async (request, reply) =>
    runHandlers([handleWebhook], request, reply)
  );

  // Upgrade order — requires auth, discounted price, full tenure
  app.post('/upgrade', { config: { rateLimit: STRICT } }, async (request, reply) =>
    runHandlers([authenticate, createUpgradeOrder], request, reply)
  );

  // Verify order status — requires auth (jitter polling calls this)
  app.post('/verify', { config: { rateLimit: RELAXED } }, async (request, reply) =>
    runHandlers([authenticate, verifyPaymentOrder], request, reply)
  );

  // Payment history — requires auth
  app.get('/history', { config: { rateLimit: RELAXED } }, async (request, reply) =>
    runHandlers([authenticate, listPayments], request, reply)
  );
}
