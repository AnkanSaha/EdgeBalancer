import { Request, Response, NextFunction } from 'express';
import { 
  validateCloudflareCredentials, 
  saveCloudflareCredentials,
  getCloudflareCredentials,
  getMaskedCredentials
} from '../services/credentialsService';
import { CloudflareClient } from '../services/cloudflareClient';

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
    next(error);
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
    next(error);
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
    next(error);
  }
};

export const getZones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
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

    res.json({
      success: true,
      message: 'Zones retrieved successfully',
      data: { zones },
    });
  } catch (error) {
    next(error);
  }
};
