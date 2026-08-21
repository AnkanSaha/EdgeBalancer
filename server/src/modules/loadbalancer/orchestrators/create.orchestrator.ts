/**
 * Create Load Balancer Orchestrator
 *
 * Handles the complex workflow for creating a new load balancer
 * with rollback support on failure.
 */

import { LoadBalancer } from '../../../models/LoadBalancer';
import { generateWorkerCode, generateScriptName } from '../../../services/workerGenerator';
import { deployWorker } from '../../../services/workerDeployment';
import { attachDomainToWorker } from '../../../services/workerDomain';
import { deleteWorker } from '../../../services/workerDeletion';
import { getCloudflareCredentialsForUser } from '../services/credentials.service';
import { ensureWorkerNameAvailability } from '../services/validation.service';
import { normalizeStrategy, isWeightedStrategy } from '../services/strategy.service';
import { toHostname, assertHostnameAvailable } from '../services/hostname.service';
import { formatLoadBalancer } from '../services/formatter.service';
import { createSession } from '../../../services/sessionService';
import { resolveIpOrigins, deleteIpDnsRecord } from '../../../services/workerDns';
import type { IpOriginRecord } from '../../../services/workerDns';
import { acquireLock, releaseLock, type LockHandle } from '../../../utils/resourceLock';
import type { RequestCancellation } from '../../../utils/requestCancellation';
import {
  createSchedulerForLb,
} from '../../healthcheck/services/scheduler.service';
import { upsertHealthCheckJob } from '../../healthcheck/services/queue.service';

export interface CreateLoadBalancerInput {
  name: string;
  domain: string;
  subdomain?: string;
  zoneId: string;
  origins: Array<{
    url: string;
    weight: number;
    rawIp?: string;
    healthPath?: string;
    geoCities?: string[];
    geoSubdivisions?: string[];
    geoCountries?: string[];
    geoContinents?: string[];
    isFallback?: boolean;
  }>;
  strategy?: string;
  weightedEnabled?: boolean;
  exposeRealOrigin?: boolean;
  corsEnabled?: boolean;
  corsOrigins?: string[];
  healthCheckEnabled?: boolean;
  healthCheckIntervalSeconds?: number;
  rateLimitEnabled?: boolean;
  rateLimitRequestsPerMinute?: number;
  pathRoutes?: Array<{ path: string; originIndex: number; priority: number }>;
  pathRateLimits?: Array<{ path: string; requestsPerMinute: number; priority: number }>;
  placement?: {
    smartPlacement?: boolean;
    region?: string;
  };
}

export interface CreateLoadBalancerResult {
  success: boolean;
  message: string;
  data: {
    loadBalancer: any;
  };
}

export async function createLoadBalancerOrchestrator(params: {
  userId: string;
  userEmail: string | null;
  operationId: string | undefined;
  input: CreateLoadBalancerInput;
  cancellation: RequestCancellation;
}): Promise<CreateLoadBalancerResult> {
  const { userId, userEmail, input, cancellation } = params;

  let createdLoadBalancer: any = null;
  let scriptName = '';
  let hostname = '';
  let accountId = '';
  let apiToken = '';
  let isOAuth: boolean | undefined = false;
  let workerCode = '';
  let ipOriginRecords: IpOriginRecord[] = [];
  let nameLock: LockHandle | null = null;

  const {
    name,
    domain,
    subdomain,
    zoneId,
    origins,
    strategy,
    weightedEnabled,
    exposeRealOrigin,
    corsEnabled,
    corsOrigins,
    healthCheckEnabled,
    healthCheckIntervalSeconds,
    rateLimitEnabled,
    rateLimitRequestsPerMinute,
    pathRoutes,
    pathRateLimits,
    placement,
  } = input;

  const nextStrategy = normalizeStrategy(strategy, weightedEnabled || false);
  const nextWeightedEnabled = isWeightedStrategy(nextStrategy);
  const nextHealthCheckEnabled = healthCheckEnabled === true;
  const nextHealthInterval = healthCheckIntervalSeconds ?? 30;
  const nextRateLimitEnabled = rateLimitEnabled === true;
  const nextRateLimitPerMinute = nextRateLimitEnabled ? (rateLimitRequestsPerMinute ?? null) : null;
  const rateLimit = nextRateLimitEnabled && nextRateLimitPerMinute !== null
    ? { enabled: true, requestsPerMinute: nextRateLimitPerMinute }
    : undefined;

  try {
    // Step 1: Get Cloudflare credentials
    ({ accountId, apiToken, isOAuth } = await getCloudflareCredentialsForUser(userId));

    // Step 2: Generate script name and validate availability
    scriptName = generateScriptName(name);

    // Claim the name before checking it. Without this, two concurrent creates both pass the
    // availability check, both PUT the same script (an upsert, so the second silently replaces
    // the first), and the one that loses the DB unique index deletes the survivor's Worker
    // during rollback. Scoped to the Cloudflare account so one user's names never reveal or
    // block another's.
    nameLock = await acquireLock(`lb:create:${accountId}:${scriptName}`);
    if (!nameLock) {
      const error = new Error('Another deployment is already using this name. Wait for it to finish or choose a different name.');
      (error as any).statusCode = 409;
      throw error;
    }

    await ensureWorkerNameAvailability({
      userId,
      accountId,
      apiToken,
      scriptName,
    });
    await cancellation.throwIfCancelled();

    // Step 3: Resolve raw IP origins to internal grey-cloud DNS hostnames
    const resolved = await resolveIpOrigins({ origins, scriptName, domain, zoneId, apiToken, isOAuth });
    ipOriginRecords = resolved.ipOriginRecords;
    await cancellation.throwIfCancelled();

    // Step 4: Generate Worker code using resolved origins (hostnames, not raw IPs)
    workerCode = await generateWorkerCode({
      origins: resolved.resolvedOrigins,
      strategy: nextStrategy,
      exposeRealOrigin: exposeRealOrigin ?? false,
      corsEnabled: corsEnabled ?? false,
      corsOrigins: corsOrigins ?? [],
      rateLimit,
      pathRoutes: pathRoutes ?? [],
      pathRateLimits: pathRateLimits ?? [],
    });

    // Step 5: Deploy Worker to Cloudflare
    await deployWorker({
      accountId,
      apiToken,
      scriptName,
      workerCode,
      placement: placement || { smartPlacement: false },
      rateLimit,
    });
    await cancellation.throwIfCancelled();

    // Step 6: Construct and validate hostname
    hostname = toHostname(domain, subdomain);
    await assertHostnameAvailable({
      userId,
      accountId,
      apiToken,
      hostname,
      zoneId,
    });
    await cancellation.throwIfCancelled();

    // Step 7: Attach domain to Worker
    const workerUrl = await attachDomainToWorker({
      accountId,
      apiToken,
      hostname,
      zoneId,
      scriptName,
    });
    await cancellation.throwIfCancelled();

    // Step 8: Save load balancer to database
    // Strip transient rawIp field from origins before persisting (it's only used for DNS record creation)
    const originsForDb = origins.map(({ rawIp: _, ...rest }: any) => rest);
    createdLoadBalancer = await LoadBalancer.create({
      userId,
      name,
      scriptName,
      domain,
      subdomain: subdomain || undefined,
      origins: originsForDb,
      strategy: nextStrategy,
      weightedEnabled: nextWeightedEnabled,
      exposeRealOrigin: exposeRealOrigin ?? false,
      corsEnabled: corsEnabled ?? false,
      corsOrigins: corsOrigins ?? [],
      healthCheckEnabled: nextHealthCheckEnabled,
      healthCheckIntervalSeconds: nextHealthInterval,
      healthAutoPaused: false,
      rateLimitEnabled: nextRateLimitEnabled,
      rateLimitRequestsPerMinute: nextRateLimitPerMinute,
      pathRoutes: pathRoutes ?? [],
      pathRateLimits: pathRateLimits ?? [],
      ipOriginRecords,
      placement,
      zoneId,
      status: 'active',
      workerUrl,
    });
    await cancellation.throwIfCancelled();

    // Step 8.5: Create health check scheduler + repeatable job (non-blocking)
    if (nextHealthCheckEnabled) {
      try {
        const scheduler = await createSchedulerForLb(
          userId,
          createdLoadBalancer._id.toString(),
          originsForDb,
          nextHealthInterval
        );
        await upsertHealthCheckJob(createdLoadBalancer._id.toString(), scheduler.intervalSeconds);
      } catch (healthError: any) {
        console.error(`Health check setup failed (create): ${healthError.message}`);
      }
    }

    // Step 9: Save session log (non-blocking — failure must not roll back the LB)
    try {
      await createSession({
        userId,
        email: userEmail,
        content: workerCode,
        loadBalancerName: name,
        domain,
        subdomain: subdomain ?? null,
        strategy: nextStrategy,
        placement: placement ?? null,
        exposeRealOrigin: exposeRealOrigin ?? null,
        actionType: 'create',
        loadBalancerId: createdLoadBalancer._id.toString(),
      });
    } catch (sessionError: any) {
      console.error(`Session log failed (create): ${sessionError.message}`);
    }

    return {
      success: true,
      message: 'Load balancer created successfully',
      data: {
        loadBalancer: {
          ...formatLoadBalancer(createdLoadBalancer),
          originCount: createdLoadBalancer.origins.length,
        },
      },
    };
  } catch (error) {
    // Rollback: clean up all resources created so far.
    // `nameLock` gates this. A run that lost the race never deployed anything under this script
    // name, so cleaning up by that name would destroy the Worker the winning run owns.
    if (nameLock && accountId && apiToken && scriptName) {
      try {
        // Delete auto-created DNS records for raw IP origins
        await Promise.allSettled(
          ipOriginRecords.map(r => deleteIpDnsRecord({ apiToken, zoneId, recordId: r.dnsRecordId }))
        );

        if (createdLoadBalancer?._id) {
          await LoadBalancer.findByIdAndDelete(createdLoadBalancer._id);
        }

        await deleteWorker({
          accountId,
          apiToken,
          scriptName,
          hostname: hostname || undefined,
        });
      } catch (rollbackError: any) {
        console.error(`Create rollback failed: ${rollbackError.message}`);
      }
    }

    throw error;
  } finally {
    await releaseLock(nameLock);
  }
}
