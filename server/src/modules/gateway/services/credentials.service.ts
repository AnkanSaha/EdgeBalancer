import { getCloudflareCredentials } from '../../../services/credentialsService';

export async function getCloudflareCredentialsForUser(userId: string) {
  const creds = await getCloudflareCredentials(userId);
  if (!creds) {
    const error = new Error('Cloudflare credentials not configured for this account');
    (error as any).statusCode = 400;
    throw error;
  }
  return { accountId: creds.accountId, apiToken: creds.apiToken, isOAuth: (creds as any).isOAuth };
}
