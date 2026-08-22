import type { StructuredToolInterface } from '@langchain/core/tools';
import { buildResearchTools } from './research.service';
import { collectDomainTools, MUTATING_TOOL_NAMES } from './tools';
import { buildFindTools } from './tools/find-tools.tool';
import type { ToolContext } from './tools/types';

export { MUTATING_TOOL_NAMES };
export type { ToolContext } from './tools/types';

/**
 * Joins the domain tool sets (load balancers, API gateways) with the research tools and the
 * find_tools loader. Every handler closes over the authenticated `userId`; it is never a
 * model-supplied argument, so a prompt cannot reach another user's resources.
 *
 * All handlers — including update and delete — execute for real through the same orchestrators
 * the REST routes use, so rollback semantics stay identical. A destructive step runs only after
 * the user agreed in the conversation, which the system prompt enforces.
 */
export function buildTools(ctx: ToolContext): StructuredToolInterface[] {
  const work = [...collectDomainTools(ctx), ...buildResearchTools(ctx.log)];
  const names = new Set<string>(work.map((t) => t.name));

  return [buildFindTools(names, ctx), ...work];
}
