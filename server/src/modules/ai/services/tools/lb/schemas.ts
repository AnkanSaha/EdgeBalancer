const ORIGIN_SCHEMA = {
  type: 'object',
  properties: {
    url: { type: 'string', description: 'Origin URL, must start with http:// or https://' },
    weight: { type: 'integer', minimum: 1, maximum: 100, description: 'Relative weight, 1 unless the user wants a weighted split' },
    healthPath: { type: 'string', description: 'health checks only: path to probe, default "/"' },
    geoCities: { type: 'array', items: { type: 'string' }, description: 'geo-steering only: uppercase city names' },
    geoSubdivisions: { type: 'array', items: { type: 'string' }, description: 'geo-steering only: ISO 3166-2 subdivision codes' },
    geoCountries: { type: 'array', items: { type: 'string' }, description: 'geo-steering only: 2-letter uppercase ISO country codes' },
    geoContinents: { type: 'array', items: { type: 'string' }, description: 'geo-steering only: AF, AN, AS, EU, NA, OC or SA' },
    isFallback: { type: 'boolean', description: 'geo-steering only: at most one origin may be the fallback' },
  },
  required: ['url', 'weight'],
} as const;

export const CONFIG_PROPERTIES = {
  domain: { type: 'string', description: 'Zone name from list_zones, e.g. example.com' },
  subdomain: { type: 'string', description: 'Optional hostname prefix only, e.g. "api". Never the full hostname.' },
  zoneId: { type: 'string', description: '32-character zone id from list_zones' },
  origins: { type: 'array', items: ORIGIN_SCHEMA, minItems: 1 },
  strategy: {
    type: 'string',
    enum: ['round-robin', 'weighted-round-robin', 'ip-hash', 'cookie-sticky', 'weighted-cookie-sticky', 'failover', 'geo-steering', 'rr', 'wrr', 'geo'],
    description: 'Use full name: round-robin (or rr), weighted-round-robin, ip-hash, cookie-sticky, weighted-cookie-sticky, failover, geo-steering',
  },
  weightedEnabled: { type: 'boolean', description: 'true only for weighted-round-robin and weighted-cookie-sticky' },
  exposeRealOrigin: { type: 'boolean' },
  corsEnabled: { type: 'boolean' },
  corsOrigins: { type: 'array', items: { type: 'string' } },
  rateLimitEnabled: { type: 'boolean', description: 'true to enforce requests-per-minute rate limiting per client IP' },
  rateLimitRequestsPerMinute: { type: 'integer', minimum: 0, maximum: 100000, description: 'requests allowed per minute per client IP; required and >=1 when rateLimitEnabled is true, omit or 0 otherwise' },
  pathRoutes: {
    type: 'array',
    description: 'Path-based routing rules. Each maps a URL path pattern to a specific origin by index. First matching rule wins (checked by priority). Optional.',
    items: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path pattern, e.g. /api/*, /static/*' },
        originIndex: { type: 'integer', minimum: 0, description: '0-based index into the origins array' },
        priority: { type: 'integer', minimum: 1, description: 'Lower = checked first' },
      },
      required: ['path', 'originIndex', 'priority'],
    },
  },
  pathRateLimits: {
    type: 'array',
    description: 'Path-based rate limits. Each applies a separate requests/minute cap to a URL path pattern. Optional.',
    items: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path pattern, e.g. /login/*, /api/*' },
        requestsPerMinute: { type: 'integer', minimum: 1, maximum: 100000 },
        priority: { type: 'integer', minimum: 1, description: 'Lower = checked first' },
      },
      required: ['path', 'requestsPerMinute', 'priority'],
    },
  },
  healthCheckEnabled: { type: 'boolean', description: 'true to probe each origin and stop routing to failed backends' },
  healthCheckIntervalSeconds: { type: 'integer', minimum: 0, maximum: 3600, description: 'health checks only: probe interval in seconds; required and >=5 when healthCheckEnabled is true, omit or 0 otherwise' },
  placement: {
    type: 'object',
    properties: {
      smartPlacement: { type: 'boolean' },
      region: { type: 'string', description: 'provider:region, e.g. aws:us-east-1' },
    },
  },
} as const;

const STRATEGY_ALIASES: Record<string, string> = {
  rr: 'round-robin',
  'round robin': 'round-robin',
  wrr: 'weighted-round-robin',
  'weighted-rr': 'weighted-round-robin',
  ip_hash: 'ip-hash',
  'ip hash': 'ip-hash',
  sticky: 'cookie-sticky',
  'cookie sticky': 'cookie-sticky',
  'weighted sticky': 'weighted-cookie-sticky',
  fo: 'failover',
  geo: 'geo-steering',
};

export const normalizeStrategyAlias = (s: unknown): unknown => {
  if (typeof s !== 'string') return s;
  const lower = s.trim().toLowerCase();
  return STRATEGY_ALIASES[lower] ?? s;
};
