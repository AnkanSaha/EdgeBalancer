/**
 * Validation Service
 *
 * Business logic validation for load balancer operations.
 */

import mongoose from 'mongoose';
import { LoadBalancer } from '../../../models/LoadBalancer';
import { CloudflareClient } from '../../../services/cloudflareClient';

/**
 * Validate and extract load balancer ID from request params
 *
 * @throws Error if ID is invalid
 */
export function getValidatedLoadBalancerId(idParam: string | string[] | undefined): string {
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid load balancer id');
  }

  return id;
}

/**
 * Check if name update is being attempted
 */
export function isNameUpdateAttempt(incomingName: string | undefined, currentName: string): boolean {
  return typeof incomingName === 'string' && incomingName !== currentName;
}

/**
 * Ensure worker script name is available in both database and Cloudflare
 *
 * @throws Error if worker name is already in use
 */
export async function ensureWorkerNameAvailability(params: {
  userId: string;
  accountId: string;
  apiToken: string;
  scriptName: string;
  excludeLoadBalancerId?: string;
}): Promise<void> {
  const { userId, accountId, apiToken, scriptName, excludeLoadBalancerId } = params;

  const existingLoadBalancer = await LoadBalancer.findOne({
    userId,
    scriptName,
    ...(excludeLoadBalancerId ? { _id: { $ne: excludeLoadBalancerId } } : {}),
  });

  if (existingLoadBalancer) {
    const error = new Error('A load balancer with this Worker name already exists. Choose a different name.');
    (error as any).statusCode = 409;
    throw error;
  }

  const cloudflareClient = new CloudflareClient(apiToken);
  const workerNameExists = await cloudflareClient.workerNameExists(accountId, scriptName);
  if (workerNameExists) {
    const error = new Error('A Worker with this name already exists in your Cloudflare account. Choose a different name.');
    (error as any).statusCode = 409;
    throw error;
  }
}
