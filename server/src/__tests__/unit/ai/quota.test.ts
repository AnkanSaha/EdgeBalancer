const store = new Map<string, number>();
let redisUp = true;

jest.mock('../../../utils/redisClient', () => ({
  getRedisClient: async () => {
    if (!redisUp) throw new Error('Redis unreachable');
    return {
      set: async (key: string, _v: string, opts: { EX: number }) => {
        store.set(key, opts.EX);
        return 'OK';
      },
      exists: async (key: string) => (store.has(key) ? 1 : 0),
      ttl: async (key: string) => store.get(key) ?? -2,
    };
  },
}));

import {
  MODEL_COOLDOWN_SECONDS,
  PROVIDER_COOLDOWN_SECONDS,
  isModelExhausted,
  isProviderExhausted,
  markModelExhausted,
  markProviderExhausted,
  providerCooldownRemaining,
} from '../../../modules/ai/services/quota.service';

describe('quota cooldowns', () => {
  beforeEach(() => {
    store.clear();
    redisUp = true;
  });

  it('stands a provider down for a full day', async () => {
    await markProviderExhausted('openrouter');

    expect(await isProviderExhausted('openrouter')).toBe(true);
    expect(store.get('ai:quota:provider:openrouter')).toBe(PROVIDER_COOLDOWN_SECONDS);
    expect(PROVIDER_COOLDOWN_SECONDS).toBe(24 * 60 * 60);
  });

  it('does not stand down the other provider', async () => {
    await markProviderExhausted('openrouter');

    expect(await isProviderExhausted('mistral')).toBe(false);
  });

  it('holds a single model down only briefly', async () => {
    await markModelExhausted('mistral-large-2512');

    expect(await isModelExhausted('mistral-large-2512')).toBe(true);
    expect(store.get('ai:quota:model:mistral-large-2512')).toBe(MODEL_COOLDOWN_SECONDS);
    expect(await isModelExhausted('ministral-3b-2512')).toBe(false);
  });

  it('reports how long the cooldown has left', async () => {
    await markProviderExhausted('openrouter');

    expect(await providerCooldownRemaining('openrouter')).toBe(PROVIDER_COOLDOWN_SECONDS);
    expect(await providerCooldownRemaining('mistral')).toBe(0);
  });

  it('honours a Retry-After over the default', async () => {
    await markModelExhausted('mistral-large-2512', 7);

    expect(store.get('ai:quota:model:mistral-large-2512')).toBe(7);
  });

  it('rounds a fractional Retry-After up to a whole second', async () => {
    await markModelExhausted('mistral-large-2512', 2.4);

    expect(store.get('ai:quota:model:mistral-large-2512')).toBe(3);
  });

  it('falls back to the default for a zero or negative Retry-After', async () => {
    await markModelExhausted('mistral-large-2512', 0);

    expect(store.get('ai:quota:model:mistral-large-2512')).toBe(MODEL_COOLDOWN_SECONDS);
  });

  it('never parks anything longer than a day on an upstream header', async () => {
    await markModelExhausted('mistral-large-2512', 60 * 60 * 24 * 30);

    expect(store.get('ai:quota:model:mistral-large-2512')).toBe(24 * 60 * 60);
  });

  it('reads as usable when Redis is down rather than disabling every model', async () => {
    await markProviderExhausted('openrouter');
    redisUp = false;

    expect(await isProviderExhausted('openrouter')).toBe(false);
    expect(await isModelExhausted('anything')).toBe(false);
    await expect(markProviderExhausted('mistral')).resolves.toBeUndefined();
  });
});
