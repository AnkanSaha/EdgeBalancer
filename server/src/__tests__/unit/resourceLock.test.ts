const store = new Map<string, string>();
let redisUp = true;

jest.mock('../../utils/redisClient', () => ({
  getRedisClient: async () => {
    if (!redisUp) throw new Error('Redis unreachable');
    return {
      set: async (key: string, value: string, opts?: { NX?: boolean }) => {
        if (opts?.NX && store.has(key)) return null;
        store.set(key, value);
        return 'OK';
      },
      eval: async (_script: string, opts: { keys: string[]; arguments: string[] }) => {
        const [key] = opts.keys;
        const [token] = opts.arguments;
        if (store.get(key) !== token) return 0;
        store.delete(key);
        return 1;
      },
    };
  },
}));

import { acquireLock, releaseLock } from '../../utils/resourceLock';

describe('resourceLock', () => {
  beforeEach(() => {
    store.clear();
    redisUp = true;
  });

  it('lets the first caller through', async () => {
    expect(await acquireLock('lb:create:acct:api')).not.toBeNull();
  });

  it('refuses a second caller while the first holds it', async () => {
    await acquireLock('lb:create:acct:api');

    expect(await acquireLock('lb:create:acct:api')).toBeNull();
  });

  it('frees the key on release', async () => {
    const first = await acquireLock('lb:create:acct:api');
    await releaseLock(first);

    expect(await acquireLock('lb:create:acct:api')).not.toBeNull();
  });

  it('does not block a different name or a different account', async () => {
    await acquireLock('lb:create:acct-a:api');

    expect(await acquireLock('lb:create:acct-a:web')).not.toBeNull();
    expect(await acquireLock('lb:create:acct-b:api')).not.toBeNull();
  });

  it('never deletes a lock another holder now owns', async () => {
    const stale = { key: 'lb:create:acct:api', token: 'expired-token' };
    const current = await acquireLock('lb:create:acct:api');

    await releaseLock(stale);

    // The current holder still owns it, so a third caller is still refused.
    expect(await acquireLock('lb:create:acct:api')).toBeNull();
    expect(current).not.toBeNull();
  });

  it('proceeds unlocked when Redis is down rather than blocking deploys', async () => {
    redisUp = false;

    const handle = await acquireLock('lb:create:acct:api');

    expect(handle).not.toBeNull();
    expect(handle?.token).toBe('');
    await expect(releaseLock(handle)).resolves.toBeUndefined();
  });
});
