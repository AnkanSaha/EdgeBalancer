import { tool } from '@langchain/core/tools';
import { LoadBalancer } from '../../../../../models/LoadBalancer';
import { formatLoadBalancer } from '../../../../loadbalancer/services/formatter.service';
import { ok } from '../shared';
import type { ToolContext } from '../types';

export function listLoadBalancersTool(ctx: ToolContext) {
  return tool(
    async () => {
      const balancers = await LoadBalancer.find({ userId: ctx.userId }).sort({ createdAt: -1 });
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
}
