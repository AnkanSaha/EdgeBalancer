/**
 * List Load Balancers Controller
 */

import { LoadBalancer } from '../../../models/LoadBalancer';
import { formatLoadBalancer } from '../services/formatter.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function listLoadBalancers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const loadBalancers = await LoadBalancer.find({ userId }).sort({ createdAt: -1 });

    const formattedLBs = loadBalancers.map((lb) => ({
      ...formatLoadBalancer(lb),
      originCount: lb.origins.length,
    }));

    res.json({
      success: true,
      message: 'Load balancers retrieved successfully',
      data: {
        loadBalancers: formattedLBs,
      },
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error as Error);
  }
}
