import { tool } from '@langchain/core/tools';
import { pauseLoadBalancerOrchestrator } from '../../../../loadbalancer/orchestrators/pause.orchestrator';
import { fail, ok } from '../shared';
import type { ToolContext } from '../types';
import { findOwnedLoadBalancer } from './find-owned';

export function pauseLoadBalancerTool(ctx: ToolContext) {
  return tool(
    async (input: any) => {
      const existing = await findOwnedLoadBalancer(ctx, input.id);
      if (!existing) return fail('Load balancer not found.');

      const mode = input.mode === 'release-domain' ? 'release-domain' : 'keep-domain';
      await pauseLoadBalancerOrchestrator({ userId: ctx.userId, loadBalancerId: input.id, mode });

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
}
