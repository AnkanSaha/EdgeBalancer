import { tool } from '@langchain/core/tools';
import { resumeLoadBalancerOrchestrator } from '../../../../loadbalancer/orchestrators/resume.orchestrator';
import { fail, ok } from '../shared';
import type { ToolContext } from '../types';
import { findOwnedLoadBalancer } from './find-owned';

export function resumeLoadBalancerTool(ctx: ToolContext) {
  return tool(
    async (input: any) => {
      const existing = await findOwnedLoadBalancer(ctx, input.id);
      if (!existing) return fail('Load balancer not found.');

      await resumeLoadBalancerOrchestrator({ userId: ctx.userId, loadBalancerId: input.id });
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
}
