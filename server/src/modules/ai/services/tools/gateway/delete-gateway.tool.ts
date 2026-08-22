import { tool } from '@langchain/core/tools';
import { deleteGatewayOrchestrator } from '../../../../gateway/orchestrators/delete.orchestrator';
import { fail, ok } from '../shared';
import type { ToolContext } from '../types';
import { findOwnedGateway } from './find-owned';

export function deleteGatewayTool(ctx: ToolContext) {
  return tool(
    async (input: any) => {
      const existing = await findOwnedGateway(ctx, input.id);
      if (!existing) return fail('Gateway not found.');

      await deleteGatewayOrchestrator({ userId: ctx.userId, gatewayId: input.id });
      const hostname = `${(existing as any).subdomain ? `${(existing as any).subdomain}.` : ''}${(existing as any).domain}`;
      return ok({ message: `Deleted "${(existing as any).name}"`, fullDomain: hostname });
    },
    {
      name: 'delete_gateway',
      description: 'Permanently delete an API gateway and its Cloudflare Worker. Deletion cannot be undone. Only call it after the user explicitly confirmed the deletion in the conversation.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Gateway id from list_gateways' } },
        required: ['id'],
      },
    },
  );
}
