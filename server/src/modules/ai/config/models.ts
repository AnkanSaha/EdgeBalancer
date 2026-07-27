import type { ModelDescriptor } from '../types/ai.types';

// OpenRouter free tier, best-first. `openrouter/free` is the auto-router catch-all.
export const FREE_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'google/gemma-4-26b-a4b-it:free',
  'openai/gpt-oss-20b:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'cohere/north-mini-code:free',
  'poolside/laguna-s-2.1:free',
  'poolside/laguna-xs-2.1:free',
  'openrouter/free',
];

// Mistral, best-first. `rps` is the account's request-per-second allowance.
export const MISTRAL_MODELS = [
  { model: 'mistral-large-2512', rps: 0.07 },
  { model: 'mistral-medium-latest', rps: 0.83 },
  { model: 'magistral-medium-2509', rps: 0.08 },
  { model: 'mistral-medium-2508', rps: 0.38 },
  { model: 'mistral-medium-2505', rps: 0.42 },
  { model: 'magistral-small-2509', rps: 0.03 },
  { model: 'devstral-2512', rps: 0.83 },
  { model: 'codestral-2508', rps: 2.08 },
  { model: 'mistral-small-2603', rps: 0.83 },
  { model: 'mistral-small-2506', rps: 5.0 },
  { model: 'open-mistral-nemo', rps: 0.5 },
  { model: 'labs-leanstral-1-5-1', rps: 0.63 },
  { model: 'ministral-14b-2512', rps: 0.5 },
  { model: 'ministral-8b-2512', rps: 3.13 },
  { model: 'ministral-3b-2512', rps: 12.5 },
];

// OpenRouter's free tier first — it is capped per day, so spend it before it resets and keep
// the metered Mistral quota in reserve for when that cap runs out. Mistral entries carry their
// published rps so the router can pace them instead of provoking a 429; OpenRouter's free tier
// publishes no per-model figure, so those are unpaced.
export const MODEL_LADDER: ModelDescriptor[] = [
  ...FREE_MODELS.map((model) => ({ provider: 'openrouter' as const, model })),
  ...MISTRAL_MODELS.map(({ model, rps }) => ({ provider: 'mistral' as const, model, rps })),
];
