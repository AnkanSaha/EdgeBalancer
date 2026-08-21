import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { LoadBalancer } from '../../../models/LoadBalancer';
import { CloudflareClient } from '../../../services/cloudflareClient';
import { getCloudflareCredentials } from '../../../services/credentialsService';
import { validateCreateLoadBalancerBody } from '../../../middleware/validators/loadBalancerValidators';
import { formatLoadBalancer } from '../../loadbalancer/services/formatter.service';
import { createLoadBalancerOrchestrator } from '../../loadbalancer/orchestrators/create.orchestrator';
import { updateLoadBalancerOrchestrator } from '../../loadbalancer/orchestrators/update.orchestrator';
import { deleteLoadBalancerOrchestrator } from '../../loadbalancer/orchestrators/delete.orchestrator';
import { pauseLoadBalancerOrchestrator } from '../../loadbalancer/orchestrators/pause.orchestrator';
import { resumeLoadBalancerOrchestrator } from '../../loadbalancer/orchestrators/resume.orchestrator';
import { toHostname } from '../../loadbalancer/services/hostname.service';
import { isWeightedStrategy } from '../../loadbalancer/services/strategy.service';
import { buildResearchTools } from './research.service';
import type { RunLogger } from './log.service';
import type { RequestCancellation } from '../../../utils/requestCancellation';
import type { AiEmitter } from '../types/ai.types';

export interface ToolContext {
  runId: string;
  userId: string;
  userEmail: string | null;
  cancellation: RequestCancellation;
  emit: AiEmitter;
  log: RunLogger;
  /** Load balancers created or modified during the run, surfaced to the client on completion. */
  touched: unknown[];
  /** Set when ask_user fires — ends the turn so the user's reply can arrive as a new message. */
  askedUser: { current: { question: string } | null };
  /** Tool names find_tools has loaded; the agent loop binds only these plus find_tools. */
  unlocked: Set<string>;
}

const ORIGIN_SCHEMA = {
  type: 'object',
  properties: {
    url: { type: 'string', description: 'Origin URL, must start with http:// or https://' },
    weight: { type: 'integer', minimum: 1, maximum: 100, description: 'Relative weight, 1 unless the user wants a weighted split' },
    healthPath: { type: 'string', description: 'health checks only: path to probe, default "/"' },
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
  pathRoutes: {
    type: 'array',
    description: 'Path-based routing rules. Each maps a URL path pattern to a specific origin by index. First matching rule wins (checked by priority). Optional.',
    items: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path pattern, e.g. /api/*, /static/*' },
        originIndex: { type: 'integer', minimum: 0, description: '0-based index into the origins array' },
        priority: { type: 'integer', minimum: 1, description: 'Lower = checked first' },
      },
      required: ['path', 'originIndex', 'priority'],
    },
  },
  pathRateLimits: {
    type: 'array',
    description: 'Path-based rate limits. Each applies a separate requests/minute cap to a URL path pattern. Optional.',
    items: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path pattern, e.g. /login/*, /api/*' },
        requestsPerMinute: { type: 'integer', minimum: 1, maximum: 100000 },
        priority: { type: 'integer', minimum: 1, description: 'Lower = checked first' },
      },
      required: ['path', 'requestsPerMinute', 'priority'],
    },
  },
  healthCheckEnabled: { type: 'boolean', description: 'true to probe each origin and stop routing to failed backends' },
  healthCheckIntervalSeconds: { type: 'integer', minimum: 5, maximum: 3600, description: 'health checks only: probe interval in seconds; required when healthCheckEnabled is true, default 30' },
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
 * All handlers — including update, delete, pause and resume — execute for real through the same
 * orchestrators the REST routes use, so rollback semantics stay identical. A destructive step
 * runs only after the user agreed in the conversation (ask_user → reply), which the system
 * prompt enforces.
 */
export function buildTools(ctx: ToolContext): StructuredToolInterface[] {
  const { runId, userId, userEmail, cancellation, log, touched, askedUser, unlocked } = ctx;

  const findOwned = async (id: string) => {
    const lb = await LoadBalancer.findById(id);
    if (!lb || lb.userId.toString() !== userId) return null;
    return lb;
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
      description: 'Create and deploy a new load balancer immediately. Requires a zoneId from list_zones.',
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

      // The orchestrator applies this verbatim, so it must be complete and checked here —
      // where the model can still correct itself.
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
        pathRoutes: config.pathRoutes ?? existing.pathRoutes ?? [],
        pathRateLimits: config.pathRateLimits ?? existing.pathRateLimits ?? [],
        healthCheckEnabled: config.healthCheckEnabled ?? existing.healthCheckEnabled,
        healthCheckIntervalSeconds: config.healthCheckIntervalSeconds ?? existing.healthCheckIntervalSeconds,
        placement: config.placement ?? existing.placement ?? { smartPlacement: false },
      };

      const errors = validateCreateLoadBalancerBody(merged);
      if (errors.length > 0) return fail(`Invalid configuration: ${errors.join(', ')}`);

      const result = await updateLoadBalancerOrchestrator({
        userId,
        userEmail,
        loadBalancerId: id,
        input: merged,
        cancellation,
      });

      touched.push(result.data.loadBalancer);
      return ok(result.data.loadBalancer);
    },
    {
      name: 'update_load_balancer',
      description: 'Apply a configuration change to an existing load balancer. Only call it after the user confirmed the change in the conversation. Send the complete config, not just the changed fields; read the current one with list_load_balancers first. The name cannot be changed.',
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

      await deleteLoadBalancerOrchestrator({ userId, loadBalancerId: input.id });
      return ok({ message: `Deleted "${existing.name}"`, fullDomain: toHostname(existing.domain, existing.subdomain) });
    },
    {
      name: 'delete_load_balancer',
      description: 'Permanently delete a load balancer and its Cloudflare Worker. Deletion cannot be undone. Only call it after the user explicitly confirmed the deletion in the conversation.',
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
      await pauseLoadBalancerOrchestrator({ userId, loadBalancerId: input.id, mode });

      return ok({
        message: mode === 'release-domain'
          ? `Paused "${existing.name}" and detached its hostname`
          : `Paused "${existing.name}" — its hostname now serves a maintenance page`,
      });
    },
    {
      name: 'pause_load_balancer',
      description: 'Pause an active load balancer. "keep-domain" serves a maintenance page from the hostname; "release-domain" detaches the hostname entirely. Only call it after the user confirmed the pause in the conversation.',
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

      await resumeLoadBalancerOrchestrator({ userId, loadBalancerId: input.id });
      return ok({ message: `Resumed "${existing.name}" — live traffic restored` });
    },
    {
      name: 'resume_load_balancer',
      description: 'Resume a paused load balancer and restore live traffic. Only call it after the user confirmed the resume in the conversation.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Load balancer id from list_load_balancers' } },
        required: ['id'],
      },
    },
  );

  // Ends the turn with a question instead of an action. The user's answer arrives as the next
  // user message of the conversation chain, so the model resumes with full context. Loadable
  // like any other tool — the model decides when it needs it.
  const askUser = tool(
    async (input: any) => {
      const question = String(input?.question ?? '').trim();
      if (!question) return fail('A question is required.');

      askedUser.current = { question };
      log.info(`ask_user — awaiting reply: ${question}`);

      return ok('Question delivered. The turn ends here; the user\'s next message will contain their reply.');
    },
    {
      name: 'ask_user',
      description:
        'Ask the user something and end your turn. Use it when information you cannot look up is missing, or to get explicit confirmation before update_load_balancer, delete_load_balancer, pause_load_balancer or resume_load_balancer. One short question naming exactly what you need.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: { question: { type: 'string', description: 'The question to show the user' } },
        required: ['question'],
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
    askUser,
    ...buildResearchTools(log),
  ];
  const names = new Set<string>(work.map((t) => t.name));

  // Loading is a side effect on `unlocked`; the schemas reach the model when the loop re-binds
  // next iteration, so the result here stays tiny rather than repeating them.
  const findTools = tool(
    async (input: any) => {
      const requested: unknown = input?.names;
      const asked: string[] = (Array.isArray(requested) ? requested : []).filter(
        (n): n is string => typeof n === 'string',
      );
      const valid = asked.filter((n) => names.has(n));

      if (valid.length === 0) {
        return fail(`No such tool. Available: ${[...names].join(', ')}.`);
      }

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
