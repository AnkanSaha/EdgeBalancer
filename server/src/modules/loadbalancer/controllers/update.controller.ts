/**
 * Update Load Balancer Controller
 */

import { createRequestCancellation } from '../../../utils/requestCancellation';
import { beginLoadBalancerOperation, completeLoadBalancerOperation, isLoadBalancerOperationCancelled } from '../../../utils/loadBalancerOperationStore';
import { updateLoadBalancerOrchestrator } from '../orchestrators/update.orchestrator';
import { getValidatedLoadBalancerId } from '../services/validation.service';
import { isCancellationError } from '../services/operation.service';
import { LoadBalancer } from '../../../models/LoadBalancer';
import { getUserPlan } from '../../payment/services/subscription.service';
import { PLANS, isStrategyAllowed } from '../../../config/plans';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function updateLoadBalancer(req: Request, res: Response, next: NextFunction) {
  const operationId = req.header('x-operation-id');
  await beginLoadBalancerOperation(operationId);
  const cancellation = createRequestCancellation(req, res, operationId);

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

    const { plan } = await getUserPlan(userId);
    const config = PLANS[plan];

    // Strategy gating
    const strategy = req.body.strategy;
    if (strategy && !isStrategyAllowed(plan, strategy)) {
      res.status(400);
      throw new Error(`The "${strategy}" strategy requires a higher plan. Upgrade to unlock all strategies.`);
    }

    // Placement gating — free users can't modify placement
    if (!config.canEditPlacement && req.body.placement !== undefined) {
      delete req.body.placement;
    }

    // Health check limit
    if (req.body.healthCheckEnabled) {
      if (config.maxHealthCheckLBs === 0) {
        res.status(400);
        throw new Error('Health Checks require an EdgeBalancer Pro or Student subscription');
      }
      if (config.maxHealthCheckLBs > 0) {
        const lb = await LoadBalancer.findById(id).select('healthCheckEnabled');
        // Only count if this LB doesn't already have HC
        if (!lb?.healthCheckEnabled) {
          const hcCount = await LoadBalancer.countDocuments({ userId, healthCheckEnabled: true });
          if (hcCount >= config.maxHealthCheckLBs) {
            res.status(400);
            throw new Error(`Your ${config.name} plan allows health checks on ${config.maxHealthCheckLBs} load balancers.`);
          }
        }
      }
    }

    // Rate limiting — Pro only
    if (req.body.rateLimitEnabled && !config.hasRateLimit) {
      res.status(400);
      throw new Error('Rate Limiting requires an EdgeBalancer Pro subscription');
    }

    const result = await updateLoadBalancerOrchestrator({
      userId,
      userEmail: req.user?.email ?? null,
      loadBalancerId: id,
      input: req.body,
      cancellation,
    });

    res.json(result);
  } catch (error: any) {
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

    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error as Error);
  } finally {
    await completeLoadBalancerOperation(operationId);
  }
}
