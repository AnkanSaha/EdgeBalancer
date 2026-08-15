import { LoadBalancer } from '../../../models/LoadBalancer';
import { HealthCheckScheduler } from '../../../models/HealthCheckScheduler';
import { probeOrigin, isHealthyStatus } from './probe.service';
import { reconcileHealthOrchestrator } from '../orchestrators/reconcile-health.orchestrator';

const BACKOFF_BASE_MS = 2000;
const JITTER_MAX_MS = 1000;

const delayMsForAttempt = (attempt: number): number =>
  BACKOFF_BASE_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * JITTER_MAX_MS);

const pool = async <T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> => {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await fn(item);
    }
  });
  await Promise.all(runners);
};

export async function processHealthCheckJob(loadBalancerId: string): Promise<void> {
  const loadBalancer = await LoadBalancer.findById(loadBalancerId);
  const scheduler = await HealthCheckScheduler.findOne({ loadBalancerId });

  if (!loadBalancer || !scheduler || scheduler.enabled !== true) {
    return;
  }

  const now = new Date();
  const checkable: { index: number; previousStatus: string }[] = [];

  scheduler.origins.forEach((origin, index) => {
    if (origin.status === 'disabled') return;
    if (origin.nextCheckAt && new Date(origin.nextCheckAt).getTime() > now.getTime()) return;
    checkable.push({ index, previousStatus: origin.status });
  });

  if (checkable.length === 0) {
    return;
  }

  let reconciled = false;

  await pool(checkable, 5, async ({ index, previousStatus }) => {
    const origin = scheduler.origins[index];
    const result = await probeOrigin({ url: origin.url, healthPath: origin.healthPath });
    const healthy = isHealthyStatus(result.statusCode);

    origin.lastCheckedAt = now;
    origin.lastStatusCode = result.statusCode;
    origin.lastError = result.error;

    if (healthy) {
      origin.status = 'healthy';
      origin.attempts = 0;
      origin.nextCheckAt = null;
      if (previousStatus === 'provisioning') {
        origin.disabledAt = null;
        reconciled = true;
      }
      console.log(
        `Health check passed for ${loadBalancerId} origin ${origin.url} (${result.statusCode})`
      );
      return;
    }

    origin.status = 'unhealthy';
    origin.attempts = (origin.attempts ?? 0) + 1;

    if (origin.attempts >= 3) {
      origin.status = 'disabled';
      origin.disabledAt = now;
      origin.nextCheckAt = null;
      reconciled = true;
      console.warn(
        `Health check disabled origin ${origin.url} for ${loadBalancerId} after ${origin.attempts} failures`
      );
    } else {
      origin.nextCheckAt = new Date(now.getTime() + delayMsForAttempt(origin.attempts));
      console.warn(
        `Health check failed for ${origin.url} (attempt ${origin.attempts}/3): ${result.error ?? `status ${result.statusCode}`}`
      );
    }
  });

  await scheduler.save();

  if (reconciled) {
    try {
      await reconcileHealthOrchestrator({ loadBalancerId });
    } catch (error: any) {
      console.error(`Health reconcile failed for ${loadBalancerId}: ${error.message}`);
    }
  }
}
