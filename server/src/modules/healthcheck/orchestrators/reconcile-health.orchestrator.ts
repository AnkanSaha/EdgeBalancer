import { LoadBalancer } from '../../../models/LoadBalancer';
import { HealthCheckScheduler } from '../../../models/HealthCheckScheduler';
import { deployWorker, pruneWorkerHistory } from '../../../services/workerDeployment';
import { generateWorkerCode, type WorkerStrategy } from '../../../services/workerGenerator';
import { getCloudflareCredentialsForUser } from '../../loadbalancer/services/credentials.service';
import { acquireLock, releaseLock } from '../../../utils/resourceLock';
import { acquireSemaphore } from '../../../utils/redisSemaphore';

const CF_DEPLOY_CONCURRENCY = Number(process.env.HEALTH_CHECK_CF_CONCURRENCY || 10);
const CF_DEPLOY_LOCK_TTL_SECONDS = 300;

const workerOrigins = (lb: any, scheduler: any) =>
  lb.origins
    .filter((_: any, index: number) => scheduler.origins[index]?.status !== 'disabled')
    .map((origin: any) => ({
      url: origin.url,
      weight: origin.weight,
      geoCities: origin.geoCities,
      geoSubdivisions: origin.geoSubdivisions,
      geoCountries: origin.geoCountries,
      geoContinents: origin.geoContinents,
      isFallback: origin.isFallback,
    }));

export async function reconcileHealthOrchestrator(params: {
  loadBalancerId: string;
  loadBalancer?: any;
}): Promise<void> {
  const { loadBalancerId } = params;
  const lock = await acquireLock(`lb:health:reconcile:${loadBalancerId}`, 60);

  try {
    const lb = params.loadBalancer ?? await LoadBalancer.findById(loadBalancerId);
    const scheduler = await HealthCheckScheduler.findOne({ loadBalancerId });

    if (!lb || !scheduler || scheduler.enabled !== true) {
      return;
    }

    const enabledOrigins = workerOrigins(lb, scheduler);

    if (lb.status !== 'active' && lb.healthAutoPaused !== true) {
      return;
    }

    const { accountId, apiToken } = await getCloudflareCredentialsForUser(lb.userId.toString());
    const rateLimit = lb.rateLimitEnabled && lb.rateLimitRequestsPerMinute
      ? { enabled: true, requestsPerMinute: lb.rateLimitRequestsPerMinute }
      : undefined;
    let workerCode: string;

    if (enabledOrigins.length === 0) {
      workerCode = await generateWorkerCode({ origins: [], strategy: 'paused', rateLimit });
      lb.status = 'paused';
      lb.pauseMode = 'keep-domain';
      lb.healthAutoPaused = true;
      console.warn(`Health check auto-paused load balancer ${loadBalancerId}: all origins disabled`);
    } else {
      workerCode = await generateWorkerCode({
        origins: enabledOrigins,
        strategy: lb.strategy as WorkerStrategy,
        exposeRealOrigin: lb.exposeRealOrigin ?? false,
        corsEnabled: lb.corsEnabled ?? false,
        corsOrigins: lb.corsOrigins ?? [],
        rateLimit,
      });

      if (lb.status === 'paused' && lb.healthAutoPaused) {
        lb.status = 'active';
        lb.pauseMode = undefined;
        lb.healthAutoPaused = false;
        console.log(`Health check re-activated load balancer ${loadBalancerId}`);
      }
    }

    const cfSlot = await acquireSemaphore('cf-deploy', CF_DEPLOY_CONCURRENCY, CF_DEPLOY_LOCK_TTL_SECONDS);
    try {
      await deployWorker({
        accountId,
        apiToken,
        scriptName: lb.scriptName,
        workerCode,
        placement: lb.placement,
        rateLimit,
      });

      console.log(
        `Health check redeployed worker for ${loadBalancerId} with ${enabledOrigins.length} enabled origin(s)`
      );

      await pruneWorkerHistory({
        accountId,
        apiToken,
        scriptName: lb.scriptName,
      });
    } finally {
      await cfSlot?.release();
    }

    await lb.save();
  } finally {
    await releaseLock(lock);
  }
}
