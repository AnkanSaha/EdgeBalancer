import { randomUUID } from 'crypto';
import { getRedisClient } from './redisClient';

const ACQUIRE_POLL_INTERVAL_MS = 500;
const ACQUIRE_TIMEOUT_MS = 120_000;

/**
 * Distributed semaphore backed by Redis.
 *
 * Uses a sorted set to track active holders and a counter for the current count.
 * If a pod crashes, expired tokens are cleaned up automatically (TTL-based).
 *
 * Fail-open: if Redis is down, the caller proceeds without limiting.
 */
export async function acquireSemaphore(
  name: string,
  maxConcurrency: number,
  ttlSeconds: number,
): Promise<{ release: () => Promise<void> } | null> {
  const key = `sem:${name}`;
  const activeKey = `${key}:active`;
  const token = randomUUID();
  const deadline = Date.now() + ACQUIRE_TIMEOUT_MS;

  try {
    const redis = await getRedisClient();

    while (Date.now() < deadline) {
      // Clean up expired tokens first
      await cleanExpired(redis, activeKey);

      // Try to acquire a slot
      const result = await redis.eval(
        ACQUIRE_SCRIPT,
        { keys: [key, activeKey], arguments: [token, String(maxConcurrency), String(ttlSeconds)] },
      ) as number;

      if (result === 1) {
        return {
          release: async () => {
            try {
              await redis.eval(RELEASE_SCRIPT, { keys: [key, activeKey], arguments: [token] });
            } catch (err: any) {
              console.error(`Semaphore ${name} release failed: ${err.message}`);
            }
          },
        };
      }

      // Slot not available — wait and try again
      await sleep(ACQUIRE_POLL_INTERVAL_MS);
    }

    console.warn(`Semaphore ${name}: timed out after ${ACQUIRE_TIMEOUT_MS}ms, proceeding anyway`);
    return { release: async () => {} };
  } catch (err: any) {
    console.error(`Semaphore ${name} unavailable, proceeding: ${err.message}`);
    return { release: async () => {} };
  }
}

async function cleanExpired(redis: any, activeKey: string): Promise<void> {
  try {
    await redis.zremrangebyscore(activeKey, 0, Date.now());
  } catch {
    // best effort
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// KEYS[1] = counter key, KEYS[2] = sorted set
// ARGV[1] = token, ARGV[2] = max concurrency, ARGV[3] = TTL seconds
const ACQUIRE_SCRIPT = `
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
local max = tonumber(ARGV[2])
if count >= max then return 0 end
redis.call('SET', KEYS[1], count + 1)
local expireAt = tonumber(ARGV[3]) * 1000 + tonumber(redis.call('TIME')[1]) * 1000
redis.call('ZADD', KEYS[2], expireAt, ARGV[1])
return 1
`;

// KEYS[1] = counter key, KEYS[2] = sorted set
// ARGV[1] = token
const RELEASE_SCRIPT = `
if redis.call('ZREM', KEYS[2], ARGV[1]) == 1 then
  local count = tonumber(redis.call('GET', KEYS[1]) or '1')
  if count > 1 then
    redis.call('SET', KEYS[1], count - 1)
  else
    redis.call('DEL', KEYS[1])
  end
  return 1
end
return 0
`;
