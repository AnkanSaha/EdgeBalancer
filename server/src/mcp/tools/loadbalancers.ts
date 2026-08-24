import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import type { McpUserContext } from '../types';
import { LoadBalancer } from '../../models/LoadBalancer';
import { formatLoadBalancer } from '../../modules/loadbalancer/services/formatter.service';
import { createLoadBalancerOrchestrator } from '../../modules/loadbalancer/orchestrators/create.orchestrator';
import { updateLoadBalancerOrchestrator } from '../../modules/loadbalancer/orchestrators/update.orchestrator';
import { deleteLoadBalancerOrchestrator } from '../../modules/loadbalancer/orchestrators/delete.orchestrator';
import { pauseLoadBalancerOrchestrator } from '../../modules/loadbalancer/orchestrators/pause.orchestrator';
import { resumeLoadBalancerOrchestrator } from '../../modules/loadbalancer/orchestrators/resume.orchestrator';
import { toHostname } from '../../modules/loadbalancer/services/hostname.service';
import { isWeightedStrategy } from '../../modules/loadbalancer/services/strategy.service';
import { validateCreateLoadBalancerBody } from '../../middleware/validators/loadBalancerValidators';
import { PLANS, isStrategyAllowed } from '../../config/plans';
import { getUserPlan } from '../../modules/payment/services/subscription.service';
import { getCloudflareCredentials } from '../../services/credentialsService';
import { CloudflareClient } from '../../services/cloudflareClient';

async function findOwned(userId: string, id: string) {
  const lb = await LoadBalancer.findById(id);
  if (!lb || lb.userId.toString() !== userId) return null;
  return lb;
}

function noOpCancellation() {
  return {
    isCancelled: () => false,
    throwIfCancelled: async () => {},
  };
}

const text = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] });

export function registerLbTools(server: McpServer, user: McpUserContext) {
  server.registerTool(
    'list_load_balancers',
    {
      description: "List the user's load balancers with full configuration. Call this to resolve a name to an id before update, delete, pause or resume.",
      inputSchema: {},
    },
    async () => {
      const balancers = await LoadBalancer.find({ userId: user.userId }).sort({ createdAt: -1 });
      return text({
        loadBalancers: balancers.map((lb) => ({
          ...formatLoadBalancer(lb),
          originCount: lb.origins.length,
        })),
      });
    },
  );

  server.registerTool(
    'get_load_balancer',
    {
      description: 'Get full details of a single load balancer by id.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const lb = await findOwned(user.userId, id);
      if (!lb) return text({ error: 'Load balancer not found.' });
      return text({ ...formatLoadBalancer(lb), originCount: lb.origins.length });
    },
  );

  server.registerTool(
    'create_load_balancer',
    {
      description: 'Create and deploy a new load balancer. Requires a zoneId from list_zones.',
      inputSchema: {
        name: z.string(),
        domain: z.string(),
        zoneId: z.string(),
        origins: z.array(z.object({ url: z.string(), weight: z.number() })),
        strategy: z.string(),
        weightedEnabled: z.boolean(),
        subdomain: z.string().optional(),
        exposeRealOrigin: z.boolean().optional(),
        corsEnabled: z.boolean().optional(),
        corsOrigins: z.array(z.string()).optional(),
        rateLimitEnabled: z.boolean().optional(),
        rateLimitRequestsPerMinute: z.number().optional(),
        healthCheckEnabled: z.boolean().optional(),
        healthCheckIntervalSeconds: z.number().optional(),
        placement: z.object({ smartPlacement: z.boolean(), region: z.string().optional() }).optional(),
      },
    },
    async (input) => {
      const params: Record<string, unknown> = { ...input };

      if (params.strategy && typeof params.strategy === 'string') {
        const aliases: Record<string, string> = { rr: 'round-robin', wrr: 'weighted-round-robin', geo: 'geo-steering' };
        params.strategy = aliases[params.strategy as string] ?? params.strategy;
      }

      if (params.domain) {
        try {
          const creds = await getCloudflareCredentials(user.userId);
          if (creds) {
            const client = new CloudflareClient(creds.apiToken);
            const resp = await client.getZones(creds.accountId);
            const match = (resp.result as any[]).find(
              (z) => z.name === params.domain || (params.domain as string).endsWith(`.${z.name}`),
            );
            if (match) {
              params.zoneId = match.id;
              if (params.domain !== match.name && !params.subdomain) {
                const prefix = (params.domain as string).slice(0, -match.name.length - 1);
                if (prefix) {
                  params.domain = match.name;
                  params.subdomain = prefix;
                }
              }
            }
          }
        } catch {}
      }

      const errors = validateCreateLoadBalancerBody(params);
      if (errors.length > 0) return text({ error: `Invalid configuration: ${errors.join(', ')}` });

      const { plan } = await getUserPlan(user.userId);
      const planConfig = PLANS[plan];
      if (planConfig.lbLimit > 0) {
        const count = await LoadBalancer.countDocuments({ userId: user.userId }).catch(() => 0);
        if (count >= planConfig.lbLimit) return text({ error: `Your ${planConfig.name} plan allows ${planConfig.lbLimit} load balancers.` });
      }
      if (params.strategy && !isStrategyAllowed(plan, params.strategy as string)) {
        return text({ error: `The "${params.strategy}" strategy requires a higher plan.` });
      }
      if (!planConfig.canEditPlacement) params.placement = { smartPlacement: true };
      if (params.healthCheckEnabled) {
        if (planConfig.maxHealthCheckLBs === 0) return text({ error: 'Health Checks require a Pro or Student subscription.' });
        if (planConfig.maxHealthCheckLBs > 0) {
          const hcCount = await LoadBalancer.countDocuments({ userId: user.userId, healthCheckEnabled: true }).catch(() => 0);
          if (hcCount >= planConfig.maxHealthCheckLBs) return text({ error: `Your plan allows health checks on ${planConfig.maxHealthCheckLBs} load balancers.` });
        }
      }
      if (params.rateLimitEnabled && !planConfig.hasRateLimit) return text({ error: 'Rate Limiting requires a Pro subscription.' });

      const result = await createLoadBalancerOrchestrator({
        userId: user.userId,
        userEmail: user.email,
        operationId: undefined,
        input: params as any,
        cancellation: noOpCancellation() as any,
      });

      return text(result.data.loadBalancer);
    },
  );

  server.registerTool(
    'update_load_balancer',
    {
      description: 'Update an existing load balancer. Send the complete config, not just changed fields. Read current config with list_load_balancers first. The name cannot be changed.',
      inputSchema: {
        id: z.string(),
        domain: z.string(),
        zoneId: z.string(),
        origins: z.array(z.object({ url: z.string(), weight: z.number() })),
        strategy: z.string(),
        subdomain: z.string().optional(),
        weightedEnabled: z.boolean().optional(),
        exposeRealOrigin: z.boolean().optional(),
        corsEnabled: z.boolean().optional(),
        corsOrigins: z.array(z.string()).optional(),
        rateLimitEnabled: z.boolean().optional(),
        rateLimitRequestsPerMinute: z.number().optional(),
        healthCheckEnabled: z.boolean().optional(),
        healthCheckIntervalSeconds: z.number().optional(),
        placement: z.object({ smartPlacement: z.boolean(), region: z.string().optional() }).optional(),
      },
    },
    async (input) => {
      const { id, ...config } = input;
      const existing = await findOwned(user.userId, id);
      if (!existing) return text({ error: 'Load balancer not found.' });

      const strategy = config.strategy ?? existing.strategy;
      const merged = {
        name: existing.name,
        domain: config.domain ?? existing.domain,
        subdomain: config.subdomain ?? existing.subdomain,
        zoneId: config.zoneId ?? existing.zoneId,
        origins: config.origins ?? existing.origins,
        strategy,
        weightedEnabled: config.weightedEnabled ?? isWeightedStrategy(strategy as string),
        exposeRealOrigin: config.exposeRealOrigin ?? existing.exposeRealOrigin,
        corsEnabled: config.corsEnabled ?? existing.corsEnabled,
        corsOrigins: config.corsOrigins ?? existing.corsOrigins,
        rateLimitEnabled: config.rateLimitEnabled ?? existing.rateLimitEnabled,
        rateLimitRequestsPerMinute: config.rateLimitRequestsPerMinute ?? existing.rateLimitRequestsPerMinute,
        pathRoutes: existing.pathRoutes ?? [],
        pathRateLimits: existing.pathRateLimits ?? [],
        healthCheckEnabled: config.healthCheckEnabled ?? existing.healthCheckEnabled,
        healthCheckIntervalSeconds: config.healthCheckIntervalSeconds ?? existing.healthCheckIntervalSeconds,
        placement: config.placement ?? existing.placement ?? { smartPlacement: false },
      };

      const errors = validateCreateLoadBalancerBody(merged);
      if (errors.length > 0) return text({ error: `Invalid configuration: ${errors.join(', ')}` });

      const { plan } = await getUserPlan(user.userId);
      const planConfig = PLANS[plan];
      if (merged.strategy && !isStrategyAllowed(plan, merged.strategy as string)) {
        return text({ error: `The "${merged.strategy}" strategy requires a higher plan.` });
      }
      if (!planConfig.canEditPlacement) merged.placement = existing.placement;
      if (merged.healthCheckEnabled) {
        if (planConfig.maxHealthCheckLBs === 0) return text({ error: 'Health Checks require a Pro or Student subscription.' });
      }
      if (merged.rateLimitEnabled && !planConfig.hasRateLimit) return text({ error: 'Rate Limiting requires a Pro subscription.' });

      const result = await updateLoadBalancerOrchestrator({
        userId: user.userId,
        userEmail: user.email,
        loadBalancerId: id,
        input: merged as any,
        cancellation: noOpCancellation() as any,
      });

      return text(result.data.loadBalancer);
    },
  );

  server.registerTool(
    'delete_load_balancer',
    {
      description: 'Permanently delete a load balancer and its Cloudflare Worker. Only call after user confirms.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const existing = await findOwned(user.userId, id);
      if (!existing) return text({ error: 'Load balancer not found.' });

      await deleteLoadBalancerOrchestrator({ userId: user.userId, loadBalancerId: id });
      return text({ message: `Deleted "${existing.name}"`, fullDomain: toHostname(existing.domain, existing.subdomain) });
    },
  );

  server.registerTool(
    'pause_load_balancer',
    {
      description: 'Pause an active load balancer. "keep-domain" serves a maintenance page; "release-domain" detaches the hostname. Only call after user confirms.',
      inputSchema: { id: z.string(), mode: z.enum(['keep-domain', 'release-domain']) },
    },
    async ({ id, mode }) => {
      const existing = await findOwned(user.userId, id);
      if (!existing) return text({ error: 'Load balancer not found.' });

      await pauseLoadBalancerOrchestrator({ userId: user.userId, loadBalancerId: id, mode });
      return text({
        message: mode === 'release-domain'
          ? `Paused "${existing.name}" and detached its hostname`
          : `Paused "${existing.name}" — hostname now serves a maintenance page`,
      });
    },
  );

  server.registerTool(
    'resume_load_balancer',
    {
      description: 'Resume a paused load balancer and restore live traffic. Only call after user confirms.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const existing = await findOwned(user.userId, id);
      if (!existing) return text({ error: 'Load balancer not found.' });

      await resumeLoadBalancerOrchestrator({ userId: user.userId, loadBalancerId: id });
      return text({ message: `Resumed "${existing.name}" — live traffic restored` });
    },
  );
}
