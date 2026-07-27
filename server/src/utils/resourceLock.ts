import { randomUUID } from 'crypto';
import { getRedisClient } from './redisClient';

// Long enough to cover a full create (several Cloudflare round-trips with retries), short enough
// that a pod crashing mid-run does not block the name for long.
const DEFAULT_TTL_SECONDS = 180;

// Releasing by value, not just by key, so a run whose lock already expired cannot delete the
// lock a later run legitimately holds.
const RELEASE_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;

export interface LockHandle {
  key: string;
  token: string;
}

/**
 * Best-effort mutual exclusion across pods.
 *
 * Returns null when another holder has the key. Redis being unreachable resolves to a handle
 * with no token: the caller proceeds unlocked rather than failing, matching how the rate limiter
 * and circuit breaker treat an outage.
 *
 * ponytail: fail-open on a Redis outage — the check-then-act race reopens for the duration.
 * Switch to fail-closed if correctness there ever outweighs availability.
 */
export async function acquireLock(key: string, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<LockHandle | null> {
  const token = randomUUID();

  try {
    const redis = await getRedisClient();
    const stored = await redis.set(key, token, { NX: true, EX: ttlSeconds });
    return stored === null ? null : { key, token };
  } catch (error: any) {
    console.error(`Lock unavailable for ${key}, proceeding without it: ${error.message}`);
    return { key, token: '' };
  }
}

export async function releaseLock(handle: LockHandle | null): Promise<void> {
  if (!handle?.token) return;

  try {
    const redis = await getRedisClient();
    await redis.eval(RELEASE_SCRIPT, { keys: [handle.key], arguments: [handle.token] });
  } catch (error: any) {
    console.error(`Lock release failed for ${handle.key}: ${error.message}`);
  }
}
