import { Gateway } from '../../../models/Gateway';
import { deleteWorker } from '../../../services/workerDeletion';
import { detachDomainFromWorker } from '../../../services/workerDomain';
import { getCloudflareCredentialsForUser } from '../services/credentials.service';
import { toHostname } from '../../loadbalancer/services/hostname.service';
import { deactivateSessionsForLoadBalancer } from '../../../services/sessionService';

export async function deleteGatewayOrchestrator(params: { userId: string; gatewayId: string }) {
  const { userId, gatewayId } = params;

  const gateway = await Gateway.findById(gatewayId);
  if (!gateway) {
    const e = new Error('Gateway not found');
    (e as any).statusCode = 404;
    throw e;
  }
  if (gateway.userId.toString() !== userId) {
    const e = new Error('You do not have permission to delete this gateway');
    (e as any).statusCode = 403;
    throw e;
  }

  const { accountId, apiToken } = await getCloudflareCredentialsForUser(userId);
  const hostname = toHostname(gateway.domain, gateway.subdomain);

  try {
    await detachDomainFromWorker({ accountId, apiToken, hostname });
  } catch (e: any) {
    if (!String(e.message || '').includes('not found')) console.error(`Gateway domain detach failed: ${e.message}`);
  }

  try {
    await deleteWorker({ accountId, apiToken, scriptName: gateway.scriptName, hostname });
  } catch (e: any) {
    console.error(`Gateway worker delete failed: ${e.message}`);
  }

  await Gateway.findByIdAndDelete(gatewayId);

  try {
    await deactivateSessionsForLoadBalancer(gatewayId);
  } catch {}

  return { success: true, message: 'Gateway deleted successfully', data: null };
}
