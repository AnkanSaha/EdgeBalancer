import mongoose from 'mongoose';
import { Gateway } from '../../../models/Gateway';
import { LoadBalancer } from '../../../models/LoadBalancer';
import { CloudflareClient } from '../../../services/cloudflareClient';

export function getValidatedGatewayId(idParam: string | string[] | undefined): string {
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid gateway id');
  }
  return id;
}

export function isNameUpdateAttempt(incomingName: unknown, currentName: string): boolean {
  return typeof incomingName === 'string' && incomingName.trim().toLowerCase() !== currentName.toLowerCase();
}

export async function ensureWorkerNameAvailability(params: {
  userId: string;
  accountId: string;
  apiToken: string;
  scriptName: string;
  excludeGatewayId?: string;
}): Promise<void> {
  const conflictQuery: Record<string, unknown> = {
    userId: params.userId,
    scriptName: params.scriptName,
  };
  if (params.excludeGatewayId) conflictQuery._id = { $ne: params.excludeGatewayId };

  // Gateways and load balancers share one Cloudflare account namespace, so a name taken
  // by either product must block the other — both PUT scripts with upsert semantics.
  const existing = await Gateway.findOne(conflictQuery);
  if (existing) {
    const error = new Error('You already have a gateway using this worker name');
    (error as any).statusCode = 409;
    throw error;
  }

  const lbConflict = await LoadBalancer.findOne({ userId: params.userId, scriptName: params.scriptName });
  if (lbConflict) {
    const error = new Error('A load balancer is already using this worker name');
    (error as any).statusCode = 409;
    throw error;
  }

  const client = new CloudflareClient(params.apiToken);
  const nameExists = await client.workerNameExists(params.accountId, params.scriptName);
  if (nameExists) {
    const error = new Error('Worker name already exists in your Cloudflare account');
    (error as any).statusCode = 409;
    throw error;
  }
}
