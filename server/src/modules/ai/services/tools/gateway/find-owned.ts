import { Gateway } from '../../../../../models/Gateway';
import type { ToolContext } from '../types';

export async function findOwnedGateway(ctx: Pick<ToolContext, 'userId'>, id: string) {
  const gw = await Gateway.findById(id);
  if (!gw || gw.userId.toString() !== ctx.userId) return null;
  return gw;
}
