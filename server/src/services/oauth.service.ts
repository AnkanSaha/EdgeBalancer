import crypto from 'crypto';
import axios from 'axios';
import { encrypt, decrypt } from '../utils/encryption';
import {
  assertCloudflareAccountAvailable,
  CloudflareAccountAlreadyLinkedError,
  isDuplicateKeyError,
} from '../utils/cloudflareHash';
import { User } from '../models/User';

const CF_AUTH_ENDPOINT = 'https://dash.cloudflare.com/oauth2/auth';
const CF_TOKEN_ENDPOINT = 'https://dash.cloudflare.com/oauth2/token';
const CF_ACCOUNTS_ENDPOINT = 'https://api.cloudflare.com/client/v4/accounts';

// Scopes must match what's configured in the Cloudflare OAuth client
const CLOUDFLARE_SCOPES = [
  'workers-scripts.edit',
  'workers-kv-storage.read',
  'workers-kv-storage.write',
  'workers-routes.read',
  'workers-routes.write',
  'workers-scripts.bind',
  'workers-scripts.read',
  'workers-scripts.write',
  'dns.read',
  'dns.write',
  'zone.read',
  'account-analytics.read',
  'account-settings.read',
  'offline_access',
].join(' ');

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} environment variable is required for Cloudflare OAuth`);
  return value;
};

/** Generate the Cloudflare OAuth authorization URL + state for CSRF protection. */
export const buildAuthorizationUrl = (userId: string): { url: string; state: string } => {
  const clientId = getEnvOrThrow('CLOUDFLARE_OAUTH_CLIENT_ID');
  const redirectUri = getEnvOrThrow('CLOUDFLARE_OAUTH_REDIRECT_URI');
  // State includes userId so callback can save credentials without JWT auth
  const state = Buffer.from(JSON.stringify({
    uid: userId,
    nonce: crypto.randomBytes(16).toString('hex'),
  })).toString('base64url');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: CLOUDFLARE_SCOPES,
    state,
  });

  return {
    url: `${CF_AUTH_ENDPOINT}?${params.toString()}`,
    state,
  };
};

/** Exchange an authorization code for access + refresh tokens. */
export const exchangeCodeForTokens = async (code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> => {
  const clientId = getEnvOrThrow('CLOUDFLARE_OAUTH_CLIENT_ID');
  const clientSecret = getEnvOrThrow('CLOUDFLARE_OAUTH_CLIENT_SECRET');
  const redirectUri = getEnvOrThrow('CLOUDFLARE_OAUTH_REDIRECT_URI');

  // client_secret_basic: credentials go in Authorization header, not body
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const { data } = await axios.post(CF_TOKEN_ENDPOINT, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    timeout: 15000,
  });

  if (!data.access_token) {
    throw new Error('Cloudflare token exchange failed: no access_token in response');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? '',
    expiresIn: data.expires_in ?? 3600,
  };
};

/** Fetch the Cloudflare account ID using an access token. */
export const fetchAccountId = async (accessToken: string): Promise<string> => {
  const { data } = await axios.get(CF_ACCOUNTS_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });

  if (!data.success || !data.result?.length) {
    throw new Error('No Cloudflare accounts found for this user');
  }

  return data.result[0].id;
};

/** Refresh an expired OAuth access token using the stored refresh token. */
export const refreshOAuthToken = async (userId: string): Promise<string> => {
  const user = await User.findById(userId);
  if (!user || !user.cloudflareOAuthConnected || !user.cloudflareRefreshToken) {
    throw new Error('No OAuth connection found for this user');
  }

  const refreshToken = decrypt(
    user.cloudflareRefreshToken,
    user.cloudflareRefreshTokenIv!,
    user.cloudflareRefreshTokenTag!
  );

  const clientId = getEnvOrThrow('CLOUDFLARE_OAUTH_CLIENT_ID');
  const clientSecret = getEnvOrThrow('CLOUDFLARE_OAUTH_CLIENT_SECRET');

  // client_secret_basic: credentials go in Authorization header, not body
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const { data } = await axios.post(CF_TOKEN_ENDPOINT, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    timeout: 15000,
  });

  if (!data.access_token) {
    throw new Error('Cloudflare token refresh failed: no access_token in response');
  }

  const encryptedAccess = encrypt(data.access_token);
  const encryptedRefresh = data.refresh_token ? encrypt(data.refresh_token) : null;

  const update: Record<string, unknown> = {
    cloudflareOAuthToken: encryptedAccess.encrypted,
    cloudflareOAuthTokenIv: encryptedAccess.iv,
    cloudflareOAuthTokenTag: encryptedAccess.tag,
    cloudflareTokenExpiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  };

  if (encryptedRefresh) {
    update.cloudflareRefreshToken = encryptedRefresh.encrypted;
    update.cloudflareRefreshTokenIv = encryptedRefresh.iv;
    update.cloudflareRefreshTokenTag = encryptedRefresh.tag;
  }

  await User.findByIdAndUpdate(userId, update);
  return data.access_token;
};

/** Save OAuth credentials for a user, clearing any manual token. */
export const saveOAuthCredentials = async (
  userId: string,
  accountId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> => {
  const accountHash = await assertCloudflareAccountAvailable(accountId, userId);

  const encryptedAccount = encrypt(accountId);
  const encryptedAccess = encrypt(accessToken);
  const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;

  const update: Record<string, unknown> = {
    cloudflareAccountId: encryptedAccount.encrypted,
    cloudflareAccountIdIv: encryptedAccount.iv,
    cloudflareAccountIdTag: encryptedAccount.tag,
    cloudflareAccountHash: accountHash,
    cloudflareOAuthToken: encryptedAccess.encrypted,
    cloudflareOAuthTokenIv: encryptedAccess.iv,
    cloudflareOAuthTokenTag: encryptedAccess.tag,
    cloudflareTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    cloudflareOAuthConnected: true,
    // Clear manual token fields
    cloudflareApiToken: null,
    cloudflareTokenIv: null,
    cloudflareTokenTag: null,
  };

  if (encryptedRefresh) {
    update.cloudflareRefreshToken = encryptedRefresh.encrypted;
    update.cloudflareRefreshTokenIv = encryptedRefresh.iv;
    update.cloudflareRefreshTokenTag = encryptedRefresh.tag;
  }

  try {
    await User.findByIdAndUpdate(userId, update);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new CloudflareAccountAlreadyLinkedError();
    }
    throw error;
  }
};

/** Disconnect OAuth and clear all OAuth fields. */
export const disconnectOAuth = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) return;

  const update: Record<string, unknown> = {
    cloudflareOAuthToken: null,
    cloudflareOAuthTokenIv: null,
    cloudflareOAuthTokenTag: null,
    cloudflareRefreshToken: null,
    cloudflareRefreshTokenIv: null,
    cloudflareRefreshTokenTag: null,
    cloudflareTokenExpiresAt: null,
    cloudflareOAuthConnected: false,
  };

  if (!user.cloudflareApiToken) {
    // No manual token uses this account ID, so the encrypted account fields are dead weight.
    update.cloudflareAccountId = null;
    update.cloudflareAccountIdIv = null;
    update.cloudflareAccountIdTag = null;
  }

  await User.findByIdAndUpdate(userId, {
    $set: update,
    $unset: { cloudflareAccountHash: 1 },
  });
};

/** Check if OAuth token is expired (with 5-minute buffer). */
export const isOAuthTokenExpired = (expiresAt?: Date | null): boolean => {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now() + 5 * 60 * 1000;
};

/** Validate state parameter and extract userId. Returns null if invalid. */
export const validateState = (state: string): { userId: string } | null => {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    if (!decoded.uid || !decoded.nonce) return null;
    return { userId: decoded.uid };
  } catch {
    return null;
  }
};
