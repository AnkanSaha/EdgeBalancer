import {
  HealthCheckScheduler,
  type IHealthCheckScheduler,
} from '../../../models/HealthCheckScheduler';
import type {
  HealthCheckSummary,
  HealthCheckOriginState,
} from '../types/healthcheck.types';

interface SchedulerOriginInput {
  url: string;
  healthPath?: string;
}

const toOriginState = (origin: SchedulerOriginInput): HealthCheckOriginState => ({
  url: origin.url.trim(),
  healthPath: origin.healthPath?.trim() || '/',
  status: 'healthy',
  attempts: 0,
  lastCheckedAt: null,
  lastStatusCode: null,
  lastError: null,
  nextCheckAt: null,
  disabledAt: null,
});

export async function createSchedulerForLb(
  userId: string,
  loadBalancerId: string,
  origins: SchedulerOriginInput[],
  intervalSeconds: number
): Promise<IHealthCheckScheduler> {
  return HealthCheckScheduler.create({
    userId,
    loadBalancerId,
    intervalSeconds,
    enabled: true,
    origins: origins.map(toOriginState),
  });
}

export async function removeSchedulerForLb(loadBalancerId: string): Promise<void> {
  await HealthCheckScheduler.deleteOne({ loadBalancerId }).catch(() => {});
}

export async function getSchedulerForLb(
  loadBalancerId: string
): Promise<IHealthCheckScheduler | null> {
  return HealthCheckScheduler.findOne({ loadBalancerId });
}

export async function syncSchedulerOrigins(
  scheduler: IHealthCheckScheduler,
  nextOrigins: SchedulerOriginInput[],
  nextIntervalSeconds: number
): Promise<IHealthCheckScheduler> {
  const existing = new Map(scheduler.origins.map((origin) => [origin.url, origin]));

  scheduler.origins = nextOrigins.map((origin) => {
    const url = origin.url.trim();
    const previous = existing.get(url);

    if (previous) {
      return previous;
    }

    return toOriginState({ url, healthPath: origin.healthPath });
  }) as any;

  scheduler.intervalSeconds = nextIntervalSeconds;
  await scheduler.save();
  return scheduler;
}

export const buildHealthSummary = (
  scheduler: IHealthCheckScheduler | null,
  originCount: number
): HealthCheckSummary => {
  const origins = scheduler?.origins ?? [];

  return {
    healthCheckEnabled: scheduler?.enabled === true,
    healthCheckIntervalSeconds: scheduler?.intervalSeconds ?? null,
    disabledOriginCount: origins.filter((o) => o.status === 'disabled').length,
    provisioningOriginCount: origins.filter((o) => o.status === 'provisioning').length,
    originHealth: origins.map((o) => ({
      url: o.url,
      status: o.status,
      lastCheckedAt: o.lastCheckedAt,
      lastStatusCode: o.lastStatusCode,
      lastError: o.lastError,
    })),
  };
};

export const schedulerOriginCount = (scheduler: IHealthCheckScheduler | null): number =>
  scheduler?.origins?.length ?? 0;

export const getEnabledOrigins = (
  scheduler: IHealthCheckScheduler | null,
  totalOrigins: any[]
): any[] => {
  if (!scheduler) return totalOrigins;

  return totalOrigins.filter((_, index) => scheduler.origins[index]?.status !== 'disabled');
};
