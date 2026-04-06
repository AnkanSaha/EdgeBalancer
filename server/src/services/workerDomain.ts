import axios from 'axios';
import { retryWithBackoff } from '../utils/retry';
import { CloudflareClient } from './cloudflareClient';

export interface AttachDomainParams {
  accountId: string;
  apiToken: string;
  hostname: string; // Full domain with optional subdomain (e.g., "api.example.com" or "example.com")
  zoneId: string;
  scriptName: string;
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export const attachDomainToWorker = async (params: AttachDomainParams): Promise<string> => {
  const { accountId, apiToken, hostname, zoneId, scriptName } = params;

  try {
    const response = await retryWithBackoff(
      () => axios.put(
        `${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/domains`,
        {
          hostname,
          zone_id: zoneId,
          service: scriptName,
          environment: 'production',
        },
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      ),
      {
        maxRetries: 3,
        initialDelay: 2000,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      }
    );

    if (!response.data.success) {
      throw new Error('Failed to attach domain to Worker');
    }

    // Return the worker URL
    return `https://${hostname}`;
  } catch (error: any) {
    console.error('Domain attachment error:', error.response?.data || error.message);
    throw new Error(`Failed to attach domain: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
};

export const detachDomainFromWorker = async ({
  accountId,
  apiToken,
  hostname,
}: {
  accountId: string;
  apiToken: string;
  hostname: string;
}): Promise<void> => {
  const client = new CloudflareClient(apiToken);
  const domains = await client.getWorkerDomains(accountId);
  const domain = domains.find((item: any) => item?.hostname === hostname);

  if (!domain?.id) {
    return;
  }

  await retryWithBackoff(
    () => axios.delete(
      `${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/domains/${domain.id}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    ),
    {
      maxRetries: 3,
      initialDelay: 1000,
      retryableStatusCodes: [429, 500, 502, 503, 504],
    }
  );
};
