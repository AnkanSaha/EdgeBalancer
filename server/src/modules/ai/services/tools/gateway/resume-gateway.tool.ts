import { tool } from '@langchain/core/tools';
import { resumeGatewayOrchestrator } from '../../../../gateway/orchestrators/resume.orchestrator';
import { fail, ok } from '../shared';
import type { ToolContext } from '../types';
import { findOwnedGateway } from './find-owned';

export function resumeGatewayTool(ctx: ToolContext) {
  return tool(
    async (input: any) => {
      const existing = await findOwnedGateway(ctx, input.id);
      if (!existing) return fail('Gateway not found.');
      await resumeGatewayOrchestrator({ userId: ctx.userId, gatewayId: input.id });
      return ok({ message: `Resumed "${(existing as any).name}" — live traffic restored` });
    },
    {
      name: 'resume_gateway',
      description: 'Resume a paused API gateway and restore live traffic. Only call it after the user confirmed the resume in the conversation.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Gateway id from list_gateways' } },
        required: ['id'],
      },
    },
  );
}
