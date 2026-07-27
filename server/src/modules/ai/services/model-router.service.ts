import type { BaseMessage } from '@langchain/core/messages';
import type { AIMessage } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { MODEL_LADDER } from '../config/models';
import { createChatModel, getApiKey } from './model-provider.service';
import {
  isModelExhausted,
  isProviderExhausted,
  markModelExhausted,
  markProviderExhausted,
} from './quota.service';
import { tryConsume } from './rate-limit.service';
import type { RunLogger } from './log.service';
import type { AiEmitter, ModelAttempt, ModelDescriptor, ModelProvider } from '../types/ai.types';

const NOOP_LOGGER: RunLogger = { info: () => undefined, warn: () => undefined };

export interface InvokeResult {
  response: AIMessage;
  model: string;
}

const statusOf = (error: any): number | undefined =>
  error?.status ?? error?.statusCode ?? error?.response?.status;

// Providers bury the useful text at different depths depending on whether the SDK or the HTTP
// layer threw, so check every place it plausibly lands.
const messageOf = (error: any): string =>
  [
    error?.message,
    error?.error?.message,
    error?.response?.data?.error?.message,
    error?.response?.data?.message,
  ]
    .filter(Boolean)
    .join(' ');

// OpenRouter returns 429 for two unrelated conditions: a short per-minute burst, and the
// account-wide free-model allowance being spent for the day. Only the daily one justifies
// standing the provider down.
const DAILY_QUOTA_PATTERN = /free-models-per-day|per[-\s]?day|daily limit|daily quota|add (more )?credits/i;

/**
 * Both providers answer a 429 with `Retry-After` (seconds). It is more accurate than any fixed
 * guess — Mistral's per-second request cap clears almost immediately, while its per-minute token
 * budget takes up to a minute — so when it is present it decides the cooldown.
 */
const retryAfterSeconds = (error: any): number | undefined => {
  const headers = error?.headers ?? error?.response?.headers;
  if (!headers) return undefined;

  const raw = typeof headers.get === 'function' ? headers.get('retry-after') : headers['retry-after'];
  const seconds = Number(raw);

  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
};

const isAuthFailure = (error: any): boolean => {
  const status = statusOf(error);
  return status === 401 || status === 403 ||
    /\b(401|403|unauthorized|invalid api key|no api key)\b/i.test(messageOf(error));
};

type Disposition = 'provider-exhausted' | 'model-exhausted' | 'provider-dead' | 'transient';

/**
 * Only the first two are shared with other users. A timeout or a 500 is this run's problem alone
 * and is skipped locally, so one user's bad minute never stands a model down for everybody.
 */
function classify(error: any, provider: ModelProvider): Disposition {
  if (isAuthFailure(error)) return 'provider-dead';

  if (statusOf(error) === 429) {
    if (provider === 'openrouter') {
      return DAILY_QUOTA_PATTERN.test(messageOf(error)) ? 'provider-exhausted' : 'transient';
    }
    // Mistral's limits are published per model, so a 429 stands that one model down briefly.
    return 'model-exhausted';
  }

  return 'transient';
}

export async function invokeWithFallback(params: {
  messages: BaseMessage[];
  tools: StructuredToolInterface[];
  attempts: ModelAttempt[];
  emit: AiEmitter;
  log?: RunLogger;
}): Promise<InvokeResult> {
  const { messages, tools, attempts, emit, log = NOOP_LOGGER } = params;

  const deadProviders = new Set<ModelProvider>();
  const skippedThisRun = new Set<string>();
  const exhaustedProviders = new Set<ModelProvider>();
  let lastError: Error | null = null;
  let previousModel: string | null = null;

  for (const descriptor of MODEL_LADDER) {
    const { provider, model, rps } = descriptor;

    if (deadProviders.has(provider) || exhaustedProviders.has(provider)) continue;
    if (!getApiKey(provider)) continue;
    if (skippedThisRun.has(model)) continue;

    if (await isProviderExhausted(provider)) {
      log.info(`${provider} is in quota cooldown — skipping its models`);
      exhaustedProviders.add(provider);
      continue;
    }

    if (await isModelExhausted(model)) continue;

    // Pacing, not queueing: at capacity we move down the ladder rather than wait.
    if (!(await tryConsume(model, rps))) {
      log.info(`${model} is at its ${rps}/s allowance — trying the next model`);
      continue;
    }

    const startedAt = Date.now();

    try {
      log.info(`calling ${provider}/${model}…`);
      const response = await invokeOne(descriptor, messages, tools);
      attempts.push({ provider, model, ok: true });
      log.info(`${model} replied in ${Date.now() - startedAt}ms`);
      return { response, model };
    } catch (error: any) {
      lastError = error;
      attempts.push({ provider, model, ok: false, error: error?.message ?? 'Unknown error' });

      const disposition = classify(error, provider);
      log.warn(`${model} failed after ${Date.now() - startedAt}ms (${disposition}): ${error?.message}`);

      const retryAfter = retryAfterSeconds(error);

      if (disposition === 'provider-dead') {
        deadProviders.add(provider);
      } else if (disposition === 'provider-exhausted') {
        exhaustedProviders.add(provider);
        await markProviderExhausted(provider, retryAfter);
        log.warn(`${provider} quota exhausted — standing it down for ${retryAfter ?? 'the default 24h'}`);
      } else if (disposition === 'model-exhausted') {
        await markModelExhausted(model, retryAfter);
        log.warn(`${model} rate limited — cooling down for ${retryAfter ?? 60}s`);
      } else {
        skippedThisRun.add(model);
      }

      emit('model_switch', {
        from: previousModel ?? model,
        to: model,
        reason: error?.message ?? 'Model call failed',
      });
      previousModel = model;
    }
  }

  throw new Error(
    `All AI models are unavailable${lastError ? `: ${lastError.message}` : ''}`,
  );
}

async function invokeOne(
  descriptor: ModelDescriptor,
  messages: BaseMessage[],
  tools: StructuredToolInterface[],
): Promise<AIMessage> {
  const chat = createChatModel(descriptor);

  if (!chat.bindTools) {
    throw new Error(`${descriptor.model} does not support tool calling`);
  }

  return (await chat.bindTools(tools).invoke(messages)) as AIMessage;
}
