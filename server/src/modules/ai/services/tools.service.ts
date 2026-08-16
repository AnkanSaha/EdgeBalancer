import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { LoadBalancer } from '../../../models/LoadBalancer';
import { CloudflareClient } from '../../../services/cloudflareClient';
import { getCloudflareCredentials } from '../../../services/credentialsService';
import { validateCreateLoadBalancerBody } from '../../../middleware/validators/loadBalancerValidators';
import { formatLoadBalancer } from '../../loadbalancer/services/formatter.service';
import { createLoadBalancerOrchestrator } from '../../loadbalancer/orchestrators/create.orchestrator';
import { toHostname } from '../../loadbalancer/services/hostname.service';
import { isWeightedStrategy } from '../../loadbalancer/services/strategy.service';
import { buildResearchTools } from './research.service';
import type { RunLogger } from './log.service';
import type { RequestCancellation } from '../../../utils/requestCancellation';
import type { AiEmitter, PendingAction, PendingActionKind } from '../types/ai.types';

export interface ToolContext {
  runId: string;
  userId: string;
  userEmail: string | null;
  cancellation: RequestCancellation;
  emit: AiEmitter;
  log: RunLogger;
  /** Load balancers created or modified during the run, surfaced to the client on completion. */
  touched: unknown[];
  /** Set when a tool resolves a destructive action for the user to confirm. */
  proposed: { current: PendingAction | null };
  /** Tool names find_tools has loaded; the agent loop binds only these plus find_tools. */
  unlocked: Set<string>;
}

const ORIGIN_SCHEMA = {
  type: 'object',
  properties: {
    url: { type: 'string', description: 'Origin URL, must start with http:// or https://' },
    weight: { type: 'integer', minimum: 1, maximum: 100, description: 'Relative weight, 1 unless the user wants a weighted split' },
    geoCities: { type: 'array', items: { type: 'string' }, description: 'geo-steering only: uppercase city names' },
    geoSubdivisions: { type: 'array', items: { type: 'string' }, description: 'geo-steering only: ISO 3166-2 subdivision codes' },
    geoCountries: { type: 'array', items: { type: 'string' }, description: 'geo-steering only: 2-letter uppercase ISO country codes' },
    geoContinents: { type: 'array', items: { type: 'string' }, description: 'geo-steering only: AF, AN, AS, EU, NA, OC or SA' },
    isFallback: { type: 'boolean', description: 'geo-steering only: at most one origin may be the fallback' },
  },
  required: ['url', 'weight'],
} as const;

const CONFIG_PROPERTIES = {
  domain: { type: 'string', description: 'Zone name from list_zones, e.g. example.com' },
  subdomain: { type: 'string', description: 'Optional hostname prefix only, e.g. "api". Never the full hostname.' },
  zoneId: { type: 'string', description: '32-character zone id from list_zones' },
  origins: { type: 'array', items: ORIGIN_SCHEMA, minItems: 1 },
  strategy: {
    type: 'string',
    enum: ['round-robin', 'weighted-round-robin', 'ip-hash', 'cookie-sticky', 'weighted-cookie-sticky', 'failover', 'geo-steering'],
  },
  weightedEnabled: { type: 'boolean', description: 'true only for weighted-round-robin and weighted-cookie-sticky' },
  exposeRealOrigin: { type: 'boolean' },
  corsEnabled: { type: 'boolean' },
  corsOrigins: { type: 'array', items: { type: 'string' } },
  rateLimitEnabled: { type: 'boolean', description: 'true to enforce requests-per-minute rate limiting per client IP' },
  rateLimitRequestsPerMinute: { type: 'integer', minimum: 1, maximum: 100000, description: 'requests allowed per minute per client IP; required when rateLimitEnabled is true' },
  placement: {
    type: 'object',
    properties: {
      smartPlacement: { type: 'boolean' },
      region: { type: 'string', description: 'provider:region, e.g. aws:us-east-1' },
    },
  },
} as const;

// Loading one of these is the model stating it means to change something.
export const MUTATING_TOOL_NAMES = [
  'create_load_balancer',
  'update_load_balancer',
  'delete_load_balancer',
  'pause_load_balancer',
  'resume_load_balancer',
] as const;

const ok = (data: unknown) => JSON.stringify({ ok: true, data });
const fail = (message: string) => JSON.stringify({ ok: false, error: message });

/**
 * Every handler closes over the authenticated `userId`; it is never a model-supplied argument,
 * so a prompt cannot reach another user's resources.
 *
 * Destructive handlers never touch Cloudflare. They resolve and validate the target, then hand
 * back a proposal that ends the run — the user confirms it in the UI, which calls the ordinary
 * REST routes. Nothing irreversible can happen inside an agent run.
 */
export function buildTools(ctx: ToolContext): StructuredToolInterface[] {
  const { runId, userId, userEmail, cancellation, log, touched, proposed, unlocked } = ctx;

  const findOwned = async (id: string) => {
    const lb = await LoadBalancer.findById(id);
    if (!lb || lb.userId.toString() !== userId) return null;
    return lb;
  };

  const propose = (
    action: PendingActionKind,
    lb: any,
    summary: string,
    payload?: Record<string, unknown>,
  ) => {
    const pending: PendingAction = {
      action,
      loadBalancerId: lb._id.toString(),
      name: lb.name,
      fullDomain: toHostname(lb.domain, lb.subdomain),
      summary,
      payload,
    };

    proposed.current = pending;
    log.info(`proposed ${action} on ${pending.name} — awaiting user confirmation`);

    return JSON.stringify({
      ok: true,
      pendingConfirmation: true,
      message: `Prepared but NOT performed. Tell the user to confirm: ${summary}`,
    });
  };

  const listZones = tool(
    async () => {
      const credentials = await getCloudflareCredentials(userId);
      if (!credentials) return fail('Cloudflare credentials are not configured for this account.');

      const client = new CloudflareClient(credentials.apiToken);
      const response = await client.getZones(credentials.accountId);
      const zones = response.result.map((zone: any) => ({ id: zone.id, name: zone.name, status: zone.status }));

      return zones.length === 0 ? fail('This Cloudflare account has no zones.') : ok({ zones });
    },
    {
      name: 'list_zones',
      description: "List the Cloudflare zones on the user's account. Call this before any create or update to resolve a domain name to its zoneId.",
      verboseParsingErrors: true,
      schema: { type: 'object', properties: {} },
    },
  );

  const listLoadBalancers = tool(
    async () => {
      const balancers = await LoadBalancer.find({ userId }).sort({ createdAt: -1 });
      return ok({
        loadBalancers: balancers.map((lb) => ({
          ...formatLoadBalancer(lb),
          originCount: lb.origins.length,
        })),
      });
    },
    {
      name: 'list_load_balancers',
      description: "List the user's existing load balancers with their ids and full configuration. Call this to resolve a name to an id before update, delete, pause or resume.",
      verboseParsingErrors: true,
      schema: { type: 'object', properties: {} },
    },
  );

  const createLoadBalancer = tool(
    async (input: any) => {
      const errors = validateCreateLoadBalancerBody(input);
      if (errors.length > 0) return fail(`Invalid configuration: ${errors.join(', ')}`);

      const result = await createLoadBalancerOrchestrator({
        userId,
        userEmail,
        operationId: runId,
        input,
        cancellation,
      });

      touched.push(result.data.loadBalancer);
      return ok(result.data.loadBalancer);
    },
    {
      name: 'create_load_balancer',
      description: 'Create and deploy a new load balancer. Requires a zoneId from list_zones.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '3-50 characters, lowercase letters, digits and hyphens only' },
          ...CONFIG_PROPERTIES,
        },
        required: ['name', 'domain', 'zoneId', 'origins', 'strategy', 'weightedEnabled', 'placement'],
      },
    },
  );

  const updateLoadBalancer = tool(
    async (input: any) => {
      const { id, ...config } = input;
      const existing = await findOwned(id);
      if (!existing) return fail('Load balancer not found.');

      // The PUT route this is confirmed against has no body validator, so the proposal must be
      // complete and checked here — where the model can still correct itself.
      const strategy = config.strategy ?? existing.strategy;
      const merged = {
        name: existing.name, // locked at creation; present only for the shared validator
        domain: config.domain ?? existing.domain,
        subdomain: config.subdomain ?? existing.subdomain,
        zoneId: config.zoneId ?? existing.zoneId,
        origins: config.origins ?? existing.origins,
        strategy,
        weightedEnabled: config.weightedEnabled ?? isWeightedStrategy(strategy),
        exposeRealOrigin: config.exposeRealOrigin ?? existing.exposeRealOrigin,
        corsEnabled: config.corsEnabled ?? existing.corsEnabled,
        corsOrigins: config.corsOrigins ?? existing.corsOrigins,
        rateLimitEnabled: config.rateLimitEnabled ?? existing.rateLimitEnabled,
        rateLimitRequestsPerMinute: config.rateLimitRequestsPerMinute ?? existing.rateLimitRequestsPerMinute,
        placement: config.placement ?? existing.placement ?? { smartPlacement: false },
      };

      const errors = validateCreateLoadBalancerBody(merged);
      if (errors.length > 0) return fail(`Invalid configuration: ${errors.join(', ')}`);

      const { name, ...payload } = merged;

      return propose('update', existing, `Apply a new configuration to "${existing.name}"`, payload);
    },
    {
      name: 'update_load_balancer',
      description: 'Prepare a configuration change for an existing load balancer. This does NOT apply anything — the user confirms it afterwards. Send the complete config, not just the changed fields; read the current one with list_load_balancers first. The name cannot be changed.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Load balancer id from list_load_balancers' },
          ...CONFIG_PROPERTIES,
        },
        required: ['id', 'domain', 'zoneId', 'origins', 'strategy'],
      },
    },
  );

  const deleteLoadBalancer = tool(
    async (input: any) => {
      const existing = await findOwned(input.id);
      if (!existing) return fail('Load balancer not found.');

      return propose('delete', existing, `Permanently delete "${existing.name}" and its Cloudflare Worker`);
    },
    {
      name: 'delete_load_balancer',
      description: 'Prepare the deletion of a load balancer. This does NOT delete anything — the user confirms it afterwards, and deletion cannot be undone once they do.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Load balancer id from list_load_balancers' } },
        required: ['id'],
      },
    },
  );

  const pauseLoadBalancer = tool(
    async (input: any) => {
      const existing = await findOwned(input.id);
      if (!existing) return fail('Load balancer not found.');

      const mode = input.mode === 'release-domain' ? 'release-domain' : 'keep-domain';
      const summary = mode === 'release-domain'
        ? `Pause "${existing.name}" and detach its hostname from the Worker`
        : `Pause "${existing.name}" and serve a maintenance page from its hostname`;

      return propose('pause', existing, summary, { mode });
    },
    {
      name: 'pause_load_balancer',
      description: 'Prepare a pause for an active load balancer. This does NOT pause anything — the user confirms it afterwards. "keep-domain" serves a maintenance page from the hostname; "release-domain" detaches the hostname entirely.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Load balancer id from list_load_balancers' },
          mode: { type: 'string', enum: ['keep-domain', 'release-domain'] },
        },
        required: ['id', 'mode'],
      },
    },
  );

  const resumeLoadBalancer = tool(
    async (input: any) => {
      const existing = await findOwned(input.id);
      if (!existing) return fail('Load balancer not found.');

      return propose('resume', existing, `Resume "${existing.name}" and restore live traffic`);
    },
    {
      name: 'resume_load_balancer',
      description: 'Prepare the resume of a paused load balancer. This does NOT resume anything — the user confirms it afterwards.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Load balancer id from list_load_balancers' } },
        required: ['id'],
      },
    },
  );

  const work = [
    listZones,
    listLoadBalancers,
    createLoadBalancer,
    updateLoadBalancer,
    deleteLoadBalancer,
    pauseLoadBalancer,
    resumeLoadBalancer,
    ...buildResearchTools(log),
  ];
  const names = new Set<string>(work.map((t) => t.name));

  // Loading is a side effect on `unlocked`; the schemas reach the model when the loop re-binds
  // next iteration, so the result here stays tiny rather than repeating them.
  const findTools = tool(
    async (input: any) => {
      const requested: unknown = input?.names;
      const valid = (Array.isArray(requested) ? requested : []).filter(
        (n): n is string => typeof n === 'string' && names.has(n),
      );

      if (valid.length === 0) return fail(`No such tool. Available: ${[...names].join(', ')}`);

      valid.forEach((n) => unlocked.add(n));
      log.info(`find_tools loaded ${valid.join(', ')}`);

      return ok('ready');
    },
    {
      name: 'find_tools',
      description:
        'Load the tools you need before you can call them. Name every tool the request will need, then use them on your next step.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: { names: { type: 'array', items: { type: 'string' }, minItems: 1 } },
        required: ['names'],
      },
    },
  );

  return [findTools, ...work] as unknown as StructuredToolInterface[];
}
