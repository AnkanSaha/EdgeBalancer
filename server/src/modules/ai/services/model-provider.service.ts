import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ModelDescriptor, ModelProvider } from '../types/ai.types';

// Both providers expose an OpenAI-compatible chat-completions API, so one client covers the
// whole ladder — no second SDK, and no ESM-only package in the require path.
const BASE_URLS: Record<ModelProvider, string> = {
  mistral: 'https://api.mistral.ai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};

export function getApiKey(provider: ModelProvider): string | undefined {
  return provider === 'mistral' ? process.env.MISTRAL_API_KEY : process.env.OPENROUTER_API_KEY;
}

export function hasAnyProviderConfigured(): boolean {
  return Boolean(process.env.MISTRAL_API_KEY || process.env.OPENROUTER_API_KEY);
}

// The SDK default is measured in minutes, and an endpoint that accepts then stalls would hold the
// SSE stream for all of it, once per ladder entry.
const CALL_TIMEOUT_MS = 45_000;

export function createChatModel({ provider, model }: ModelDescriptor): BaseChatModel {
  const apiKey = getApiKey(provider);
  if (!apiKey) {
    throw new Error(`No API key configured for provider ${provider}`);
  }

  return new ChatOpenAI({
    model,
    apiKey,
    temperature: 0,
    maxRetries: 0,
    timeout: CALL_TIMEOUT_MS,
    configuration: { baseURL: BASE_URLS[provider] },
  });
}
