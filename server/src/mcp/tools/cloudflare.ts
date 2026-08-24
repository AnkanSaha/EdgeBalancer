import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import type { McpUserContext } from '../types';
import { getCloudflareCredentials } from '../../services/credentialsService';
import { CloudflareClient } from '../../services/cloudflareClient';

export function registerCloudflareTools(server: McpServer, user: McpUserContext) {
  server.registerTool(
    'list_zones',
    {
      description: 'List Cloudflare zones in the user\'s account. Use the zone id when creating or updating load balancers and gateways.',
      inputSchema: {},
    },
    async () => {
      const creds = await getCloudflareCredentials(user.userId);
      if (!creds) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Cloudflare credentials not configured. Please connect your Cloudflare account first.' }) }] };
      }

      const client = new CloudflareClient(creds.apiToken);
      const response = await client.getZones(creds.accountId);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            zones: (response.result as any[]).map((zone: any) => ({
              id: zone.id,
              name: zone.name,
              status: zone.status,
              nameServers: zone.name_servers,
            })),
          }),
        }],
      };
    },
  );
}
