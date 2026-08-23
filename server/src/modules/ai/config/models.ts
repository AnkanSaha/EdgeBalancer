import type { ModelDescriptor } from '../types/ai.types';

// OpenRouter free tier, quality-gated: only large-flagship-class models survive (nano/mini/xs
// variants removed). Ordered fastest-first by P50 latency (openrouter.ai pages, Aug 21 2026).
// `openrouter/free` is the auto-router catch-all and always runs last.
export const FREE_MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free', // 120B MoE / 12B active — 1.25s / 41 tok/s
  'nvidia/nemotron-3-ultra-550b-a55b:free', // 550B MoE / 55B active — 3.06s / 18 tok/s
  'z-ai/glm-5.2:free', // flagship reasoning — 3.60s / 104 tok/s
];

// OpenCode Zen free tier — no API key required, 12/12 CRUD verified.
// Falls through to Mistral on 429 or error.
export const ZEN_MODELS = [
  { model: 'laguna-s-2.1-free' },
];

export const MISTRAL_MODELS = [
  { model: 'mistral-code-latest', rps: 2.08 }, // 125 req/min
  { model: 'mistral-small-2603', rps: 0.83 }, // 50 req/min — verified 26/26
  { model: 'mistral-small-latest', rps: 0.83 }, // verified 26/26
  { model: 'magistral-small-latest', rps: 0.83 }, // verified 26/26
  { model: 'magistral-medium-latest', rps: 0.83 },
  { model: 'devstral-latest', rps: 0.83 },
  { model: 'devstral-medium-latest', rps: 0.83 },
  { model: 'mistral-code-agent-latest', rps: 0.83 },
  { model: 'mistral-vibe-cli-with-tools', rps: 0.83 },
  { model: 'mistral-vibe-cli-fast', rps: 0.83 },
  { model: 'mistral-large-2512', rps: 0.07 }, // 4 req/min
];

export const MODEL_LADDER: ModelDescriptor[] = [
  ...FREE_MODELS.map((model) => ({ provider: 'openrouter' as const, model })),
  ...ZEN_MODELS.map(({ model }) => ({ provider: 'opencode' as const, model })),
  ...MISTRAL_MODELS.map(({ model, rps }) => ({ provider: 'mistral' as const, model, rps })),
];
