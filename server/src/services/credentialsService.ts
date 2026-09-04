import { User } from '../models/User';
import { encrypt, decrypt, maskToken, maskAccountId } from '../utils';
import {
  assertCloudflareAccountAvailable,
  CloudflareAccountAlreadyLinkedError,
  isDuplicateKeyError,
} from '../utils/cloudflareHash';
import { CloudflareClient } from './cloudflareClient';
import { refreshOAuthToken, isOAuthTokenExpired } from './oauth.service';

export interface CredentialsValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateCloudflareCredentials = async (
  accountId: string,
  apiToken: string
): Promise<CredentialsValidationResult> => {
  const client = new CloudflareClient(apiToken);
  const errors: string[] = [];

  try {
    // Test Worker Scripts permission
    const hasWorkerScripts = await client.testWorkerScriptsPermission(accountId);
    if (!hasWorkerScripts) {
      errors.push('Missing permission: Account > Worker Scripts > Edit');
    }

    // Test Zone Read permission
    const hasZoneRead = await client.testZoneReadPermission(accountId);
    if (!hasZoneRead) {
      errors.push('Missing permission: Zone > Zone > Read');
    }

    // Test Zone DNS Edit permission (required for raw IP origin auto-DNS)
    const hasDnsEdit = await client.testDnsEditPermission(accountId);
    if (!hasDnsEdit) {
      errors.push('Missing permission: Zone > DNS > Edit');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error: any) {
    if (error.response?.status === 403 || error.response?.status === 401) {
      errors.push('Invalid API token or account ID');
    } else {
      errors.push('Failed to validate credentials with Cloudflare API');
    }
    return {
      valid: false,
      errors,
    };
  }
};

export const saveCloudflareCredentials = async (
  userId: string,
  accountId: string,
  apiToken: string
): Promise<void> => {
  const accountHash = await assertCloudflareAccountAvailable(accountId, userId);

  // Encrypt credentials
  const encryptedAccountId = encrypt(accountId);
  const encryptedApiToken = encrypt(apiToken);

  // Update user
  try {
    await User.findByIdAndUpdate(userId, {
      cloudflareAccountId: encryptedAccountId.encrypted,
      cloudflareAccountIdIv: encryptedAccountId.iv,
      cloudflareAccountIdTag: encryptedAccountId.tag,
      cloudflareApiToken: encryptedApiToken.encrypted,
      cloudflareTokenIv: encryptedApiToken.iv,
      cloudflareTokenTag: encryptedApiToken.tag,
      cloudflareAccountHash: accountHash,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new CloudflareAccountAlreadyLinkedError();
    }
    throw error;
  }
};

export const getCloudflareCredentials = async (userId: string): Promise<{
  accountId: string;
  apiToken: string;
} | null> => {
  const user = await User.findById(userId);
  if (!user || !user.cloudflareAccountId) {
    return null;
  }

  // OAuth path
  if (user.cloudflareOAuthConnected && user.cloudflareOAuthToken) {
    let accessToken: string;
    if (isOAuthTokenExpired(user.cloudflareTokenExpiresAt)) {
      accessToken = await refreshOAuthToken(userId);
    } else {
      accessToken = decrypt(user.cloudflareOAuthToken, user.cloudflareOAuthTokenIv!, user.cloudflareOAuthTokenTag!);
    }
    const accountId = decrypt(user.cloudflareAccountId, user.cloudflareAccountIdIv!, user.cloudflareAccountIdTag!);
    return { accountId, apiToken: accessToken };
  }

  // Manual token path
  if (!user.cloudflareApiToken) {
    return null;
  }

  const accountId = decrypt(user.cloudflareAccountId, user.cloudflareAccountIdIv!, user.cloudflareAccountIdTag!);
  const apiToken = decrypt(user.cloudflareApiToken, user.cloudflareTokenIv!, user.cloudflareTokenTag!);

  return { accountId, apiToken };
};

export const getMaskedCredentials = async (userId: string): Promise<{
  accountId: string | null;
  apiToken: string | null;
  connectedVia?: 'oauth' | 'manual';
} | null> => {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  if (!user.cloudflareAccountId) {
    return {
      accountId: null,
      apiToken: null,
    };
  }

  const accountId = maskAccountId(decrypt(user.cloudflareAccountId, user.cloudflareAccountIdIv!, user.cloudflareAccountIdTag!));

  // OAuth path
  if (user.cloudflareOAuthConnected && user.cloudflareOAuthToken) {
    const accessToken = decrypt(user.cloudflareOAuthToken, user.cloudflareOAuthTokenIv!, user.cloudflareOAuthTokenTag!);
    return {
      accountId,
      apiToken: maskToken(accessToken),
      connectedVia: 'oauth',
    };
  }

  // Manual token path
  if (!user.cloudflareApiToken) {
    return {
      accountId: null,
      apiToken: null,
    };
  }

  const apiToken = decrypt(user.cloudflareApiToken, user.cloudflareTokenIv!, user.cloudflareTokenTag!);

  return {
    accountId,
    apiToken: maskToken(apiToken),
    connectedVia: 'manual',
  };
};
