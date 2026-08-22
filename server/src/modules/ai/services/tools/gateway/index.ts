import type { StructuredToolInterface } from '@langchain/core/tools';
import type { ToolContext } from '../types';
import { listGatewaysTool } from './list-gateways.tool';
import { createGatewayTool } from './create-gateway.tool';
import { updateGatewayTool } from './update-gateway.tool';
import { deleteGatewayTool } from './delete-gateway.tool';
import { pauseGatewayTool } from './pause-gateway.tool';
import { resumeGatewayTool } from './resume-gateway.tool';

export function collectGatewayTools(ctx: ToolContext): StructuredToolInterface[] {
  return [
    listGatewaysTool(ctx),
    createGatewayTool(ctx),
    updateGatewayTool(ctx),
    deleteGatewayTool(ctx),
    pauseGatewayTool(ctx),
    resumeGatewayTool(ctx),
  ];
}
