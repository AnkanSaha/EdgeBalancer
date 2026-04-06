/**
 * Get Single Load Balancer Controller
 */

import { LoadBalancer } from '../../../models/LoadBalancer';
import { getValidatedLoadBalancerId } from '../services/validation.service';
import { formatLoadBalancer } from '../services/formatter.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function getLoadBalancer(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    let id: string;
    try {
      id = getValidatedLoadBalancerId(req.params.id);
    } catch (error: any) {
      res.status(400);
      throw error;
    }

    const loadBalancer = await LoadBalancer.findById(id);
    if (!loadBalancer) {
      res.status(404);
      throw new Error('Load balancer not found');
    }

    if (loadBalancer.userId.toString() !== userId) {
      res.status(403);
      throw new Error('You do not have permission to access this load balancer');
    }

    res.json({
      success: true,
      message: 'Load balancer retrieved successfully',
      data: {
        loadBalancer: formatLoadBalancer(loadBalancer),
      },
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error as Error);
  }
}
