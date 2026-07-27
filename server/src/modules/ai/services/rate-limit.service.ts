import { getRedisClient } from '../../../utils/redisClient';

/**
 * Per-model request pacing, shared across pods.
 *
 * Each model in the ladder publishes its own allowance. Rather than queueing when a model is at
 * capacity, the router simply moves to the next one — the ladder already exists, so falling
 * through is both faster for the user and cheaper than sleeping on a held connection.
 *
 * Sub-1 rates (mistral-large is 0.07/s, one call per ~14s) become "one request per N seconds"
 * instead of "N requests per second".
 */
export function windowFor(rps: number): { seconds: number; max: number } {
  return rps >= 1
    ? { seconds: 1, max: Math.floor(rps) }
    : { seconds: Math.ceil(1 / rps), max: 1 };
}

/**
 * Returns false when the model is already at its allowance for the current window. Redis being
 * unreachable resolves to true — pacing is an optimisation, and a provider 429 is the backstop.
 */
export async function tryConsume(model: string, rps?: number): Promise<boolean> {
  if (!rps || rps <= 0) return true;

  const { seconds, max } = windowFor(rps);

  try {
    const redis = await getRedisClient();
    const bucket = Math.floor(Date.now() / (seconds * 1000));
    const key = `ai:rps:${model}:${bucket}`;

    const used = await redis.incr(key);
    if (used === 1) await redis.expire(key, seconds + 1);

    return used <= max;
  } catch {
    return true;
  }
}
