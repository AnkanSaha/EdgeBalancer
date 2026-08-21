/**
 * Credentials Service
 *
 * Handles retrieval of Cloudflare credentials for authenticated users.
 * Supports both OAuth and manual token credentials.
 */

import { User } from '../../../models/User';
import { decrypt } from '../../../utils/encryption';
import { refreshOAuthToken, isOAuthTokenExpired } from '../../../services/oauth.service';

export interface CloudflareCredentials {
  accountId: string;
  apiToken: string;
  isOAuth?: boolean;
}

/**
 * Get decrypted Cloudflare credentials for a user.
 * Checks OAuth first (with auto-refresh), then falls back to manual token.
 *
 * @throws Error if user not found or credentials not configured
 */
export async function getCloudflareCredentialsForUser(userId: string): Promise<CloudflareCredentials> {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  // OAuth path — preferred
  if (user.cloudflareOAuthConnected) {
    const hasOAuthFields = !!(
      user.cloudflareAccountId &&
      user.cloudflareOAuthToken &&
      user.cloudflareAccountIdIv &&
      user.cloudflareOAuthTokenIv &&
      user.cloudflareAccountIdTag &&
      user.cloudflareOAuthTokenTag
    );

    if (!hasOAuthFields) {
      const error = new Error('Cloudflare OAuth credentials are incomplete. Please reconnect.');
      (error as any).statusCode = 400;
      throw error;
    }

    let accessToken: string;

    // Refresh if expired (with 5-min buffer)
    if (isOAuthTokenExpired(user.cloudflareTokenExpiresAt)) {
      accessToken = await refreshOAuthToken(userId);
    } else {
      accessToken = decrypt(user.cloudflareOAuthToken!, user.cloudflareOAuthTokenIv!, user.cloudflareOAuthTokenTag!);
    }

    return {
      accountId: decrypt(user.cloudflareAccountId!, user.cloudflareAccountIdIv!, user.cloudflareAccountIdTag!),
      apiToken: accessToken,
      isOAuth: true,
    };
  }

  // Manual token path — legacy
  if (
    !user.cloudflareAccountId ||
    !user.cloudflareApiToken ||
    !user.cloudflareAccountIdIv ||
    !user.cloudflareTokenIv ||
    !user.cloudflareAccountIdTag ||
    !user.cloudflareTokenTag
  ) {
    const error = new Error('Cloudflare credentials not configured. Please complete onboarding first.');
    (error as any).statusCode = 400;
    throw error;
  }

  return {
    accountId: decrypt(user.cloudflareAccountId, user.cloudflareAccountIdIv, user.cloudflareAccountIdTag),
    apiToken: decrypt(user.cloudflareApiToken, user.cloudflareTokenIv, user.cloudflareTokenTag),
    isOAuth: false,
  };
}
