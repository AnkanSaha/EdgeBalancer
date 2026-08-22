import { tool } from '@langchain/core/tools';
import { Gateway } from '../../../../../models/Gateway';
import { formatGateway } from '../../../../gateway/services/formatter.service';
import { ok } from '../shared';
import type { ToolContext } from '../types';

export function listGatewaysTool(ctx: ToolContext) {
  return tool(
    async () => {
      const gateways = await Gateway.find({ userId: ctx.userId }).sort({ createdAt: -1 });
      return ok({ gateways: gateways.map((gw) => formatGateway(gw)) });
    },
    {
      name: 'list_gateways',
      description: "List the user's existing API gateways with their ids and full configuration. Call this to resolve a name to an id before update, delete, pause or resume.",
      verboseParsingErrors: true,
      schema: { type: 'object', properties: {} },
    },
  );
}
