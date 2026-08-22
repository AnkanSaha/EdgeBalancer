import { tool } from '@langchain/core/tools';
import { pauseGatewayOrchestrator } from '../../../../gateway/orchestrators/pause.orchestrator';
import { fail, ok } from '../shared';
import type { ToolContext } from '../types';
import { findOwnedGateway } from './find-owned';

export function pauseGatewayTool(ctx: ToolContext) {
  return tool(
    async (input: any) => {
      const existing = await findOwnedGateway(ctx, input.id);
      if (!existing) return fail('Gateway not found.');
      const mode = input.mode === 'release-domain' ? 'release-domain' : 'keep-domain';
      await pauseGatewayOrchestrator({ userId: ctx.userId, gatewayId: input.id, mode });
      return ok({
        message: mode === 'release-domain'
          ? `Paused "${(existing as any).name}" and detached its hostname`
          : `Paused "${(existing as any).name}" — its hostname now serves a maintenance page`,
      });
    },
    {
      name: 'pause_gateway',
      description: 'Pause an active API gateway. "keep-domain" serves a maintenance page; "release-domain" detaches the hostname. Only call it after the user confirmed the pause in the conversation.',
      verboseParsingErrors: true,
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Gateway id from list_gateways' },
          mode: { type: 'string', enum: ['keep-domain', 'release-domain'] },
        },
        required: ['id', 'mode'],
      },
    },
  );
}
