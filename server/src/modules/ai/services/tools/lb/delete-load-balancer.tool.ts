import { tool } from '@langchain/core/tools';
import { deleteLoadBalancerOrchestrator } from '../../../../loadbalancer/orchestrators/delete.orchestrator';
import { toHostname } from '../../../../loadbalancer/services/hostname.service';
import { fail, ok } from '../shared';
import type { ToolContext } from '../types';
import { findOwnedLoadBalancer } from './find-owned';

export function deleteLoadBalancerTool(ctx: ToolContext) {
  return tool(
    async (input: any) => {
      const existing = await findOwnedLoadBalancer(ctx, input.id);
      if (!existing) return fail('Load balancer not found.');

      await deleteLoadBalancerOrchestrator({ userId: ctx.userId, loadBalancerId: input.id });
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
}
