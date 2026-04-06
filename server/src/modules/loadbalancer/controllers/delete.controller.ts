/**
 * Delete Load Balancer Controller
 */

import { deleteLoadBalancerOrchestrator } from '../orchestrators/delete.orchestrator';
import { getValidatedLoadBalancerId } from '../services/validation.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function deleteLoadBalancer(req: Request, res: Response, next: NextFunction) {
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

    const result = await deleteLoadBalancerOrchestrator({
      userId,
      loadBalancerId: id,
    });

    res.status(200).json(result);
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error as Error);
  }
}
