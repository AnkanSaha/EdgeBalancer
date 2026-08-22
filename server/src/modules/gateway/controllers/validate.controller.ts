import { Gateway } from '../../../models/Gateway';
import { getUserPlan } from '../../payment/services/subscription.service';
import { PLANS } from '../../../config/plans';
import { toHostname, assertHostnameAvailable } from '../../loadbalancer/services/hostname.service';
import { getValidatedGatewayId } from '../services/validation.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function validateGatewayHostname(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401); throw new Error('Not authenticated'); }

    const { domain, subdomain, zoneId, gatewayId } = req.body;
    if (!domain || !zoneId) { res.status(400); throw new Error('domain and zoneId are required'); }

    const { accountId, apiToken } = await (async () => {
      const { getCloudflareCredentialsForUser } = await import('../services/credentials.service');
      return getCloudflareCredentialsForUser(userId);
    })();

    const hostname = toHostname(domain, subdomain);
    await assertHostnameAvailable({ userId, accountId, apiToken, hostname, zoneId, excludeLoadBalancerId: gatewayId });

    res.json({ success: true, data: { available: true }, message: 'Hostname is available' });
  } catch (e) {
    if ((e as any).statusCode) res.status((e as any).statusCode);
    next(e as Error);
  }
}
