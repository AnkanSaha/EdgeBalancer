import mongoose from 'mongoose';
import { RequestCancelledError } from '../../../utils/requestCancellation';

export const getValidatedLoadBalancerId = (idParam: string | string[] | undefined): string => {
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid load balancer id');
  }

  return id;
};

export const toHostname = (domain: string, subdomain?: string | null): string => (
  subdomain ? `${subdomain}.${domain}` : domain
);

export const isCancellationError = (error: unknown): boolean => (
  error instanceof RequestCancelledError
);

export const isNameUpdateAttempt = (incomingName: string | undefined, currentName: string): boolean => (
  typeof incomingName === 'string' && incomingName !== currentName
);
