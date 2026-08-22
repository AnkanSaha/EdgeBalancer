import { decrypt } from '../../../utils/encryption';
import { encrypt } from '../../../utils/encryption';
import type { IGateway } from '../../../models/Gateway';
import type { CreateGatewayInput } from '../types/gateway.types';

/**
 * The plain JS config injected into the gateway Worker template as __CONFIG__.
 * JWT secrets travel encrypted at rest in Mongo and are decrypted only here,
 * at the last moment before the script is generated.
 */
export interface GatewayWorkerConfig {
  upstreams: Array<{ url: string; weight: number }>;
  pathRoutes: Array<{ path: string; upstreamIndex: number; priority: number }>;
  corsEnabled: boolean;
  corsOrigins: string[];
  jwtAuth: {
    enabled: boolean;
    headerName: string;
    algorithms: string[];
    issuer: string | null;
    secret: string | null;
  };
  headerTransforms: {
    request: { set: Array<{ name: string; value: string }>; remove: string[] };
    response: { set: Array<{ name: string; value: string }>; remove: string[] };
  };
  cacheConfig: { enabled: boolean; ttlSeconds: number; paths: string[] };
  canary: { enabled: boolean; percentage: number; upstreamIndex: number };
  ipRules: Array<{ value: string; action: 'allow' | 'deny' }>;
  mockRoutes: Array<{ path: string; method: string; status: number; body: string; contentType: string }>;
  rateLimitEnabled: boolean;
  rateLimitRequestsPerMinute: number | null;
  pathRateLimits: Array<{ path: string; requestsPerMinute: number; priority: number }>;
}

export function resolveJwtSecret(jwtAuth: any): string | null {
  if (!jwtAuth?.enabled || !jwtAuth.secretEncrypted || !jwtAuth.secretIv || !jwtAuth.secretTag) return null;
  try {
    return decrypt(jwtAuth.secretEncrypted, jwtAuth.secretIv, jwtAuth.secretTag);
  } catch {
    return null;
  }
}

export function encryptJwtSecret(secret: string) {
  const { encrypted, iv, tag } = encrypt(secret);
  return { secretEncrypted: encrypted, secretIv: iv, secretTag: tag };
}

export function buildGatewayWorkerConfig(input: {
  upstreams: Array<{ url: string; weight: number }>;
  pathRoutes?: Array<{ path: string; upstreamIndex: number; priority: number }> | null;
  corsEnabled?: boolean;
  corsOrigins?: string[] | null;
  jwtAuth?: any;
  headerTransforms?: any;
  cacheConfig?: any;
  canary?: any;
  ipRules?: Array<{ value: string; action: 'allow' | 'deny' }> | null;
  mockRoutes?: Array<any> | null;
  rateLimitEnabled?: boolean;
  rateLimitRequestsPerMinute?: number | null;
  pathRateLimits?: Array<{ path: string; requestsPerMinute: number; priority: number }> | null;
}): GatewayWorkerConfig {
  const jwt = input.jwtAuth ?? {};
  const transforms = input.headerTransforms ?? {};

  return {
    upstreams: input.upstreams.map((u) => ({ url: u.url.trim(), weight: u.weight })),
    pathRoutes: (input.pathRoutes ?? []).slice().sort((a, b) => a.priority - b.priority),
    corsEnabled: input.corsEnabled ?? false,
    corsOrigins: input.corsOrigins ?? [],
    jwtAuth: {
      enabled: jwt.enabled === true,
      headerName: jwt.headerName ?? 'Authorization',
      algorithms: jwt.algorithms ?? ['HS256'],
      issuer: jwt.issuer ?? null,
      secret: resolveJwtSecret(jwt),
    },
    headerTransforms: {
      request: {
        set: transforms.request?.set ?? [],
        remove: transforms.request?.remove ?? [],
      },
      response: {
        set: transforms.response?.set ?? [],
        remove: transforms.response?.remove ?? [],
      },
    },
    cacheConfig: {
      enabled: input.cacheConfig?.enabled === true,
      ttlSeconds: input.cacheConfig?.ttlSeconds ?? 60,
      paths: input.cacheConfig?.paths ?? [],
    },
    canary: {
      enabled: input.canary?.enabled === true,
      percentage: Math.min(100, Math.max(0, input.canary?.percentage ?? 10)),
      upstreamIndex: input.canary?.upstreamIndex ?? 0,
    },
    ipRules: input.ipRules ?? [],
    mockRoutes: (input.mockRoutes ?? []).map((m) => ({
      path: m.path,
      method: m.method ?? 'ANY',
      status: m.status,
      body: m.body ?? '',
      contentType: m.contentType ?? 'application/json',
    })),
    rateLimitEnabled: input.rateLimitEnabled === true,
    rateLimitRequestsPerMinute: input.rateLimitRequestsPerMinute ?? null,
    pathRateLimits: (input.pathRateLimits ?? []).slice().sort((a, b) => a.priority - b.priority),
  };
}

/** Convenience for orchestrators holding a saved Gateway document. */
export function workerConfigFromDocument(doc: IGateway): GatewayWorkerConfig {
  return buildGatewayWorkerConfig({
    upstreams: doc.upstreams,
    pathRoutes: doc.pathRoutes,
    corsEnabled: doc.corsEnabled,
    corsOrigins: doc.corsOrigins,
    jwtAuth: doc.jwtAuth,
    headerTransforms: doc.headerTransforms,
    cacheConfig: doc.cacheConfig,
    canary: doc.canary,
    ipRules: doc.ipRules,
    mockRoutes: doc.mockRoutes,
    rateLimitEnabled: doc.rateLimitEnabled,
    rateLimitRequestsPerMinute: doc.rateLimitRequestsPerMinute,
    pathRateLimits: doc.pathRateLimits,
  });
}
