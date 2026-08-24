import type { McpServer } from '@modelcontextprotocol/server';
import type { McpUserContext } from '../types';
import { registerLbTools } from './loadbalancers';
import { registerGatewayTools } from './gateways';
import { registerCloudflareTools } from './cloudflare';

export function registerTools(server: McpServer, user: McpUserContext) {
  registerLbTools(server, user);
  registerGatewayTools(server, user);
  registerCloudflareTools(server, user);
}
