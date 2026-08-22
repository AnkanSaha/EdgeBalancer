/**
 * Hostname Service
 *
 * Handles hostname generation and validation for load balancers.
 */

import { LoadBalancer } from '../../../models/LoadBalancer';
import { CloudflareClient } from '../../../services/cloudflareClient';

/**
 * Convert domain and subdomain to full hostname
 */
export function toHostname(domain: string, subdomain?: string | null): string {
  return subdomain ? `${subdomain}.${domain}` : domain;
}

/**
 * Does a Cloudflare Worker route pattern cover this hostname?
 *
 * Patterns are `<host>/<path>` where `*` matches zero or more characters, so `*.example.com/*`
 * covers `api.example.com` but not the apex, while `*example.com/*` covers both.
 */
export function routePatternCoversHostname(pattern: string, hostname: string): boolean {
  const host = String(pattern ?? '').split('/')[0].trim().toLowerCase();
  if (!host) return false;

  const asRegex = host
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  return new RegExp(`^${asRegex}$`).test(hostname.trim().toLowerCase());
}

/**
 * Assert that hostname is available for use
 *
 * @throws Error if hostname is already in use by another Worker
 */
export async function assertHostnameAvailable(params: {
  userId: string;
  accountId: string;
  apiToken: string;
  hostname: string;
  /** Enables the Worker Routes check. Omitted by callers that do not know the zone yet. */
  zoneId?: string;
  excludeLoadBalancerId?: string;
}): Promise<void> {
  const { userId, accountId, apiToken, hostname, zoneId, excludeLoadBalancerId } = params;

  let excludedHostname: string | null = null;

  if (excludeLoadBalancerId) {
    let existing: any = await LoadBalancer.findById(excludeLoadBalancerId);
    if (!existing) {
      try {
        const { Gateway } = await import('../../../models/Gateway');
        existing = await Gateway.findById(excludeLoadBalancerId);
      } catch {}
    }
    if (!existing) {
      const error = new Error('Load balancer not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (existing.userId.toString() !== userId) {
      const error = new Error('You do not have permission to access this load balancer');
      (error as any).statusCode = 403;
      throw error;
    }

    excludedHostname = toHostname(existing.domain, existing.subdomain);
  }

  const cloudflareClient = new CloudflareClient(apiToken);
  const domains = await cloudflareClient.getWorkerDomains(accountId);
  const hostnameInUse = domains.some((domain: any) => (
    domain?.hostname === hostname && domain?.hostname !== excludedHostname
  ));

  if (hostnameInUse) {
    const error = new Error(`Hostname '${hostname}' is already assigned to another Worker. Choose a different domain or subdomain.`);
    (error as any).statusCode = 409;
    throw error;
  }

  if (!zoneId) return;

  // A Custom Domain silently takes precedence over any route covering the same hostname, so
  // without this check we would move live traffic off whatever Worker the route points at.
  // EdgeBalancer only ever creates Custom Domains, so every route found here is foreign.
  let routes: any[];
  try {
    routes = await cloudflareClient.getWorkerRoutes(zoneId);
  } catch (error: any) {
    const status = error?.response?.status;

    // Listing routes needs `Zone > Workers Routes > Read`, which older tokens do not carry.
    // This check is an extra safety net, not a prerequisite for deploying — refusing to create
    // because we cannot read routes would break every account issued a token before it existed.
    if (status === 403 || status === 404) {
      console.warn(
        `Worker Routes check skipped for '${hostname}': the Cloudflare token lacks Zone > Workers Routes > Read.`,
      );
      return;
    }

    throw error;
  }

  const conflicting = routes.find((route: any) => (
    route?.script && routePatternCoversHostname(route.pattern, hostname)
  ));

  if (conflicting) {
    const error = new Error(
      `Hostname '${hostname}' is already served by the Worker '${conflicting.script}' through the route '${conflicting.pattern}'. Remove that route or choose a different hostname.`,
    );
    (error as any).statusCode = 409;
    throw error;
  }
}
