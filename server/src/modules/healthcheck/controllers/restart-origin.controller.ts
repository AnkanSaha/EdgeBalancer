import { LoadBalancer } from '../../../models/LoadBalancer';
import { getValidatedLoadBalancerId } from '../../loadbalancer/services/validation.service';
import { getSchedulerForLb, buildHealthSummary } from '../services/scheduler.service';
import { enqueueImmediateHealthCheck } from '../services/queue.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function restartOriginHealth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const loadBalancerId = getValidatedLoadBalancerId(req.params.id);
    const loadBalancer = await LoadBalancer.findById(loadBalancerId);

    if (!loadBalancer) {
      res.status(404);
      throw new Error('Load balancer not found');
    }

    if (loadBalancer.userId.toString() !== userId) {
      res.status(403);
      throw new Error('You do not have permission to modify this load balancer');
    }

    const originIndex = Number(req.body?.originIndex);
    if (!Number.isInteger(originIndex) || originIndex < 0 || originIndex >= loadBalancer.origins.length) {
      res.status(400);
      throw new Error('originIndex must be a valid origin index');
    }

    const scheduler = await getSchedulerForLb(loadBalancerId);
    if (!scheduler || scheduler.enabled !== true) {
      res.status(400);
      throw new Error('Health checks are not enabled for this load balancer');
    }

    const origin = scheduler.origins[originIndex];
    origin.status = 'provisioning';
    origin.attempts = 0;
    origin.nextCheckAt = new Date();
    origin.disabledAt = null;

    await scheduler.save();
    await enqueueImmediateHealthCheck(loadBalancerId);

    res.json({
      success: true,
      message: 'Origin queued for health provisioning',
      data: {
        health: buildHealthSummary(scheduler, loadBalancer.origins.length),
      },
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error as Error);
  }
}
