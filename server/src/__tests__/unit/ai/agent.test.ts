jest.mock('../../../modules/ai/services/model-router.service', () => ({
  invokeWithFallback: jest.fn(),
  createRouterState: () => ({ skippedModels: new Set(), deadProviders: new Set(), exhaustedProviders: new Set() }),
}));

jest.mock('../../../modules/ai/services/tools.service', () => ({
  buildTools: jest.fn(),
  MUTATING_TOOL_NAMES: ['create_load_balancer', 'update_load_balancer', 'delete_load_balancer', 'pause_load_balancer', 'resume_load_balancer'],
}));

import { createTrace, runAgent } from '../../../modules/ai/services/agent.service';
import { invokeWithFallback } from '../../../modules/ai/services/model-router.service';
import { buildTools } from '../../../modules/ai/services/tools.service';

const mockedInvoke = invokeWithFallback as jest.Mock;
const mockedBuildTools = buildTools as jest.Mock;

const aiMessage = (toolCalls: any[] = [], content = '') => ({
  response: { content, tool_calls: toolCalls },
  model: 'test-model',
});

const call = (name: string, args: Record<string, unknown> = {}) => ({ name, args, id: `${name}-1` });

const fakeTool = (name: string, invoke: jest.Mock) => ({ name, invoke });

const execute = (prompt = 'create a load balancer') =>
  runAgent({
    runId: 'run-1',
    userId: 'user-1',
    userEmail: null,
    prompt,
    cancellation: { isCancelled: () => false, throwIfCancelled: async () => undefined } as any,
    emit: jest.fn(),
    trace: createTrace(),
  });

describe('runAgent failure handling', () => {
  it('stops after the same tool fails twice instead of looping', async () => {
    const failing = jest.fn(async () => JSON.stringify({ ok: false, error: 'zoneId must be 32 characters' }));
    mockedBuildTools.mockReturnValue([fakeTool('create_load_balancer', failing)]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      // The RCA call that follows the second failure.
      .mockResolvedValueOnce(aiMessage([], 'The zone id you gave was too short.'));

    const result = await execute();

    expect(failing).toHaveBeenCalledTimes(2);
    expect(result.outcome).toBe('failure');
    expect(result.message).toBe('The zone id you gave was too short.');
  });

  it('stops on the first conflict instead of letting the model rename around it', async () => {
    const conflicting = jest.fn(async () => {
      throw Object.assign(new Error('A Worker with this name already exists in your Cloudflare account.'), { statusCode: 409 });
    });
    mockedBuildTools.mockReturnValue([fakeTool('create_load_balancer', conflicting)]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer', { name: 'ankan-in' })]))
      .mockResolvedValueOnce(aiMessage([], 'That Worker name is already taken.'));

    const result = await execute();

    expect(conflicting).toHaveBeenCalledTimes(1);
    expect(result.outcome).toBe('failure');
    expect(result.message).toBe('That Worker name is already taken.');
  });

  it('still retries a non-conflict failure once', async () => {
    const failing = jest.fn(async () => {
      throw Object.assign(new Error('Cloudflare timed out'), { statusCode: 504 });
    });
    mockedBuildTools.mockReturnValue([fakeTool('create_load_balancer', failing)]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      .mockResolvedValueOnce(aiMessage([], 'Cloudflare was unreachable.'));

    await execute();

    expect(failing).toHaveBeenCalledTimes(2);
  });

  it('falls back to the raw tool error when the RCA call fails', async () => {
    const failing = jest.fn(async () => JSON.stringify({ ok: false, error: 'Hostname already assigned' }));
    mockedBuildTools.mockReturnValue([fakeTool('create_load_balancer', failing)]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      .mockRejectedValueOnce(new Error('all models down'));

    const result = await execute();

    expect(result.outcome).toBe('failure');
    expect(result.message).toBe('Hostname already assigned');
  });

  it('does not report success when every tool failed and nothing was created', async () => {
    const failing = jest.fn(async () => JSON.stringify({ ok: false, error: 'nope' }));
    mockedBuildTools.mockReturnValue([fakeTool('create_load_balancer', failing)]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      .mockResolvedValueOnce(aiMessage([], 'I could not do it.'))
      .mockResolvedValueOnce(aiMessage([], 'The domain was already taken.'));

    const result = await execute();

    expect(result.outcome).toBe('failure');
  });

  it('resets a tool failure count once it succeeds', async () => {
    const flaky = jest
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ ok: false, error: 'transient' }))
      .mockResolvedValueOnce(JSON.stringify({ ok: true, data: { fullDomain: 'api.example.com' } }))
      .mockResolvedValueOnce(JSON.stringify({ ok: false, error: 'transient' }));
    mockedBuildTools.mockReturnValue([fakeTool('list_zones', flaky)]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('list_zones')]))
      .mockResolvedValueOnce(aiMessage([call('list_zones')]))
      .mockResolvedValueOnce(aiMessage([call('list_zones')]))
      .mockResolvedValueOnce(aiMessage([], 'Done.'))
      .mockResolvedValue(aiMessage([], 'RCA text.'));

    await execute();

    // Three calls means the success in between cleared the counter — otherwise it stops at two.
    expect(flaky).toHaveBeenCalledTimes(3);
  });

  it('stops the run as soon as a destructive step is proposed', async () => {
    // buildTools is what populates `proposed`, so mirror that side effect here.
    const proposing = jest.fn(async () => JSON.stringify({ ok: true, pendingConfirmation: true }));
    mockedBuildTools.mockImplementation((ctx: any) => {
      ctx.proposed.current = {
        action: 'delete',
        loadBalancerId: 'lb-1',
        name: 'edge-api',
        fullDomain: 'api.example.com',
        summary: 'Permanently delete "edge-api" and its Cloudflare Worker',
      };
      return [fakeTool('delete_load_balancer', proposing)];
    });

    mockedInvoke.mockResolvedValueOnce(aiMessage([call('delete_load_balancer', { id: 'lb-1' })]));

    const result = await execute('delete my balancer');

    expect(result.outcome).toBe('pending');
    expect(result.pendingAction).toMatchObject({ action: 'delete', name: 'edge-api' });
    // One model call only — nothing runs after a proposal.
    expect(mockedInvoke).toHaveBeenCalledTimes(1);
  });

  it('reports refused when the model calls no tools at all', async () => {
    mockedBuildTools.mockReturnValue([]);
    mockedInvoke.mockResolvedValueOnce(aiMessage([], 'I need the domain and at least one origin URL.'));

    const result = await execute('make me a load balancer');

    expect(result.outcome).toBe('refused');
    expect(result.message).toBe('I need the domain and at least one origin URL.');
  });

  it('binds only find_tools until it has loaded something', async () => {
    const finder = jest.fn(async () => JSON.stringify({ ok: true, data: 'ready' }));
    const creating = jest.fn(async () => JSON.stringify({ ok: true, data: { fullDomain: 'api.example.com' } }));
    mockedBuildTools.mockImplementation((ctx: any) => [
      fakeTool('find_tools', jest.fn(async () => {
        ctx.unlocked.add('create_load_balancer');
        return finder();
      })),
      fakeTool('create_load_balancer', creating),
    ]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('find_tools', { names: ['create_load_balancer'] })]))
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      .mockResolvedValueOnce(aiMessage([], 'Deployed api.example.com.'));

    await execute();

    const boundNames = mockedInvoke.mock.calls.map((c: any[]) => c[0].tools.map((t: any) => t.name));
    expect(boundNames[0]).toEqual(['find_tools']);
    expect(boundNames[1]).toEqual(['find_tools', 'create_load_balancer']);
  });

  it('lets RCA research a conflict, with only the web tools bound', async () => {
    const conflicting = jest.fn(async () => {
      throw Object.assign(new Error('A Worker with this name already exists.'), { statusCode: 409 });
    });
    const searching = jest.fn(async () => JSON.stringify({ ok: true, data: { results: [{ title: 'CF docs' }] } }));
    mockedBuildTools.mockReturnValue([
      fakeTool('create_load_balancer', conflicting),
      fakeTool('web_search', searching),
      fakeTool('fetch_url', jest.fn()),
    ]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      // RCA step 1: research the conflict rather than answering straight away.
      .mockResolvedValueOnce(aiMessage([call('web_search', { query: 'worker name already exists' })]))
      .mockResolvedValueOnce(aiMessage([], 'That Worker name is taken in your Cloudflare account.'));

    const result = await execute();

    expect(searching).toHaveBeenCalledTimes(1);
    expect(result.outcome).toBe('failure');
    expect(result.message).toBe('That Worker name is taken in your Cloudflare account.');

    // The create tool must not be reachable once RCA starts — it could only be used to retry.
    const rcaBound = mockedInvoke.mock.calls[1][0].tools.map((t: any) => t.name);
    expect(rcaBound.sort()).toEqual(['fetch_url', 'web_search']);
  });

  it('gives RCA its own budget when the main loop runs out', async () => {
    const looping = jest.fn(async () => JSON.stringify({ ok: true, data: {} }));
    mockedBuildTools.mockReturnValue([fakeTool('list_zones', looping), fakeTool('web_search', jest.fn())]);

    // The model never stops calling tools, so the run exhausts MAX_ITERATIONS and RCA still runs.
    mockedInvoke.mockResolvedValue(aiMessage([call('list_zones')]));
    mockedInvoke.mockResolvedValueOnce(aiMessage([call('list_zones')]));

    const result = await execute();

    expect(result.outcome).toBe('failure');
    // 12 main iterations + 3 RCA steps, and RCA was bound to the web tools only.
    expect(mockedInvoke).toHaveBeenCalledTimes(15);
    expect(mockedInvoke.mock.calls[14][0].tools.map((t: any) => t.name)).toEqual(['web_search']);
  });

  it('does not report success when it loaded a create tool but never created anything', async () => {
    const zones = jest.fn(async () => JSON.stringify({ ok: true, data: { zones: [] } }));
    mockedBuildTools.mockImplementation((ctx: any) => [
      fakeTool('find_tools', jest.fn(async () => {
        ctx.unlocked.add('list_zones');
        ctx.unlocked.add('create_load_balancer');
        return JSON.stringify({ ok: true, data: 'ready' });
      })),
      fakeTool('list_zones', zones),
      fakeTool('create_load_balancer', jest.fn()),
      fakeTool('web_search', jest.fn()),
    ]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('find_tools', { names: ['list_zones', 'create_load_balancer'] })]))
      .mockResolvedValueOnce(aiMessage([call('list_zones')]))
      // No tool failed, but the model stops without ever calling create.
      .mockResolvedValueOnce(aiMessage([], ''))
      .mockResolvedValueOnce(aiMessage([], 'I looked up your zones but never created the balancer.'));

    const result = await execute();

    expect(result.outcome).toBe('failure');
    expect(result.message).toBe('I looked up your zones but never created the balancer.');
  });

  it('still reports success for a read-only run that changes nothing', async () => {
    mockedBuildTools.mockImplementation((ctx: any) => [
      fakeTool('find_tools', jest.fn(async () => {
        ctx.unlocked.add('list_load_balancers');
        return JSON.stringify({ ok: true, data: 'ready' });
      })),
      fakeTool('list_load_balancers', jest.fn(async () => JSON.stringify({ ok: true, data: { loadBalancers: [] } }))),
    ]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('find_tools', { names: ['list_load_balancers'] })]))
      .mockResolvedValueOnce(aiMessage([call('list_load_balancers')]))
      .mockResolvedValueOnce(aiMessage([], 'You have no load balancers yet.'));

    const result = await execute('list my load balancers');

    expect(result.outcome).toBe('success');
    expect(result.message).toBe('You have no load balancers yet.');
  });

  it('reports success when a tool actually created something', async () => {
    const creating = jest.fn(async () => JSON.stringify({ ok: true, data: { fullDomain: 'api.example.com' } }));
    mockedBuildTools.mockReturnValue([fakeTool('create_load_balancer', creating)]);

    mockedInvoke
      .mockResolvedValueOnce(aiMessage([call('create_load_balancer')]))
      .mockResolvedValueOnce(aiMessage([], 'Deployed api.example.com.'));

    const result = await execute();

    expect(result.outcome).toBe('success');
    expect(result.message).toBe('Deployed api.example.com.');
  });
});
