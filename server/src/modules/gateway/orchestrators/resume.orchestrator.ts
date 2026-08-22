import { Gateway } from '../../../models/Gateway';
import { attachDomainToWorker } from '../../../services/workerDomain';
import { generateGatewayWorkerCode } from '../../../services/workerGenerator';
import { deployWorker } from '../../../services/workerDeployment';
import { getCloudflareCredentialsForUser } from '../services/credentials.service';
import { toHostname } from '../../loadbalancer/services/hostname.service';
import { buildGatewayWorkerConfig } from '../services/config-builder.service';

export async function resumeGatewayOrchestrator(params: { userId: string; gatewayId: string }) {
  const { userId, gatewayId } = params;

  const gateway = await Gateway.findById(gatewayId);
  if (!gateway) {
    const e = new Error('Gateway not found');
    (e as any).statusCode = 404;
    throw e;
  }
  if (gateway.userId.toString() !== userId) {
    const e = new Error('You do not have permission to modify this gateway');
    (e as any).statusCode = 403;
    throw e;
  }
  if (gateway.status !== 'paused') {
    const e = new Error(`Gateway is currently ${gateway.status}, cannot resume.`);
    (e as any).statusCode = 400;
    throw e;
  }

  const { accountId, apiToken } = await getCloudflareCredentialsForUser(userId);

  const rateLimit = gateway.rateLimitEnabled && gateway.rateLimitRequestsPerMinute
    ? { enabled: true as const, requestsPerMinute: gateway.rateLimitRequestsPerMinute }
    : undefined;

  const workerConfig = buildGatewayWorkerConfig({
    upstreams: gateway.upstreams, pathRoutes: gateway.pathRoutes,
    corsEnabled: gateway.corsEnabled, corsOrigins: gateway.corsOrigins,
    jwtAuth: gateway.jwtAuth, headerTransforms: gateway.headerTransforms,
    cacheConfig: gateway.cacheConfig, canary: gateway.canary,
    ipRules: gateway.ipRules, mockRoutes: gateway.mockRoutes,
    rateLimitEnabled: gateway.rateLimitEnabled, rateLimitRequestsPerMinute: gateway.rateLimitRequestsPerMinute,
    pathRateLimits: gateway.pathRateLimits,
  });

  const workerCode = await generateGatewayWorkerCode({
    upstreams: workerConfig.upstreams, pathRoutes: workerConfig.pathRoutes as any,
    corsEnabled: workerConfig.corsEnabled, corsOrigins: workerConfig.corsOrigins,
    jwtAuth: workerConfig.jwtAuth, headerTransforms: workerConfig.headerTransforms,
    cacheConfig: workerConfig.cacheConfig, canary: workerConfig.canary,
    ipRules: workerConfig.ipRules, mockRoutes: workerConfig.mockRoutes,
    rateLimit, pathRateLimits: workerConfig.pathRateLimits,
  });

  await deployWorker({ accountId, apiToken, scriptName: gateway.scriptName, workerCode, placement: { smartPlacement: true }, rateLimit });

  const hostname = toHostname(gateway.domain, gateway.subdomain);
  if ((gateway as any).pauseMode === 'release-domain') {
    await attachDomainToWorker({ accountId, apiToken, hostname, zoneId: gateway.zoneId, scriptName: gateway.scriptName });
  }

  gateway.status = 'active';
  (gateway as any).pauseMode = null;
  await gateway.save();

  return { success: true, message: 'Gateway resumed — live traffic restored', data: { gateway } };
}
