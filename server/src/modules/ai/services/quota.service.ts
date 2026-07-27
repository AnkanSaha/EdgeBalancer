import { getRedisClient } from '../../../utils/redisClient';
import type { ModelProvider } from '../types/ai.types';

// OpenRouter's free allowance is account-wide and resets daily, so once it is gone it is gone
// for every user of this deployment until the reset.
export const PROVIDER_COOLDOWN_SECONDS = 24 * 60 * 60;

// Mistral enforces two limits per model: requests-per-second, which clears within a second, and
// tokens-per-minute, which clears within the minute. `tryConsume` already paces us against the
// former, so a 429 that still gets through is most likely the token budget — hence a full minute.
// A Retry-After on the response always wins over this default.
export const MODEL_COOLDOWN_SECONDS = 60;

// Never trust an upstream header to park a model for hours.
const MAX_COOLDOWN_SECONDS = 24 * 60 * 60;

const providerKey = (provider: ModelProvider) => `ai:quota:provider:${provider}`;
const modelKey = (model: string) => `ai:quota:model:${model}`;

/**
 * Only genuine quota exhaustion is recorded here, and it is deliberately global: the upstream
 * allowance is shared by everyone on this deployment, so hiding that from other users would just
 * make them wait for the same rejection. Transient failures are NOT recorded — the router skips
 * those for the current run only.
 */
export async function markProviderExhausted(provider: ModelProvider, seconds?: number): Promise<void> {
  await write(providerKey(provider), clamp(seconds, PROVIDER_COOLDOWN_SECONDS));
}

export async function markModelExhausted(model: string, seconds?: number): Promise<void> {
  await write(modelKey(model), clamp(seconds, MODEL_COOLDOWN_SECONDS));
}

const clamp = (seconds: number | undefined, fallback: number): number =>
  seconds && seconds > 0 ? Math.min(Math.ceil(seconds), MAX_COOLDOWN_SECONDS) : fallback;

export async function isProviderExhausted(provider: ModelProvider): Promise<boolean> {
  return exists(providerKey(provider));
}

export async function isModelExhausted(model: string): Promise<boolean> {
  return exists(modelKey(model));
}

/** Seconds until the provider is usable again, or 0 if it already is. */
export async function providerCooldownRemaining(provider: ModelProvider): Promise<number> {
  try {
    const redis = await getRedisClient();
    const ttl = await redis.ttl(providerKey(provider));
    return ttl > 0 ? ttl : 0;
  } catch {
    return 0;
  }
}

// A Redis outage must never disable the feature: an unreadable cooldown reads as "not exhausted",
// matching how the rate limiter treats the same failure.
async function exists(key: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    return (await redis.exists(key)) === 1;
  } catch {
    return false;
  }
}

async function write(key: string, seconds: number): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.set(key, '1', { EX: seconds });
  } catch {
    // Best-effort: losing the marker costs wasted calls, never correctness.
  }
}
