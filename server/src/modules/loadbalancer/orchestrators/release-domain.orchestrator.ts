import { LoadBalancer } from '../../../models/LoadBalancer';
import { detachDomainFromWorker } from '../../../services/workerDomain';
import { getCloudflareCredentialsForUser } from '../services/credentials.service';
import { toHostname } from '../services/hostname.service';

export interface ReleaseDomainResult {
  success: boolean;
  message: string;
  data: {
    loadBalancer: any;
  };
}

export async function releaseDomainOrchestrator(params: {
  userId: string;
  loadBalancerId: string;
}): Promise<ReleaseDomainResult> {
  const { userId, loadBalancerId } = params;

  // Find the load balancer
  const loadBalancer = await LoadBalancer.findById(loadBalancerId);
  if (!loadBalancer) {
    const error = new Error('Load balancer not found');
    (error as any).statusCode = 404;
    throw error;
  }

  // Ensure the load balancer belongs to the user
  if (loadBalancer.userId.toString() !== userId) {
    const error = new Error('You do not have permission to modify this load balancer');
    (error as any).statusCode = 403;
    throw error;
  }

  // Ensure it's active
  if (loadBalancer.status !== 'active') {
    const error = new Error(`Load balancer is currently ${loadBalancer.status}, cannot release domain.`);
    (error as any).statusCode = 400;
    throw error;
  }

  const { accountId, apiToken } = await getCloudflareCredentialsForUser(userId);

  // Build the full hostname
  const hostname = toHostname(loadBalancer.domain, loadBalancer.subdomain);

  // Detach Domain from Worker
  await detachDomainFromWorker({
    accountId,
    apiToken,
    hostname,
  });

  // Update from database
  loadBalancer.status = 'paused';
  loadBalancer.pauseMode = 'release-domain';
  await loadBalancer.save();

  return {
    success: true,
    message: 'Custom domain released successfully. Traffic is now stopped.',
    data: {
      loadBalancer,
    },
  };
}
