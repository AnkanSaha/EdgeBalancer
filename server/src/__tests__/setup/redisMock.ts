// The rate limiter puts Redis in the path of every route, so no test should
// need a live instance. evalSha stands in for the sliding-window Lua script.
jest.mock('../../utils/redisClient', () => {
  const slots = new Map<string, number>();

  const client = {
    get: async () => null,
    set: async () => 'OK',
    exists: async () => 0,
    del: async () => 1,
    scriptLoad: async () => 'test-sha',
    // Used by resourceLock's compare-and-delete release.
    eval: async () => 1,
    evalSha: async (_sha: string, opts: { keys: string[]; arguments: string[] }) => {
      const window = Number(opts.arguments[0]);
      const now = Date.now();
      const slotKey = `${opts.keys[0]}:${Math.floor(now / window)}`;
      const current = (slots.get(slotKey) ?? 0) + 1;
      slots.set(slotKey, current);
      return [current, window - (now % window)];
    },
  };

  return {
    getRedisClient: async () => client,
    closeRedisClient: async () => undefined,
  };
});

export {};
