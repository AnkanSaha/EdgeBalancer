import { LoadBalancer } from '../../../../../models/LoadBalancer';
import type { ToolContext } from '../types';

/** Resolves a model-supplied id to a load balancer the authenticated user owns, else null. */
export async function findOwnedLoadBalancer(ctx: Pick<ToolContext, 'userId'>, id: string) {
  const lb = await LoadBalancer.findById(id);
  if (!lb || lb.userId.toString() !== ctx.userId) return null;
  return lb;
}
