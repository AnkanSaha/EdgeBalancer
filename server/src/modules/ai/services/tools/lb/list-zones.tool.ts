import { tool } from '@langchain/core/tools';
import { CloudflareClient } from '../../../../../services/cloudflareClient';
import { getCloudflareCredentials } from '../../../../../services/credentialsService';
import { fail, ok } from '../shared';
import type { ToolContext } from '../types';

export function listZonesTool(ctx: ToolContext) {
  return tool(
    async () => {
      const credentials = await getCloudflareCredentials(ctx.userId);
      if (!credentials) return fail('Cloudflare credentials are not configured for this account.');

      const client = new CloudflareClient(credentials.apiToken);
      const response = await client.getZones(credentials.accountId);
      const zones = response.result.map((zone: any) => ({ id: zone.id, name: zone.name, status: zone.status }));

      return zones.length === 0 ? fail('This Cloudflare account has no zones.') : ok({ zones });
    },
    {
      name: 'list_zones',
      description: "List the Cloudflare zones on the user's account. Call this before any create or update to resolve a domain name to its zoneId.",
      verboseParsingErrors: true,
      schema: { type: 'object', properties: {} },
    },
  );
}
