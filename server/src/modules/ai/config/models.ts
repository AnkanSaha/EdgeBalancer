import type { ModelDescriptor } from '../types/ai.types';

// OpenRouter free tier, fastest-first by P50 latency (openrouter.ai model pages, Aug 21 2026).
// `openrouter/free` is the auto-router catch-all and always runs last.
export const FREE_MODELS = [
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', // 0.47s / 54 tok/s
  'google/gemma-4-26b-a4b-it:free', // 0.97s / 40 tok/s
  'dots-studio/dots-3-note-preview:free', // 1.07s / 72 tok/s
  'google/gemma-4-31b-it:free', // 1.16s / 30 tok/s
  'nvidia/nemotron-nano-9b-v2:free', // 1.18s / 31 tok/s
  'cohere/north-mini-code:free', // 1.23s / 25 tok/s
  'nvidia/nemotron-3-super-120b-a12b:free', // 1.25s / 41 tok/s
  'nvidia/nemotron-3.5-lightning:free', // 1.36s / 34 tok/s
  'poolside/laguna-xs-2.1:free', // 1.40s / 12 tok/s
  'poolside/laguna-s-2.1:free', // 1.53s / 35 tok/s
  'nvidia/nemotron-3-ultra-550b-a55b:free', // 3.06s / 18 tok/s
  'nvidia/nemotron-nano-12b-v2-vl:free', // 3.17s / 13 tok/s
  'z-ai/glm-5.2:free', // 3.60s / 104 tok/s
  'nvidia/nemotron-3-nano-30b-a3b:free', // 3.73s / 47 tok/s
  'openai/gpt-oss-20b:free', // 3.77s / 16 tok/s
  'openrouter/free',
];

export const MISTRAL_MODELS = [
  { model: 'mistral-code-latest', rps: 2.08 }, // 125 req/min
  { model: 'mistral-small-2603', rps: 0.83 }, // 50 req/min
  { model: 'magistral-small-latest', rps: 0.83 },
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
  ...MISTRAL_MODELS.map(({ model, rps }) => ({ provider: 'mistral' as const, model, rps })),
];
