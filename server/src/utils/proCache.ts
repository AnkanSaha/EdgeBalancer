import { getRedisClient } from './redisClient';
import { User } from '../models/User';
import { resolvePlan, PLANS, type PlanType } from '../config/plans';

const KEY_PREFIX = 'plan:';

function redisKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export interface UserPlanInfo {
  plan: PlanType;
  expiresAt: Date | null;
}

/**
 * Set plan info in Redis with TTL matching the exact expiry time.
 */
export async function setPlanCache(userId: string, plan: PlanType, planExpiresAt: Date | null): Promise<void> {
  try {
    const redis = await getRedisClient();
    if (!planExpiresAt || plan === 'free') {
      // Free plan — set with long TTL (1 year) so EXISTS check works
      await redis.set(redisKey(userId), plan, { EX: 365 * 24 * 60 * 60 });
      return;
    }
    const ttlMs = planExpiresAt.getTime() - Date.now();
    if (ttlMs <= 0) return;
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await redis.set(redisKey(userId), plan, { EX: ttlSeconds });
  } catch {
    // Redis down — cache miss is fine
  }
}

/**
 * Remove plan info from Redis.
 */
export async function removePlanCache(userId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(redisKey(userId));
  } catch {
    // Redis down — key will expire naturally
  }
}

/**
 * Get user's active plan. Redis first, DB fallback.
 * Returns resolved plan (reverts to 'free' if expired).
 */
export async function getUserPlan(userId: string): Promise<UserPlanInfo> {
  // Check Redis
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(redisKey(userId));
    if (cached && cached !== 'free') {
      // Non-free plan cached — it's valid (TTL handles expiry)
      return { plan: cached as PlanType, expiresAt: null };
    }
  } catch {
    // Redis down — fall through to DB
  }

  // DB fallback — also fixes a stale `free` left from before the user subscribed
  const user = await User.findById(userId).select('plan planExpiresAt hasEverSubscribed').lean() as any;
  if (!user) return { plan: 'free', expiresAt: null };

  const resolved = resolvePlan(user.plan, user.planExpiresAt);

  // Heal stale cache: if DB says paid but Redis had `free` (1-year TTL), overwrite it
  if (resolved !== 'free') {
    void setPlanCache(userId, resolved, user.planExpiresAt ?? null);
  } else if (user.hasEverSubscribed) {
    // Ever-subscribed but now free — keep the `free` marker fresh with short TTL check next time still hits DB quickly if they re-subscribe
    void setPlanCache(userId, 'free', null);
  }

  return { plan: resolved, expiresAt: user.planExpiresAt ?? null };
}

/** Backward-compatible: check if user has Pro plan */
export async function isUserPro(userId: string): Promise<boolean> {
  const { plan } = await getUserPlan(userId);
  return plan === 'pro' || plan === 'pro-annual';
}

/** Check if user has any paid plan (student, trial, or pro) */
export async function isUserSubscribed(userId: string): Promise<boolean> {
  const { plan } = await getUserPlan(userId);
  return plan !== 'free';
}
