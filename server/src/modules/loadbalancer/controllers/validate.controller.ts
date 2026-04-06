/**
 * Validate Hostname Controller
 */

import { getCloudflareCredentialsForUser } from '../services/credentials.service';
import { toHostname, assertHostnameAvailable } from '../services/hostname.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function validateLoadBalancerHostname(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const {
      domain,
      subdomain,
      excludeLoadBalancerId,
    } = req.body;

    if (!domain || typeof domain !== 'string') {
      res.status(400);
      throw new Error('Domain is required');
    }

    const hostname = toHostname(domain, typeof subdomain === 'string' ? subdomain : undefined);
    const { accountId, apiToken } = await getCloudflareCredentialsForUser(userId);

    await assertHostnameAvailable({
      userId,
      accountId,
      apiToken,
      hostname,
      excludeLoadBalancerId,
    });

    res.json({
      success: true,
      message: 'Hostname is available',
      data: {
        hostname,
        available: true,
      },
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error as Error);
  }
}
