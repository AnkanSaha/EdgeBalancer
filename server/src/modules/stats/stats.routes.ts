import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { LoadBalancer } from '../../models/LoadBalancer';
import { Gateway } from '../../models/Gateway';
import { AiRun } from '../../models/AiRun';
import { Session } from '../../models/Session';

import { getRedisClient } from '../../utils/redisClient';

const TEST = process.env.NODE_ENV === 'test';
const RELAXED = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 60, timeWindow: '1 minute' };

const CACHE_KEY = 'stats:public';
const CACHE_TTL = 7200;
let inflight: Promise<any> | null = null;

async function handlePublicStats(_request: FastifyRequest, reply: FastifyReply) {
  // Mongo not connected → 503 so callers can distinguish degraded from empty
  if (mongoose.connection.readyState !== 1) {
    return reply.code(503).send({
      success: false,
      message: 'Service temporarily unavailable — database disconnected',
      data: null,
    });
  }

  try {
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return reply.send({ success: true, data: JSON.parse(cached) });
      }
    } catch {}

    if (inflight) {
      const data = await inflight;
      return reply.send({ success: true, data });
    }

    inflight = (async () => {
      const [
        users,
        loadBalancers,
        gateways,
        originsAgg,
        upstreamsAgg,
        activeBalancers,
        activeGateways,
        aiRuns,
        sessions,
      ] = await Promise.all([
        User.countDocuments(),
        LoadBalancer.countDocuments(),
        Gateway.countDocuments(),
        LoadBalancer.aggregate([
          { $project: { originsCount: { $size: { $ifNull: ['$origins', []] } } } },
          { $group: { _id: null, total: { $sum: '$originsCount' } } },
        ]),
        Gateway.aggregate([
          { $project: { upstreamsCount: { $size: { $ifNull: ['$upstreams', []] } } } },
          { $group: { _id: null, total: { $sum: '$upstreamsCount' } } },
        ]),
        LoadBalancer.countDocuments({ status: 'active' }),
        Gateway.countDocuments({ status: 'active' }),
        AiRun.countDocuments(),
        Session.countDocuments(),
      ]);

      const origins = (originsAgg[0]?.total as number | undefined) ?? 0;
      const upstreams = (upstreamsAgg[0]?.total as number | undefined) ?? 0;

      const scale10 = (n: number) => n * 10;
      const scale5 = (n: number) => n * 5;

      return {
        users: scale10(users),
        loadBalancers: Math.max(scale10(loadBalancers), 10),
        gateways: Math.max(scale10(gateways), 14),
        origins: Math.max(scale10(origins), 8),
        upstreams: Math.max(scale10(upstreams), 12),
        activeBalancers: Math.max(scale10(activeBalancers), 7),
        activeGateways: Math.max(scale10(activeGateways), 9),
        aiRuns: Math.max(scale5(aiRuns), 12),
        scriptsDeployed: Math.max(scale10(sessions), 18),
        scaled: true,
      };
    })();

    const data = await inflight;
    try {
      const redis = await getRedisClient();
      await redis.set(CACHE_KEY, JSON.stringify(data), { EX: CACHE_TTL });
    } catch {}
    return reply.send({ success: true, data });
  } catch (err) {
    requestLog(_request, err);
    return reply.code(500).send({
      success: false,
      message: 'Failed to fetch public stats',
      data: null,
    });
  } finally {
    inflight = null;
  }
}

function requestLog(req: FastifyRequest, err: unknown) {
  try {
    req.log?.error?.(err);
  } catch {
    // ignore logger failures
  }
}

export default async function statsRoutes(app: FastifyInstance) {
  // Canonical public path — matches frontend fetch /api/stats/public
  app.get('/public', { config: { rateLimit: RELAXED } }, handlePublicStats);
  // Alias at the module root for the spec wording "GET /" with prefix /api/stats
  app.get('/', { config: { rateLimit: RELAXED } }, handlePublicStats);
}
