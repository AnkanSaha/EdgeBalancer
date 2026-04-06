import axios from 'axios';
import { retryWithBackoff } from '../utils/retry';
import { detachDomainFromWorker } from './workerDomain';

interface DeleteWorkerParams {
  accountId: string;
  apiToken: string;
  scriptName: string;
  hostname?: string;
}

export const deleteWorkerScript = async ({
  accountId,
  apiToken,
  scriptName,
}: {
  accountId: string;
  apiToken: string;
  scriptName: string;
}): Promise<void> => {
  const response = await retryWithBackoff(
    () => axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    ),
    { maxRetries: 3, retryableStatusCodes: [429, 500, 502, 503, 504] }
  );

  if (!response.data.success) {
    throw new Error(response.data.errors?.[0]?.message || 'Failed to delete Worker from Cloudflare');
  }
};

/**
 * Delete a Worker script and its domain attachment from Cloudflare
 */
export const deleteWorker = async ({
  accountId,
  apiToken,
  scriptName,
  hostname,
}: DeleteWorkerParams): Promise<void> => {
  try {
    if (hostname) {
      try {
        await detachDomainFromWorker({
          accountId,
          apiToken,
          hostname,
        });
      } catch (domainError: any) {
        console.error(`Warning: Failed to delete domain attachment: ${domainError.message}`);
      }
    }

    await deleteWorkerScript({
      accountId,
      apiToken,
      scriptName,
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      // Worker already deleted, treat as success
      return;
    }
    throw new Error(`Cloudflare API error: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
};
