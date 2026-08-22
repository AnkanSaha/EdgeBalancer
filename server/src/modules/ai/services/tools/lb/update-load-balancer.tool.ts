import { tool } from '@langchain/core/tools';
import { LoadBalancer } from '../../../../../models/LoadBalancer';
import { validateCreateLoadBalancerBody } from '../../../../../middleware/validators/loadBalancerValidators';
import { PLANS, isStrategyAllowed } from '../../../../../config/plans';
import { updateLoadBalancerOrchestrator } from '../../../../loadbalancer/orchestrators/update.orchestrator';
import { isWeightedStrategy } from '../../../../loadbalancer/services/strategy.service';
import { getUserPlan } from '../../../../payment/services/subscription.service';
import { fail, ok } from '../shared';
import type { ToolContext } from '../types';
import { CONFIG_PROPERTIES, normalizeStrategyAlias } from './schemas';
import { findOwnedLoadBalancer } from './find-owned';

export function updateLoadBalancerTool(ctx: ToolContext) {
  return tool(
    async (input: any) => {
      const { id, ...config } = input;
      if (config.strategy) config.strategy = normalizeStrategyAlias(config.strategy);
      if (config.rateLimitEnabled !== true && config.rateLimitRequestsPerMinute === 0) delete config.rateLimitRequestsPerMinute;
      if (config.healthCheckEnabled !== true && config.healthCheckIntervalSeconds === 0) delete config.healthCheckIntervalSeconds;
      const existing = await findOwnedLoadBalancer(ctx, id);
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

      // Plan gating — identical to REST PUT /api/loadbalancers/:id
      const { plan: updatePlan } = await getUserPlan(ctx.userId);
      const updateConfig = PLANS[updatePlan];
      if (merged.strategy && !isStrategyAllowed(updatePlan, merged.strategy)) return fail(`The "${merged.strategy}" strategy requires a higher plan. Upgrade to unlock all strategies.`);
      if (!updateConfig.canEditPlacement) merged.placement = existing.placement;
      if (merged.healthCheckEnabled) {
        if (updateConfig.maxHealthCheckLBs === 0) return fail('Health Checks require an EdgeBalancer Pro or Student subscription');
        if (updateConfig.maxHealthCheckLBs > 0 && !existing.healthCheckEnabled) {
          let hcCount = 0;
          try { hcCount = await LoadBalancer.countDocuments({ userId: ctx.userId, healthCheckEnabled: true }); } catch { hcCount = 0; }
          if (hcCount >= updateConfig.maxHealthCheckLBs) return fail(`Your ${updateConfig.name} plan allows health checks on ${updateConfig.maxHealthCheckLBs} load balancers.`);
        }
      }
      if (merged.rateLimitEnabled && !updateConfig.hasRateLimit) return fail('Rate Limiting requires an EdgeBalancer Pro subscription');

      const result = await updateLoadBalancerOrchestrator({
        userId: ctx.userId,
        userEmail: ctx.userEmail,
        loadBalancerId: id,
        input: merged,
        cancellation: ctx.cancellation,
      });

      ctx.touched.push(result.data.loadBalancer);
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
}
