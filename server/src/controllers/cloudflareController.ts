import {
  validateCloudflareCredentials,
  saveCloudflareCredentials,
  getCloudflareCredentials,
  getMaskedCredentials
} from '../services/credentialsService';
import { CloudflareClient } from '../services/cloudflareClient';
import { getRedisClient } from '../utils/redisClient';
import {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  fetchAccountId,
  saveOAuthCredentials,
  disconnectOAuth,
  validateState,
} from '../services/oauth.service';
import { CloudflareAccountAlreadyLinkedError } from '../utils/cloudflareHash';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../types/http';

export const saveCredentials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, apiToken } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Validate credentials with Cloudflare API
    const validation = await validateCloudflareCredentials(accountId, apiToken);
    
    if (!validation.valid) {
      res.status(400);
      throw new Error(`Invalid Cloudflare credentials: ${validation.errors.join(', ')}`);
    }

    // Save encrypted credentials
    await saveCloudflareCredentials(userId, accountId, apiToken);

    res.json({
      success: true,
      message: 'Cloudflare credentials saved successfully',
      data: null,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const updateCredentials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, apiToken } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Validate credentials with Cloudflare API
    const validation = await validateCloudflareCredentials(accountId, apiToken);
    
    if (!validation.valid) {
      res.status(400);
      throw new Error(`Invalid Cloudflare credentials: ${validation.errors.join(', ')}`);
    }

    // Update encrypted credentials
    await saveCloudflareCredentials(userId, accountId, apiToken);

    res.json({
      success: true,
      message: 'Cloudflare credentials updated successfully',
      data: null,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const getCredentials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Get masked credentials
    const credentials = await getMaskedCredentials(userId);
    if (!credentials) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      success: true,
      message: 'Credentials retrieved successfully',
      data: {
        accountId: credentials.accountId,
        apiToken: credentials.apiToken,
      },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const getZones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Check Redis cache first (5s TTL to dedupe rapid page loads)
    const cacheKey = `cf:zones:${userId}`;
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    } catch {
      // Redis down → fall through to Cloudflare API
    }

    // Get decrypted credentials
    const credentials = await getCloudflareCredentials(userId);
    if (!credentials) {
      res.status(400);
      throw new Error('Cloudflare credentials not found. Please complete onboarding first.');
    }

    // Fetch zones from Cloudflare
    const client = new CloudflareClient(credentials.apiToken);
    const zonesResponse = await client.getZones(credentials.accountId);

    const zones = zonesResponse.result.map((zone: any) => ({
      id: zone.id,
      name: zone.name,
      status: zone.status,
    }));

    const response = {
      success: true,
      message: 'Zones retrieved successfully',
      data: { zones },
    };

    // Cache for 5 seconds
    try {
      const redis = await getRedisClient();
      await redis.set(cacheKey, JSON.stringify(response), { EX: 20 });
    } catch {
      // Redis down → skip caching
    }

    res.json(response);
  } catch (error) {
    next(error as Error);
  }
};

export const oauthAuthorize = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // State includes userId — no cookie needed, it travels via URL
    const { url } = buildAuthorizationUrl(userId);

    res.json({
      success: true,
      message: 'Authorization URL generated',
      data: { url },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const oauthCallback = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code || !state) {
      res.status(400);
      throw new Error('Missing code or state parameter');
    }

    // Extract userId from state (state travels via URL — CSRF safe)
    const stateData = validateState(state);
    if (!stateData) {
      res.status(400);
      throw new Error('Invalid state format');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Fetch account ID from Cloudflare
    const accountId = await fetchAccountId(tokens.accessToken);

    // Save credentials
    await saveOAuthCredentials(
      stateData.userId,
      accountId,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn
    );

    // Redirect to dashboard with success indicator
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/loadbalancers?cf=connected`);
  } catch (error) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const reason = error instanceof CloudflareAccountAlreadyLinkedError ? 'account_linked' : 'oauth_failed';
    res.redirect(`${clientUrl}/onboarding?error=${reason}`);
  }
};

export const oauthDisconnect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    await disconnectOAuth(userId);

    res.json({
      success: true,
      message: 'Cloudflare OAuth disconnected',
      data: null,
    });
  } catch (error) {
    next(error as Error);
  }
};
