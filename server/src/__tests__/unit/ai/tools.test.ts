jest.mock('../../../modules/loadbalancer/orchestrators/create.orchestrator', () => ({
  createLoadBalancerOrchestrator: jest.fn(async () => ({
    data: { loadBalancer: { id: 'lb-1', name: 'edge-api', fullDomain: 'api.example.com' } },
  })),
}));

jest.mock('../../../modules/loadbalancer/orchestrators/update.orchestrator', () => ({
  updateLoadBalancerOrchestrator: jest.fn(async () => ({
    data: { loadBalancer: { id: 'lb-1', name: 'edge-api', fullDomain: 'api.example.com' } },
  })),
}));

jest.mock('../../../modules/loadbalancer/orchestrators/delete.orchestrator', () => ({
  deleteLoadBalancerOrchestrator: jest.fn(async () => ({ success: true })),
}));

jest.mock('../../../modules/loadbalancer/orchestrators/pause.orchestrator', () => ({
  pauseLoadBalancerOrchestrator: jest.fn(async () => ({ success: true })),
}));

jest.mock('../../../modules/loadbalancer/orchestrators/resume.orchestrator', () => ({
  resumeLoadBalancerOrchestrator: jest.fn(async () => ({ success: true })),
}));

jest.mock('../../../models/LoadBalancer', () => ({
  LoadBalancer: { findById: jest.fn() },
}));

import { buildTools } from '../../../modules/ai/services/tools.service';
import { createLoadBalancerOrchestrator } from '../../../modules/loadbalancer/orchestrators/create.orchestrator';
import { updateLoadBalancerOrchestrator } from '../../../modules/loadbalancer/orchestrators/update.orchestrator';
import { deleteLoadBalancerOrchestrator } from '../../../modules/loadbalancer/orchestrators/delete.orchestrator';
import { pauseLoadBalancerOrchestrator } from '../../../modules/loadbalancer/orchestrators/pause.orchestrator';
import { resumeLoadBalancerOrchestrator } from '../../../modules/loadbalancer/orchestrators/resume.orchestrator';
import { LoadBalancer } from '../../../models/LoadBalancer';

// Deliberately not a hex ObjectId: secret scanners flag 24-char hex as high entropy.
// Nothing here validates the format — LoadBalancer and the orchestrators are mocked.
const AUTHENTICATED_USER = 'test-user-id';

const mockedCreate = createLoadBalancerOrchestrator as jest.Mock;
const mockedUpdate = updateLoadBalancerOrchestrator as jest.Mock;
const mockedDelete = deleteLoadBalancerOrchestrator as jest.Mock;
const mockedPause = pauseLoadBalancerOrchestrator as jest.Mock;
const mockedResume = resumeLoadBalancerOrchestrator as jest.Mock;
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

const makeTools = (touched: unknown[] = []) =>
  buildTools({
    runId: 'run-1',
    userId: AUTHENTICATED_USER,
    userEmail: 'user@example.com',
    cancellation: { isCancelled: () => false, throwIfCancelled: async () => undefined } as any,
    emit: jest.fn(),
    log: { info: jest.fn(), warn: jest.fn() },
    touched,
    unlocked: new Set<string>(),
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

describe('destructive tools execute through their orchestrators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFindById.mockResolvedValue({
      _id: 'lb-1',
      name: 'edge-api',
      domain: 'example.com',
      subdomain: 'api',
      userId: { toString: () => AUTHENTICATED_USER },
    });
  });

  it('delete runs the delete orchestrator with the authenticated user id', async () => {
    const result = await toolNamed('delete_load_balancer').invoke({ id: 'lb-1' });

    expect(mockedDelete).toHaveBeenCalledTimes(1);
    expect(mockedDelete.mock.calls[0][0]).toMatchObject({ userId: AUTHENTICATED_USER, loadBalancerId: 'lb-1' });
    expect(String(result)).toContain('Deleted');
  });

  it('pause carries the mode through to its orchestrator', async () => {
    await toolNamed('pause_load_balancer').invoke({ id: 'lb-1', mode: 'release-domain' });

    expect(mockedPause).toHaveBeenCalledWith({ userId: AUTHENTICATED_USER, loadBalancerId: 'lb-1', mode: 'release-domain' });
  });

  it('resume runs the resume orchestrator', async () => {
    await toolNamed('resume_load_balancer').invoke({ id: 'lb-1' });

    expect(mockedResume).toHaveBeenCalledWith({ userId: AUTHENTICATED_USER, loadBalancerId: 'lb-1' });
  });

  it('update merges the stored record and applies through the update orchestrator', async () => {
    mockedFindById.mockResolvedValue({
      _id: 'lb-1',
      name: 'edge-api',
      domain: 'example.com',
      subdomain: 'api',
      zoneId: 'b'.repeat(32),
      origins: [{ url: 'https://old.example.com', weight: 1 }],
      strategy: 'round-robin',
      exposeRealOrigin: true,
      placement: { smartPlacement: true, region: 'aws:us-east-1' },
      userId: { toString: () => AUTHENTICATED_USER },
    });

    // Optional on the tool schema, required by the validator — the merge is what bridges them.
    const { name, weightedEnabled, placement, ...required } = VALID_CONFIG;
    const result = await toolNamed('update_load_balancer').invoke({ ...required, id: 'lb-1', strategy: 'ip-hash' });

    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    const call = mockedUpdate.mock.calls[0][0];
    expect(call.userId).toBe(AUTHENTICATED_USER);
    expect(call.loadBalancerId).toBe('lb-1');
    expect(call.input).toMatchObject({
      strategy: 'ip-hash',
      weightedEnabled: false,
      exposeRealOrigin: true,
      placement: { smartPlacement: true, region: 'aws:us-east-1' },
    });
    // The locked name rides along unchanged — the orchestrator rejects any attempt to alter it.
    expect(call.input.name).toBe('edge-api');
    expect(String(result)).toContain('api.example.com');
  });

  it('derives weightedEnabled from the strategy the model chose', async () => {
    const { weightedEnabled, ...config } = VALID_CONFIG;

    await toolNamed('update_load_balancer').invoke({ ...config, id: 'lb-1', strategy: 'weighted-round-robin' });

    expect(mockedUpdate.mock.calls[0][0].input).toMatchObject({
      strategy: 'weighted-round-robin',
      weightedEnabled: true,
    });
  });

  it('rejects an invalid update without calling the orchestrator', async () => {
    const result = await toolNamed('update_load_balancer').invoke({
      ...VALID_CONFIG,
      id: 'lb-1',
      origins: [{ url: 'ftp://not-http.example.com', weight: 1 }],
    });

    expect(String(result)).toContain('Invalid configuration');
    expect(mockedUpdate).not.toHaveBeenCalled();
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
    expect(mockedDelete).not.toHaveBeenCalled();
  });
});
