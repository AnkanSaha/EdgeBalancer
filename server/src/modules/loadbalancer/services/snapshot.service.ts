/**
 * Snapshot Service
 *
 * Handles load balancer state snapshots and configuration comparison.
 */

import { normalizeStoredStrategy, isWeightedStrategy } from './strategy.service';

/**
 * Create a snapshot of load balancer state for comparison/rollback
 */
export function snapshotLoadBalancer(loadBalancer: any) {
  return {
    name: loadBalancer.name,
    scriptName: loadBalancer.scriptName,
    domain: loadBalancer.domain,
    subdomain: loadBalancer.subdomain || undefined,
    zoneId: loadBalancer.zoneId,
    origins: loadBalancer.origins.map((origin: any) => ({
      url: origin.url,
      weight: origin.weight,
      healthPath: origin.healthPath ?? '/',
      geoCities: Array.isArray(origin.geoCities) ? origin.geoCities : [],
      geoSubdivisions: Array.isArray(origin.geoSubdivisions) ? origin.geoSubdivisions : [],
      geoCountries: Array.isArray(origin.geoCountries) ? origin.geoCountries : [],
      geoContinents: Array.isArray(origin.geoContinents) ? origin.geoContinents : [],
      isFallback: origin.isFallback === true,
    })),
    strategy: normalizeStoredStrategy(loadBalancer.strategy, loadBalancer.weightedEnabled),
    weightedEnabled: isWeightedStrategy(loadBalancer.strategy),
    exposeRealOrigin: loadBalancer.exposeRealOrigin ?? false,
    corsEnabled: loadBalancer.corsEnabled ?? false,
    corsOrigins: Array.isArray(loadBalancer.corsOrigins) ? loadBalancer.corsOrigins : [],
    rateLimitEnabled: loadBalancer.rateLimitEnabled === true,
    rateLimitRequestsPerMinute: loadBalancer.rateLimitRequestsPerMinute ?? null,
    pathRoutes: Array.isArray(loadBalancer.pathRoutes) ? loadBalancer.pathRoutes.map((r: any) => ({
      path: r.path,
      originIndex: r.originIndex,
      priority: r.priority,
    })) : [],
    pathRateLimits: Array.isArray(loadBalancer.pathRateLimits) ? loadBalancer.pathRateLimits.map((r: any) => ({
      path: r.path,
      requestsPerMinute: r.requestsPerMinute,
      priority: r.priority,
    })) : [],
    healthCheckEnabled: loadBalancer.healthCheckEnabled === true,
    healthCheckIntervalSeconds: loadBalancer.healthCheckIntervalSeconds ?? 30,
    healthAutoPaused: loadBalancer.healthAutoPaused === true,
    ipOriginRecords: Array.isArray(loadBalancer.ipOriginRecords) ? loadBalancer.ipOriginRecords : [],
    placement: {
      smartPlacement: loadBalancer.placement?.smartPlacement !== false,
      region: loadBalancer.placement?.region || undefined,
    },
    workerUrl: loadBalancer.workerUrl,
    status: loadBalancer.status,
    pauseMode: loadBalancer.pauseMode,
  };
}

/**
 * Normalize placement configuration
 */
export function normalizePlacement(placement: any) {
  return {
    smartPlacement: placement?.smartPlacement !== false,
    region: placement?.region || undefined,
  };
}

/**
 * Generate configuration signature for change detection
 */
export function configSignature(params: {
  origins: Array<{ url: string; weight: number; healthPath?: string }>;
  strategy: string;
  weightedEnabled: boolean;
  exposeRealOrigin?: boolean;
  corsEnabled?: boolean;
  corsOrigins?: string[];
  rateLimitEnabled?: boolean;
  rateLimitRequestsPerMinute?: number | null;
  pathRoutes?: Array<{ path: string; originIndex: number; priority: number }>;
  pathRateLimits?: Array<{ path: string; requestsPerMinute: number; priority: number }>;
  healthCheckEnabled?: boolean;
  healthCheckIntervalSeconds?: number;
  placement: any;
}): string {
  const { origins, strategy, weightedEnabled, exposeRealOrigin, corsEnabled, corsOrigins, rateLimitEnabled, rateLimitRequestsPerMinute, pathRoutes, pathRateLimits, healthCheckEnabled, healthCheckIntervalSeconds, placement } = params;

  return JSON.stringify({
    origins: origins.map((origin) => ({
      url: origin.url.trim(),
      weight: origin.weight,
      healthPath: (origin as any).healthPath ?? '/',
      geoCities: Array.isArray((origin as any).geoCities)
        ? (origin as any).geoCities.map((value: string) => value.trim().toUpperCase()).filter(Boolean)
        : [],
      geoSubdivisions: Array.isArray((origin as any).geoSubdivisions)
        ? (origin as any).geoSubdivisions.map((code: string) => code.trim().toUpperCase()).filter(Boolean)
        : [],
      geoCountries: Array.isArray((origin as any).geoCountries)
        ? (origin as any).geoCountries.map((code: string) => code.trim().toUpperCase()).filter(Boolean)
        : [],
      geoContinents: Array.isArray((origin as any).geoContinents)
        ? (origin as any).geoContinents.map((code: string) => code.trim().toUpperCase()).filter(Boolean)
        : [],
      isFallback: (origin as any).isFallback === true,
    })),
    strategy,
    weightedEnabled,
    exposeRealOrigin: exposeRealOrigin ?? false,
    corsEnabled: corsEnabled ?? false,
    corsOrigins: [...(corsOrigins ?? [])].sort(),
    rateLimitEnabled: rateLimitEnabled === true,
    rateLimitRequestsPerMinute: rateLimitRequestsPerMinute ?? null,
    pathRoutes: (pathRoutes ?? []).sort((a, b) => a.priority - b.priority),
    pathRateLimits: (pathRateLimits ?? []).sort((a, b) => a.priority - b.priority),
    healthCheckEnabled: healthCheckEnabled === true,
    healthCheckIntervalSeconds: healthCheckIntervalSeconds ?? 30,
    placement: normalizePlacement(placement),
  });
}
