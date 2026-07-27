jest.mock('../../../modules/ai/config/models', () => ({
  MODEL_LADDER: [
    { provider: 'openrouter', model: 'free-a' },
    { provider: 'openrouter', model: 'free-b' },
    { provider: 'mistral', model: 'paid-best', rps: 0.5 },
    { provider: 'mistral', model: 'paid-small', rps: 5 },
  ],
}));

jest.mock('../../../modules/ai/services/model-provider.service', () => ({
  getApiKey: jest.fn(() => 'test-key'),
  createChatModel: jest.fn(),
}));

jest.mock('../../../modules/ai/services/quota.service', () => ({
  isProviderExhausted: jest.fn(async () => false),
  isModelExhausted: jest.fn(async () => false),
  markProviderExhausted: jest.fn(async () => undefined),
  markModelExhausted: jest.fn(async () => undefined),
}));

jest.mock('../../../modules/ai/services/rate-limit.service', () => ({
  tryConsume: jest.fn(async () => true),
}));

import { invokeWithFallback } from '../../../modules/ai/services/model-router.service';
import { createChatModel, getApiKey } from '../../../modules/ai/services/model-provider.service';
import {
  isModelExhausted,
  isProviderExhausted,
  markModelExhausted,
  markProviderExhausted,
} from '../../../modules/ai/services/quota.service';
import { tryConsume } from '../../../modules/ai/services/rate-limit.service';

const mockedCreate = createChatModel as jest.Mock;
const mockedGetApiKey = getApiKey as jest.Mock;
const mockedProviderExhausted = isProviderExhausted as jest.Mock;
const mockedModelExhausted = isModelExhausted as jest.Mock;
const mockedConsume = tryConsume as jest.Mock;

/** Stands in for a chat model whose invoke either resolves or throws. */
const chatModel = (behaviour: () => any) => ({
  bindTools: () => ({ invoke: async () => behaviour() }),
});

const answers = () => chatModel(() => ({ content: 'ok' }));
const throws = (error: any) => chatModel(() => { throw error; });
const rateLimited = (message: string) => Object.assign(new Error(message), { status: 429 });

const run = () => invokeWithFallback({ messages: [], tools: [], attempts: [], emit: jest.fn() });

describe('invokeWithFallback', () => {
  beforeEach(() => {
    mockedGetApiKey.mockReturnValue('test-key');
    mockedProviderExhausted.mockResolvedValue(false);
    mockedModelExhausted.mockResolvedValue(false);
    mockedConsume.mockResolvedValue(true);
  });

  it('returns the first ladder entry that answers', async () => {
    mockedCreate.mockImplementation(answers);

    expect((await run()).model).toBe('free-a');
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });

  it('falls through to the next model when one fails', async () => {
    mockedCreate.mockImplementationOnce(() => throws(new Error('boom'))).mockImplementation(answers);

    expect((await run()).model).toBe('free-b');
  });

  it('records every attempt in order', async () => {
    mockedCreate.mockImplementationOnce(() => throws(new Error('boom'))).mockImplementation(answers);

    const attempts: any[] = [];
    await invokeWithFallback({ messages: [], tools: [], attempts, emit: jest.fn() });

    expect(attempts).toEqual([
      { provider: 'openrouter', model: 'free-a', ok: false, error: 'boom' },
      { provider: 'openrouter', model: 'free-b', ok: true },
    ]);
  });

  it('skips a whole provider once its key is rejected', async () => {
    mockedCreate
      .mockImplementationOnce(() => throws(Object.assign(new Error('bad key'), { status: 401 })))
      .mockImplementation(answers);

    expect((await run()).model).toBe('paid-best');
  });
});

describe('quota handling', () => {
  beforeEach(() => {
    mockedGetApiKey.mockReturnValue('test-key');
    mockedProviderExhausted.mockResolvedValue(false);
    mockedModelExhausted.mockResolvedValue(false);
    mockedConsume.mockResolvedValue(true);
  });

  it('stands OpenRouter down for everyone when the daily allowance is gone', async () => {
    mockedCreate
      .mockImplementationOnce(() => throws(rateLimited('Rate limit exceeded: free-models-per-day')))
      .mockImplementation(answers);

    expect((await run()).model).toBe('paid-best');
    expect(markProviderExhausted).toHaveBeenCalledWith('openrouter');
  });

  it('reads the daily quota message out of a nested error body', async () => {
    mockedCreate
      .mockImplementationOnce(() => throws(Object.assign(new Error('Request failed'), {
        status: 429,
        response: { data: { error: { message: 'You have exceeded your daily limit for free models' } } },
      })))
      .mockImplementation(answers);

    expect((await run()).model).toBe('paid-best');
  });

  it('keeps a burst 429 local — one user must not cost everyone the free tier', async () => {
    mockedCreate
      .mockImplementationOnce(() => throws(rateLimited('Rate limit exceeded, please slow down')))
      .mockImplementation(answers);

    expect((await run()).model).toBe('free-b');
    expect(markProviderExhausted).not.toHaveBeenCalled();
  });

  it('does not share an ordinary failure with other users', async () => {
    mockedCreate.mockImplementationOnce(() => throws(new Error('socket hang up'))).mockImplementation(answers);

    await run();

    expect(markProviderExhausted).not.toHaveBeenCalled();
    expect(markModelExhausted).not.toHaveBeenCalled();
  });

  it('stands a single Mistral model down on its own 429', async () => {
    mockedProviderExhausted.mockImplementation(async (p: string) => p === 'openrouter');
    mockedCreate
      .mockImplementationOnce(() => throws(rateLimited('Requests rate limit exceeded')))
      .mockImplementation(answers);

    expect((await run()).model).toBe('paid-small');
    expect(markModelExhausted).toHaveBeenCalledWith('paid-best');
  });

  it('skips every model of a provider already in cooldown', async () => {
    mockedProviderExhausted.mockImplementation(async (p: string) => p === 'openrouter');
    mockedCreate.mockImplementation(answers);

    expect((await run()).model).toBe('paid-best');
    // Both free models skipped without a single HTTP call.
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });

  it('skips an individually exhausted model', async () => {
    mockedModelExhausted.mockImplementation(async (m: string) => m === 'free-a');
    mockedCreate.mockImplementation(answers);

    expect((await run()).model).toBe('free-b');
  });
});

describe('rps pacing', () => {
  beforeEach(() => {
    mockedGetApiKey.mockReturnValue('test-key');
    mockedProviderExhausted.mockResolvedValue(false);
    mockedModelExhausted.mockResolvedValue(false);
  });

  it('moves down the ladder instead of waiting when a model is at capacity', async () => {
    mockedConsume.mockImplementation(async (model: string) => model !== 'free-a');
    mockedCreate.mockImplementation(answers);

    expect((await run()).model).toBe('free-b');
  });

  it('passes each model its own published allowance', async () => {
    mockedConsume.mockResolvedValue(false);
    mockedCreate.mockImplementation(answers);

    await expect(run()).rejects.toThrow('All AI models are unavailable');
    expect(mockedConsume).toHaveBeenCalledWith('paid-best', 0.5);
    expect(mockedConsume).toHaveBeenCalledWith('paid-small', 5);
  });
});
