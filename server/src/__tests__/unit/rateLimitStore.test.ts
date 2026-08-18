import { RedisSlidingWindowStore } from '../../middleware/config/rateLimitStore';
import { getRedisClient } from '../../utils/redisClient';

jest.mock('../../utils/redisClient', () => ({ getRedisClient: jest.fn() }));

const mockedGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>;

const incr = (store: RedisSlidingWindowStore, key: string) =>
  new Promise<{ current: number; ttl: number }>((resolve, reject) =>
    store.incr(key, (err, res) => (err ? reject(err) : resolve(res!)), 60_000)
  );

const fakeRedis = (evalSha: jest.Mock) =>
  ({ scriptLoad: jest.fn().mockResolvedValue('sha1'), evalSha } as any);

describe('RedisSlidingWindowStore', () => {
  beforeEach(() => jest.clearAllMocks());

  it('namespaces keys per route so tiers count independently', async () => {
    const evalSha = jest.fn().mockResolvedValue([1, 60_000]);
    mockedGetRedisClient.mockResolvedValue(fakeRedis(evalSha));

    const root = new RedisSlidingWindowStore();
    const login = root.child({ routeInfo: { method: 'POST', url: '/api/auth/login' } });
    const profile = root.child({ routeInfo: { method: 'GET', url: '/api/user/profile' } });

    await incr(login, '1.2.3.4');
    await incr(profile, '1.2.3.4');

    expect(evalSha.mock.calls[0][1].keys[0]).toBe('ratelimit:POST:/api/auth/login:1.2.3.4');
    expect(evalSha.mock.calls[1][1].keys[0]).toBe('ratelimit:GET:/api/user/profile:1.2.3.4');
  });

  it('returns the count and ttl the script reports', async () => {
    mockedGetRedisClient.mockResolvedValue(fakeRedis(jest.fn().mockResolvedValue([7, 12_345])));

    const result = await incr(new RedisSlidingWindowStore(), '1.2.3.4');

    expect(result).toEqual({ current: 7, ttl: 12_345 });
  });

  it('reloads the script and retries once when Redis dropped its cache', async () => {
    const evalSha = jest
      .fn()
      .mockRejectedValueOnce(new Error('NOSCRIPT No matching script'))
      .mockResolvedValueOnce([1, 60_000]);
    const redis = fakeRedis(evalSha);
    mockedGetRedisClient.mockResolvedValue(redis);

    await expect(incr(new RedisSlidingWindowStore(), '1.2.3.4')).resolves.toEqual({
      current: 1,
      ttl: 60_000,
    });
    expect(evalSha).toHaveBeenCalledTimes(2);
    expect(redis.scriptLoad).toHaveBeenCalledTimes(2);
  });

  it('propagates non-NOSCRIPT failures so skipOnError can fail open', async () => {
    const evalSha = jest.fn().mockRejectedValue(new Error('READONLY'));
    mockedGetRedisClient.mockResolvedValue(fakeRedis(evalSha));

    await expect(incr(new RedisSlidingWindowStore(), '1.2.3.4')).rejects.toThrow('READONLY');
    expect(evalSha).toHaveBeenCalledTimes(1);
  });
});
