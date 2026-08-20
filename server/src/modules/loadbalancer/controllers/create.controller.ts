/**
 * Create Load Balancer Controller
 */

import { createRequestCancellation } from '../../../utils/requestCancellation';
import { beginLoadBalancerOperation, completeLoadBalancerOperation, isLoadBalancerOperationCancelled } from '../../../utils/loadBalancerOperationStore';
import { createLoadBalancerOrchestrator } from '../orchestrators/create.orchestrator';
import { isCancellationError } from '../services/operation.service';
import { LoadBalancer } from '../../../models/LoadBalancer';
import { getUserPlan } from '../../payment/services/subscription.service';
import { PLANS, isStrategyAllowed } from '../../../config/plans';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function createLoadBalancer(req: Request, res: Response, next: NextFunction) {
  const operationId = req.header('x-operation-id');
  await beginLoadBalancerOperation(operationId);
  const cancellation = createRequestCancellation(req, res, operationId);

  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const { plan } = await getUserPlan(userId);
    const config = PLANS[plan];

    // LB creation limit
    if (config.lbLimit > 0) {
      const count = await LoadBalancer.countDocuments({ userId });
      if (count >= config.lbLimit) {
        res.status(400);
        throw new Error(`Your ${config.name} plan allows ${config.lbLimit} load balancer${config.lbLimit === 1 ? '' : 's'}. Upgrade to create more.`);
      }
    }

    // Strategy gating
    const strategy = req.body.strategy;
    if (strategy && !isStrategyAllowed(plan, strategy)) {
      res.status(400);
      throw new Error(`The "${strategy}" strategy requires a higher plan. Upgrade to unlock all strategies.`);
    }

    // Placement gating — free users can't modify placement (smart placement forced on)
    if (!config.canEditPlacement) {
      req.body.placement = { smartPlacement: true };
    }

    // Health check limit (Student: max 5 LBs with HC)
    if (req.body.healthCheckEnabled) {
      if (config.maxHealthCheckLBs === 0) {
        res.status(400);
        throw new Error('Health Checks require an EdgeBalancer Pro or Student subscription');
      }
      if (config.maxHealthCheckLBs > 0) {
        const hcCount = await LoadBalancer.countDocuments({ userId, healthCheckEnabled: true });
        if (hcCount >= config.maxHealthCheckLBs) {
          res.status(400);
          throw new Error(`Your ${config.name} plan allows health checks on ${config.maxHealthCheckLBs} load balancers. Delete one with health checks to add a new one.`);
        }
      }
    }

    // Rate limiting — Pro only
    if (req.body.rateLimitEnabled && !config.hasRateLimit) {
      res.status(400);
      throw new Error('Rate Limiting requires an EdgeBalancer Pro subscription');
    }

    const result = await createLoadBalancerOrchestrator({
      userId,
      userEmail: req.user?.email ?? null,
      operationId,
      input: req.body,
      cancellation,
    });

    res.status(201).json(result);
  } catch (error) {
    if (isCancellationError(error) || cancellation.isCancelled()) {
      if (!res.headersSent) {
        res.status(409).json({
          success: false,
          message: (await isLoadBalancerOperationCancelled(operationId))
            ? 'Operation cancelled and rolled back'
            : 'Request cancelled by client',
          data: null,
        });
      }
      return;
    }

    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error as Error);
  } finally {
    await completeLoadBalancerOperation(operationId);
  }
}
