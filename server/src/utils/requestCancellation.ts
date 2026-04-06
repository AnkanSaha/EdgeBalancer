import { Request, Response } from 'express';
import { isLoadBalancerOperationCancelled } from './loadBalancerOperationStore';

export class RequestCancelledError extends Error {
  constructor(message = 'Request cancelled by client') {
    super(message);
    this.name = 'RequestCancelledError';
  }
}

export const createRequestCancellation = (req: Request, res: Response, operationId?: string | null) => {
  let cancelled = false;

  const markCancelled = () => {
    if (!res.writableEnded) {
      cancelled = true;
    }
  };

  req.on('aborted', markCancelled);
  req.on('close', () => {
    if (!res.writableEnded && req.destroyed) {
      cancelled = true;
    }
  });

  return {
    isCancelled: () => cancelled || isLoadBalancerOperationCancelled(operationId),
    throwIfCancelled: () => {
      if (cancelled || isLoadBalancerOperationCancelled(operationId)) {
        throw new RequestCancelledError(
          isLoadBalancerOperationCancelled(operationId)
            ? 'Operation cancelled and rolled back'
            : 'Request cancelled by client'
        );
      }
    },
  };
};
