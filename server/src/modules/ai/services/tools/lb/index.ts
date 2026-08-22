import type { StructuredToolInterface } from '@langchain/core/tools';
import type { ToolContext } from '../types';
import { listZonesTool } from './list-zones.tool';
import { listLoadBalancersTool } from './list-load-balancers.tool';
import { createLoadBalancerTool } from './create-load-balancer.tool';
import { updateLoadBalancerTool } from './update-load-balancer.tool';
import { deleteLoadBalancerTool } from './delete-load-balancer.tool';
import { pauseLoadBalancerTool } from './pause-load-balancer.tool';
import { resumeLoadBalancerTool } from './resume-load-balancer.tool';

export function collectLbTools(ctx: ToolContext): StructuredToolInterface[] {
  return [
    listZonesTool(ctx),
    listLoadBalancersTool(ctx),
    createLoadBalancerTool(ctx),
    updateLoadBalancerTool(ctx),
    deleteLoadBalancerTool(ctx),
    pauseLoadBalancerTool(ctx),
    resumeLoadBalancerTool(ctx),
  ];
}
