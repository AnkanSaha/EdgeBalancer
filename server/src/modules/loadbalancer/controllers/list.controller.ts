import { LoadBalancer } from '../../../models/LoadBalancer';
import { HealthCheckScheduler } from '../../../models/HealthCheckScheduler';
import { formatLoadBalancer } from '../services/formatter.service';
import { buildHealthSummary } from '../../healthcheck/services/scheduler.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function listLoadBalancers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const { search, status } = (req.query ?? {}) as { search?: string; status?: string };

    const query: Record<string, any> = { userId };

    if (search?.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ name: new RegExp(safe, 'i') }, { domain: new RegExp(safe, 'i') }];
    }

    if (status === 'active' || status === 'paused') {
      query.status = status;
    }

    const loadBalancers = await LoadBalancer.find(query).sort({ createdAt: -1 });

    const schedulers = await HealthCheckScheduler.find({
      loadBalancerId: { $in: loadBalancers.map((lb) => lb._id) },
    });

    const schedulerByLbId = new Map(
      schedulers.map((scheduler) => [scheduler.loadBalancerId.toString(), scheduler])
    );

    const formattedLBs = loadBalancers.map((lb) => {
      const scheduler = schedulerByLbId.get(lb._id.toString()) ?? null;
      const summary = buildHealthSummary(scheduler, lb.origins.length);

      return {
        ...formatLoadBalancer(lb),
        originCount: lb.origins.length,
        disabledOriginCount: summary.disabledOriginCount,
        provisioningOriginCount: summary.provisioningOriginCount,
      };
    });

    res.json({
      success: true,
      message: 'Load balancers retrieved successfully',
      data: { loadBalancers: formattedLBs },
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error as Error);
  }
}
