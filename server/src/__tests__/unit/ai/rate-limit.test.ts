const counters = new Map<string, number>();
let redisUp = true;

jest.mock('../../../utils/redisClient', () => ({
  getRedisClient: async () => {
    if (!redisUp) throw new Error('Redis unreachable');
    return {
      incr: async (key: string) => {
        const next = (counters.get(key) ?? 0) + 1;
        counters.set(key, next);
        return next;
      },
      expire: async () => 1,
    };
  },
}));

import { tryConsume, windowFor } from '../../../modules/ai/services/rate-limit.service';

describe('windowFor', () => {
  it('treats rates above 1/s as N per second', () => {
    expect(windowFor(5)).toEqual({ seconds: 1, max: 5 });
    expect(windowFor(12.5)).toEqual({ seconds: 1, max: 12 });
  });

  it('turns a sub-1 rate into one request per N seconds', () => {
    // mistral-large is 0.07/s — roughly one call every 15 seconds, not zero calls per second.
    expect(windowFor(0.07)).toEqual({ seconds: 15, max: 1 });
    expect(windowFor(0.5)).toEqual({ seconds: 2, max: 1 });
  });
});

describe('tryConsume', () => {
  beforeEach(() => {
    counters.clear();
    redisUp = true;
  });

  it('allows up to the published allowance', async () => {
    expect(await tryConsume('fast-model', 3)).toBe(true);
    expect(await tryConsume('fast-model', 3)).toBe(true);
    expect(await tryConsume('fast-model', 3)).toBe(true);
  });

  it('refuses the request that would exceed it', async () => {
    await tryConsume('fast-model', 3);
    await tryConsume('fast-model', 3);
    await tryConsume('fast-model', 3);

    expect(await tryConsume('fast-model', 3)).toBe(false);
  });

  it('gives a slow model a single slot per window', async () => {
    expect(await tryConsume('slow-model', 0.07)).toBe(true);
    expect(await tryConsume('slow-model', 0.07)).toBe(false);
  });

  it('keeps models independent of one another', async () => {
    await tryConsume('slow-model', 0.07);

    expect(await tryConsume('other-model', 0.07)).toBe(true);
  });

  it('does not pace a model with no published rate', async () => {
    for (let i = 0; i < 50; i += 1) {
      expect(await tryConsume('unpaced', undefined)).toBe(true);
    }
  });

  it('allows the call when Redis is down — the provider 429 is the backstop', async () => {
    redisUp = false;

    expect(await tryConsume('fast-model', 1)).toBe(true);
  });
});
