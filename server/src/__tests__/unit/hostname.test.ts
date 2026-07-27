jest.mock('../../models/LoadBalancer', () => ({
  LoadBalancer: { findById: jest.fn() },
}));

const getWorkerDomains = jest.fn(async () => [] as any[]);
const getWorkerRoutes = jest.fn(async () => [] as any[]);

jest.mock('../../services/cloudflareClient', () => ({
  CloudflareClient: jest.fn().mockImplementation(() => ({ getWorkerDomains, getWorkerRoutes })),
}));

import {
  assertHostnameAvailable,
  routePatternCoversHostname,
  toHostname,
} from '../../modules/loadbalancer/services/hostname.service';

describe('toHostname', () => {
  it('joins a subdomain to its domain', () => {
    expect(toHostname('example.com', 'api')).toBe('api.example.com');
    expect(toHostname('example.com')).toBe('example.com');
    expect(toHostname('example.com', null)).toBe('example.com');
  });
});

describe('routePatternCoversHostname', () => {
  it('matches an exact host route', () => {
    expect(routePatternCoversHostname('example.com/*', 'example.com')).toBe(true);
    expect(routePatternCoversHostname('example.com/*', 'api.example.com')).toBe(false);
  });

  it('matches a subdomain wildcard but not the apex', () => {
    expect(routePatternCoversHostname('*.example.com/*', 'api.example.com')).toBe(true);
    expect(routePatternCoversHostname('*.example.com/*', 'a.b.example.com')).toBe(true);
    expect(routePatternCoversHostname('*.example.com/*', 'example.com')).toBe(false);
  });

  it('matches a bare wildcard covering the apex too', () => {
    expect(routePatternCoversHostname('*example.com/*', 'example.com')).toBe(true);
    expect(routePatternCoversHostname('*example.com/*', 'api.example.com')).toBe(true);
  });

  it('ignores the path portion of the pattern', () => {
    expect(routePatternCoversHostname('api.example.com/admin/*', 'api.example.com')).toBe(true);
  });

  it('does not treat a dot as a wildcard', () => {
    expect(routePatternCoversHostname('a.example.com/*', 'axexample.com')).toBe(false);
  });

  it('is case- and whitespace-insensitive', () => {
    expect(routePatternCoversHostname(' API.Example.COM/* ', 'api.example.com')).toBe(true);
  });

  it('rejects an empty or malformed pattern', () => {
    expect(routePatternCoversHostname('', 'example.com')).toBe(false);
    expect(routePatternCoversHostname('/*', 'example.com')).toBe(false);
  });
});

describe('assertHostnameAvailable — Worker Routes', () => {
  const params = {
    userId: 'user-1',
    accountId: 'acct-1',
    apiToken: 'token',
    hostname: 'ankan.in',
    zoneId: 'z'.repeat(32),
  };

  beforeEach(() => {
    getWorkerDomains.mockResolvedValue([]);
    getWorkerRoutes.mockResolvedValue([]);
  });

  it('passes when no route covers the hostname', async () => {
    getWorkerRoutes.mockResolvedValue([{ pattern: 'other.com/*', script: 'other-worker' }]);

    await expect(assertHostnameAvailable(params)).resolves.toBeUndefined();
  });

  it('rejects a hostname already served by another Worker via a route', async () => {
    getWorkerRoutes.mockResolvedValue([{ pattern: 'ankan.in/*', script: 'legacy-worker' }]);

    await expect(assertHostnameAvailable(params)).rejects.toThrow(/legacy-worker/);
  });

  it('names the offending route so the user can remove it', async () => {
    getWorkerRoutes.mockResolvedValue([{ pattern: '*.ankan.in/*', script: 'legacy-worker' }]);

    await expect(assertHostnameAvailable({ ...params, hostname: 'api.ankan.in' }))
      .rejects.toThrow(/\*\.ankan\.in\/\*/);
  });

  it('ignores a bypass route with no Worker attached', async () => {
    getWorkerRoutes.mockResolvedValue([{ pattern: 'ankan.in/*', script: null }]);

    await expect(assertHostnameAvailable(params)).resolves.toBeUndefined();
  });

  it('skips the route check entirely when no zone is known', async () => {
    getWorkerRoutes.mockResolvedValue([{ pattern: 'ankan.in/*', script: 'legacy-worker' }]);
    const { zoneId, ...withoutZone } = params;

    await expect(assertHostnameAvailable(withoutZone)).resolves.toBeUndefined();
    expect(getWorkerRoutes).not.toHaveBeenCalled();
  });

  it('still reports a Custom Domain conflict before looking at routes', async () => {
    getWorkerDomains.mockResolvedValue([{ hostname: 'ankan.in' }]);

    await expect(assertHostnameAvailable(params)).rejects.toThrow(/already assigned to another Worker/);
    expect(getWorkerRoutes).not.toHaveBeenCalled();
  });
});
