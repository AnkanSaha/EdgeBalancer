jest.mock('../../../modules/loadbalancer/orchestrators/create.orchestrator', () => ({
  createLoadBalancerOrchestrator: jest.fn(async () => ({
    data: { loadBalancer: { id: 'lb-1', name: 'edge-api', fullDomain: 'api.example.com' } },
  })),
}));

jest.mock('../../../models/LoadBalancer', () => ({
  LoadBalancer: { findById: jest.fn() },
}));

import { buildTools } from '../../../modules/ai/services/tools.service';
import { createLoadBalancerOrchestrator } from '../../../modules/loadbalancer/orchestrators/create.orchestrator';
import { LoadBalancer } from '../../../models/LoadBalancer';
import type { PendingAction } from '../../../modules/ai/types/ai.types';

// Deliberately not a hex ObjectId: secret scanners flag 24-char hex as high entropy.
// Nothing here validates the format — LoadBalancer and the orchestrators are mocked.
const AUTHENTICATED_USER = 'test-user-id';

const mockedCreate = createLoadBalancerOrchestrator as jest.Mock;
const mockedFindById = LoadBalancer.findById as jest.Mock;

const VALID_CONFIG = {
  name: 'edge-api',
  domain: 'example.com',
  subdomain: 'api',
  zoneId: 'a'.repeat(32),
  origins: [{ url: 'https://a.example.com', weight: 1 }],
  strategy: 'round-robin',
  weightedEnabled: false,
  placement: { smartPlacement: false },
};

const proposed: { current: PendingAction | null } = { current: null };

const makeTools = (touched: unknown[] = []) =>
  buildTools({
    runId: 'run-1',
    userId: AUTHENTICATED_USER,
    userEmail: 'user@example.com',
    cancellation: { isCancelled: () => false, throwIfCancelled: async () => undefined } as any,
    emit: jest.fn(),
    log: { info: jest.fn(), warn: jest.fn() },
    touched,
    proposed,
  });

const toolNamed = (name: string) => {
  const found = makeTools().find((t) => t.name === name);
  if (!found) throw new Error(`Tool ${name} not registered`);
  return found;
};

describe('create_load_balancer tool', () => {
  it('rejects an invalid AI payload without touching Cloudflare', async () => {
    const result = await toolNamed('create_load_balancer').invoke({
      ...VALID_CONFIG,
      name: 'Not A Valid Name',
      zoneId: 'too-short',
    });

    expect(String(result)).toContain('Invalid configuration');
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('rejects a payload missing a schema-required field', async () => {
    const { strategy, ...withoutStrategy } = VALID_CONFIG;

    // The tool schema gate rejects this before the business validator ever runs.
    await expect(toolNamed('create_load_balancer').invoke(withoutStrategy)).rejects.toThrow();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('calls the orchestrator once with the authenticated user id', async () => {
    const touched: unknown[] = [];
    const tool = makeTools(touched).find((t) => t.name === 'create_load_balancer')!;

    const result = await tool.invoke(VALID_CONFIG);

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockedCreate.mock.calls[0][0].userId).toBe(AUTHENTICATED_USER);
    expect(String(result)).toContain('api.example.com');
    expect(touched).toHaveLength(1);
  });

  it('ignores a userId injected into the model arguments', async () => {
    await toolNamed('create_load_balancer').invoke({ ...VALID_CONFIG, userId: 'attacker-id' } as any);

    expect(mockedCreate.mock.calls[0][0].userId).toBe(AUTHENTICATED_USER);
  });
});

describe('destructive tools', () => {
  beforeEach(() => {
    proposed.current = null;
    mockedFindById.mockResolvedValue({
      _id: 'lb-1',
      name: 'edge-api',
      domain: 'example.com',
      subdomain: 'api',
      userId: { toString: () => AUTHENTICATED_USER },
    });
  });

  it('prepares a delete without performing it', async () => {
    const result = await toolNamed('delete_load_balancer').invoke({ id: 'lb-1' });

    expect(String(result)).toContain('NOT performed');
    expect(proposed.current).toMatchObject({
      action: 'delete',
      loadBalancerId: 'lb-1',
      name: 'edge-api',
      fullDomain: 'api.example.com',
    });
  });

  it('carries the pause mode through for the confirmation request', async () => {
    await toolNamed('pause_load_balancer').invoke({ id: 'lb-1', mode: 'release-domain' });

    expect(proposed.current?.action).toBe('pause');
    expect(proposed.current?.payload).toEqual({ mode: 'release-domain' });
  });

  it('carries the full config through for an update', async () => {
    await toolNamed('update_load_balancer').invoke({ ...VALID_CONFIG, id: 'lb-1' });

    expect(proposed.current?.action).toBe('update');
    expect(proposed.current?.payload).toMatchObject({ strategy: 'round-robin' });
    expect(proposed.current?.payload).not.toHaveProperty('id');
  });

  it('refuses a load balancer owned by another user', async () => {
    mockedFindById.mockResolvedValue({
      _id: 'lb-9',
      name: 'someone-elses',
      domain: 'other.com',
      userId: { toString: () => 'another-user' },
    });

    const result = await toolNamed('delete_load_balancer').invoke({ id: 'lb-9' });

    expect(String(result)).toContain('not found');
    expect(proposed.current).toBeNull();
  });
});
