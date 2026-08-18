import { getRedisClient } from '../../utils/redisClient';

// Sliding window counter: current slot plus the fraction of the previous slot
// still inside the window, so the count decays instead of resetting at the
// boundary. Two integers per key, whatever the traffic volume.
const SCRIPT = `
  local window = tonumber(ARGV[1])
  local t = redis.call('TIME')
  local now = (tonumber(t[1]) * 1000) + math.floor(tonumber(t[2]) / 1000)
  local slot = math.floor(now / window)
  local elapsed = now % window

  local curKey = KEYS[1] .. ':' .. slot
  local prevKey = KEYS[1] .. ':' .. (slot - 1)

  local cur = redis.call('INCR', curKey)
  if cur == 1 then
    redis.call('PEXPIRE', curKey, window * 2)
  end

  local prev = tonumber(redis.call('GET', prevKey)) or 0
  local estimated = math.floor((prev * (1 - (elapsed / window))) + cur)

  return { estimated, window - elapsed }
`;

type IncrResult = { current: number; ttl: number };
type IncrCallback = (err: Error | null, result?: IncrResult) => void;

export class RedisSlidingWindowStore {
  private readonly prefix: string;
  private shaPromise: Promise<string> | null = null;

  constructor(options: { nameSpace?: string } = {}) {
    this.prefix = options.nameSpace ?? 'ratelimit:';
  }

  incr(key: string, cb: IncrCallback, timeWindow: number): void {
    this.run(this.prefix + key, timeWindow).then(
      (result) => cb(null, result),
      (err) => cb(err as Error)
    );
  }

  // routeInfo is what the plugin passes at runtime; its published type omits it.
  child(routeOptions: Record<string, any>): RedisSlidingWindowStore {
    const { method = '', url = '' } = (routeOptions.routeInfo ?? {}) as { method?: string; url?: string };
    return new RedisSlidingWindowStore({ nameSpace: `${this.prefix}${method}:${url}:` });
  }

  private async run(key: string, timeWindow: number): Promise<IncrResult> {
    const redis = await getRedisClient();
    const args = { keys: [key], arguments: [String(timeWindow)] };

    try {
      return toResult(await redis.evalSha(await this.sha(redis), args));
    } catch (err) {
      // Redis restarted and dropped its script cache.
      if (!(err as Error)?.message?.includes('NOSCRIPT')) throw err;
      this.shaPromise = null;
      return toResult(await redis.evalSha(await this.sha(redis), args));
    }
  }

  private sha(redis: Awaited<ReturnType<typeof getRedisClient>>): Promise<string> {
    this.shaPromise ??= redis.scriptLoad(SCRIPT).then((s) => s as string);
    return this.shaPromise;
  }
}

function toResult(raw: unknown): IncrResult {
  const [current, ttl] = raw as [number, number];
  return { current, ttl };
}
