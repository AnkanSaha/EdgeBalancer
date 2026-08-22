import { createRequestCancellation } from '../../../utils/requestCancellation';
import { beginLoadBalancerOperation, completeLoadBalancerOperation, isLoadBalancerOperationCancelled } from '../../../utils/loadBalancerOperationStore';
import { updateGatewayOrchestrator } from '../orchestrators/update.orchestrator';
import { isCancellationError } from '../../loadbalancer/services/operation.service';
import { getValidatedGatewayId } from '../services/validation.service';
import { getUserPlan } from '../../payment/services/subscription.service';
import { PLANS } from '../../../config/plans';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function updateGateway(req: Request, res: Response, next: NextFunction) {
  const operationId = req.header('x-operation-id');
  await beginLoadBalancerOperation(operationId);
  const cancellation = createRequestCancellation(req, res, operationId);

  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401); throw new Error('Not authenticated'); }

    const id = getValidatedGatewayId(req.params?.id);
    const body = req.body;

    const { plan } = await getUserPlan(userId);
    const config = PLANS[plan];

    if (body.jwtAuth?.enabled && !config.hasJwtAuth) {
      res.status(400); throw new Error('JWT validation requires a paid plan.');
    }
    if (body.cacheConfig?.enabled && !config.hasCaching) {
      res.status(400); throw new Error('Response caching requires a paid plan.');
    }
    if (body.canary?.enabled && !config.hasCanary) {
      res.status(400); throw new Error('Canary splitting is a Pro feature.');
    }
    if (config.maxGatewayRoutes !== -1 && Array.isArray(body.pathRoutes) && body.pathRoutes.length > config.maxGatewayRoutes) {
      res.status(400); throw new Error(`Your ${config.name} plan allows ${config.maxGatewayRoutes} routing rules per gateway.`);
    }
    if (config.maxGatewayRateLimitRules !== -1 && Array.isArray(body.pathRateLimits) && body.pathRateLimits.length > config.maxGatewayRateLimitRules) {
      res.status(400); throw new Error(`Your ${config.name} plan allows ${config.maxGatewayRateLimitRules} rate limit rule(s) per gateway.`);
    }
    if (config.maxGatewayHeaderRules !== -1) {
      const headerCount = (body.headerTransforms?.request?.set?.length ?? 0) + (body.headerTransforms?.request?.remove?.length ?? 0) + (body.headerTransforms?.response?.set?.length ?? 0) + (body.headerTransforms?.response?.remove?.length ?? 0);
      if (headerCount > config.maxGatewayHeaderRules) {
        res.status(400); throw new Error(`Your ${config.name} plan allows ${config.maxGatewayHeaderRules} header transform rules per gateway.`);
      }
    }
    if (config.maxGatewayIpRules !== -1 && Array.isArray(body.ipRules) && body.ipRules.length > config.maxGatewayIpRules) {
      res.status(400); throw new Error(`Your ${config.name} plan allows ${config.maxGatewayIpRules} IP rules per gateway.`);
    }
    if (config.maxGatewayMockRoutes !== -1 && Array.isArray(body.mockRoutes) && body.mockRoutes.length > config.maxGatewayMockRoutes) {
      res.status(400); throw new Error(`Your ${config.name} plan allows ${config.maxGatewayMockRoutes} mock routes per gateway.`);
    }
    if (body.rateLimitEnabled && !config.hasRateLimit) {
      res.status(400); throw new Error('Rate limiting requires an EdgeBalancer Pro subscription');
    }

    const result = await updateGatewayOrchestrator({ userId, userEmail: req.user?.email ?? null, gatewayId: id, input: body, cancellation });
    res.json(result);
  } catch (error) {
    if (isCancellationError(error) || cancellation.isCancelled()) {
      if (!res.headersSent) {
        res.status(409).json({
          success: false,
          message: (await isLoadBalancerOperationCancelled(operationId)) ? 'Operation cancelled and rolled back' : 'Request cancelled by client',
          data: null,
        });
      }
      return;
    }
    if ((error as any).statusCode) res.status((error as any).statusCode);
    next(error as Error);
  } finally {
    await completeLoadBalancerOperation(operationId);
  }
}
