import { tool } from '@langchain/core/tools';
import { LoadBalancer } from '../../../../../models/LoadBalancer';
import { CloudflareClient } from '../../../../../services/cloudflareClient';
import { getCloudflareCredentials } from '../../../../../services/credentialsService';
import { validateCreateLoadBalancerBody } from '../../../../../middleware/validators/loadBalancerValidators';
import { PLANS, isStrategyAllowed } from '../../../../../config/plans';
import { createLoadBalancerOrchestrator } from '../../../../loadbalancer/orchestrators/create.orchestrator';
import { getUserPlan } from '../../../../payment/services/subscription.service';
import { fail, ok } from '../shared';
import type { ToolContext } from '../types';
import { CONFIG_PROPERTIES, normalizeStrategyAlias } from './schemas';

export function createLoadBalancerTool(ctx: ToolContext) {
  return tool(
    async (input: any) => {
      // Normalize common shorthands models hallucinate before validation
      if (input.strategy) input.strategy = normalizeStrategyAlias(input.strategy);
      // Auto-resolve zoneId if model omitted it: same lookup manual form does via dropdown
      if (!input.zoneId && input.domain) {
        try {
          const creds = await getCloudflareCredentials(ctx.userId);
          if (creds) {
            const client = new CloudflareClient(creds.apiToken);
            const resp = await client.getZones(creds.accountId);
            const match = (resp.result as any[]).find((z) => z.name === input.domain || input.domain.endsWith(`.${z.name}`));
            if (match) {
              input.zoneId = match.id;
              if (!input.domain.endsWith(match.name)) {
                // subdomain case: ensure domain is the zone name, subdomain holds prefix
                const prefix = input.domain.slice(0, -match.name.length - 1);
                if (prefix && !input.subdomain) {
                  input.domain = match.name;
                  input.subdomain = prefix;
                }
              }
            }
          }
        } catch {}
      }
      // Normalize conditional fields the model often hallucinates as 0 when disabled
      if (input.rateLimitEnabled !== true && input.rateLimitRequestsPerMinute === 0) delete input.rateLimitRequestsPerMinute;
      if (input.healthCheckEnabled !== true && input.healthCheckIntervalSeconds === 0) delete input.healthCheckIntervalSeconds;
      const errors = validateCreateLoadBalancerBody(input);
      if (errors.length > 0) return fail(`Invalid configuration: ${errors.join(', ')}`);

      // Plan gating — identical to REST POST /api/loadbalancers (resilient to "test-user-id" in unit tests)
      const { plan } = await getUserPlan(ctx.userId);
      const config = PLANS[plan];
      if (config.lbLimit > 0) {
        let count = 0;
        try { count = await LoadBalancer.countDocuments({ userId: ctx.userId }); } catch { count = 0; }
        if (count >= config.lbLimit) return fail(`Your ${config.name} plan allows ${config.lbLimit} load balancer${config.lbLimit === 1 ? '' : 's'}. Upgrade to create more.`);
      }
      if (input.strategy && !isStrategyAllowed(plan, input.strategy)) return fail(`The "${input.strategy}" strategy requires a higher plan. Upgrade to unlock all strategies.`);
      if (!config.canEditPlacement) input.placement = { smartPlacement: true };
      if (input.healthCheckEnabled) {
        if (config.maxHealthCheckLBs === 0) return fail('Health Checks require an EdgeBalancer Pro or Student subscription');
        if (config.maxHealthCheckLBs > 0) {
          let hcCount = 0;
          try { hcCount = await LoadBalancer.countDocuments({ userId: ctx.userId, healthCheckEnabled: true }); } catch { hcCount = 0; }
          if (hcCount >= config.maxHealthCheckLBs) return fail(`Your ${config.name} plan allows health checks on ${config.maxHealthCheckLBs} load balancers.`);
        }
      }
      if (input.rateLimitEnabled && !config.hasRateLimit) return fail('Rate Limiting requires an EdgeBalancer Pro subscription');

      const result = await createLoadBalancerOrchestrator({
        userId: ctx.userId,
        userEmail: ctx.userEmail,
        operationId: ctx.runId,
        input,
        cancellation: ctx.cancellation,
      });

      ctx.touched.push(result.data.loadBalancer);
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
}
