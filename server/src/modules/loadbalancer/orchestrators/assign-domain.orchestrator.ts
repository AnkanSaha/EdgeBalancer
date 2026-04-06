import { LoadBalancer } from '../../../models/LoadBalancer';
import { attachDomainToWorker } from '../../../services/workerDomain';
import { getCloudflareCredentialsForUser } from '../services/credentials.service';
import { toHostname } from '../services/hostname.service';

export interface AssignDomainResult {
  success: boolean;
  message: string;
  data: {
    loadBalancer: any;
  };
}

export async function assignDomainOrchestrator(params: {
  userId: string;
  loadBalancerId: string;
}): Promise<AssignDomainResult> {
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

  // Ensure it's paused and was paused due to release-domain
  if (loadBalancer.status !== 'paused' || loadBalancer.pauseMode !== 'release-domain') {
    const error = new Error('Load balancer is not in a releasable state, cannot assign domain.');
    (error as any).statusCode = 400;
    throw error;
  }

  const { accountId, apiToken } = await getCloudflareCredentialsForUser(userId);

  // Build the full hostname
  const hostname = toHostname(loadBalancer.domain, loadBalancer.subdomain);

  // Attach Domain to Worker
  await attachDomainToWorker({
    accountId,
    apiToken,
    hostname,
    zoneId: loadBalancer.zoneId,
    scriptName: loadBalancer.scriptName,
  });

  // Update from database
  loadBalancer.status = 'active';
  loadBalancer.pauseMode = undefined;
  await loadBalancer.save();

  return {
    success: true,
    message: 'Custom domain assigned successfully. Traffic is now flowing.',
    data: {
      loadBalancer,
    },
  };
}
