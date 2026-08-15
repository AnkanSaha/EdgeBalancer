import type { OriginHealthStatus } from '../../../models/HealthCheckScheduler';

export type { OriginHealthStatus };

export interface HealthCheckOriginState {
  url: string;
  healthPath: string;
  status: OriginHealthStatus;
  attempts: number;
  lastCheckedAt: Date | null;
  lastStatusCode: number | null;
  lastError: string | null;
  nextCheckAt: Date | null;
  disabledAt: Date | null;
}

export interface HealthCheckOriginSummary {
  url: string;
  status: OriginHealthStatus;
  lastCheckedAt: Date | null;
  lastStatusCode: number | null;
  lastError: string | null;
}

export interface HealthCheckSummary {
  healthCheckEnabled: boolean;
  healthCheckIntervalSeconds: number | null;
  disabledOriginCount: number;
  provisioningOriginCount: number;
  originHealth: HealthCheckOriginSummary[];
}
