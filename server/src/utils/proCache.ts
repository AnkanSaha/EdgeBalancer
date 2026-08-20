import { getRedisClient } from './redisClient';
import { User } from '../models/User';

const KEY_PREFIX = 'pro:';

function redisKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

/**
 * Set Pro status in Redis with TTL matching the exact expiry time.
 * Call this when Pro is activated or extended.
 */
export async function setProCache(userId: string, proExpiresAt: Date): Promise<void> {
  try {
    const redis = await getRedisClient();
    const ttlMs = proExpiresAt.getTime() - Date.now();
    if (ttlMs <= 0) return;
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await redis.set(redisKey(userId), '1', { EX: ttlSeconds });
  } catch {
    // Redis down — cache miss is fine, falls back to DB
  }
}

/**
 * Remove Pro status from Redis. Call when Pro expires or is revoked.
 */
export async function removeProCache(userId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(redisKey(userId));
  } catch {
    // Redis down — key will expire naturally via TTL
  }
}

/**
 * Check if user has active Pro subscription.
 * Redis first (O(1) key exists check), fallback to DB.
 * On DB hit, caches the result in Redis for next time.
 */
export async function isUserPro(userId: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const cached = await redis.exists(redisKey(userId));
    if (cached) return true;
  } catch {
    // Redis down — fall through to DB
  }

  // Cache miss — check DB
  const user = await User.findById(userId).select('proExpiresAt').lean();
  if (!user?.proExpiresAt || user.proExpiresAt <= new Date()) {
    return false;
  }

  // DB says Pro — populate cache for next time
  await setProCache(userId.toString(), user.proExpiresAt);
  return true;
}
