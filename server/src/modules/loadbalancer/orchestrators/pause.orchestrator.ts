import { LoadBalancer } from '../../../models/LoadBalancer';
import { detachDomainFromWorker } from '../../../services/workerDomain';
import { deployWorker, pruneWorkerHistory } from '../../../services/workerDeployment';
import { generateWorkerCode } from '../../../services/workerGenerator';
import { getCloudflareCredentialsForUser } from '../services/credentials.service';
import { toHostname } from '../services/hostname.service';

export interface PauseResult {
  success: boolean;
  message: string;
  data: {
    loadBalancer: any;
  };
}

export async function pauseLoadBalancerOrchestrator(params: {
  userId: string;
  loadBalancerId: string;
  mode: 'release-domain' | 'keep-domain';
}): Promise<PauseResult> {
  const { userId, loadBalancerId, mode } = params;

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
    const error = new Error(`Load balancer is currently ${loadBalancer.status}, cannot pause.`);
    (error as any).statusCode = 400;
    throw error;
  }

  const { accountId, apiToken } = await getCloudflareCredentialsForUser(userId);
  const hostname = toHostname(loadBalancer.domain, loadBalancer.subdomain);

  if (mode === 'release-domain') {
    // Mode 1: Detach Domain from Worker (Hard Stop)
    await detachDomainFromWorker({
      accountId,
      apiToken,
      hostname,
    });
  } else {
    // Mode 2: Deploy "Paused" Worker script (Soft Stop / Maintenance Mode)
    const pausedCode = generateWorkerCode({
      origins: [],
      strategy: 'paused',
    });

    await deployWorker({
      accountId,
      apiToken,
      scriptName: loadBalancer.scriptName,
      workerCode: pausedCode,
      placement: loadBalancer.placement,
    });

    // Prune history to keep things clean
    await pruneWorkerHistory({
      accountId,
      apiToken,
      scriptName: loadBalancer.scriptName,
    });
  }

  // Update database
  loadBalancer.status = 'paused';
  loadBalancer.pauseMode = mode;
  await loadBalancer.save();

  return {
    success: true,
    message: mode === 'release-domain' 
      ? 'Custom domain released. Traffic is now stopped.' 
      : 'Maintenance mode activated. Worker is now returning "Paused" message.',
    data: {
      loadBalancer,
    },
  };
}
