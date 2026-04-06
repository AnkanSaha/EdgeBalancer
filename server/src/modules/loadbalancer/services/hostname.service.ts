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
 * Assert that hostname is available for use
 *
 * @throws Error if hostname is already in use by another Worker
 */
export async function assertHostnameAvailable(params: {
  userId: string;
  accountId: string;
  apiToken: string;
  hostname: string;
  excludeLoadBalancerId?: string;
}): Promise<void> {
  const { userId, accountId, apiToken, hostname, excludeLoadBalancerId } = params;

  let excludedHostname: string | null = null;

  if (excludeLoadBalancerId) {
    const existingLoadBalancer = await LoadBalancer.findById(excludeLoadBalancerId);
    if (!existingLoadBalancer) {
      const error = new Error('Load balancer not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (existingLoadBalancer.userId.toString() !== userId) {
      const error = new Error('You do not have permission to access this load balancer');
      (error as any).statusCode = 403;
      throw error;
    }

    excludedHostname = toHostname(existingLoadBalancer.domain, existingLoadBalancer.subdomain);
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
}
