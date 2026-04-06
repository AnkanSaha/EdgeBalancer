const operations = new Map<string, { cancelled: boolean }>();

export const beginLoadBalancerOperation = (operationId?: string | null) => {
  if (!operationId) return;
  operations.set(operationId, { cancelled: false });
};

export const cancelLoadBalancerOperation = (operationId: string): boolean => {
  const operation = operations.get(operationId);
  if (!operation) {
    return false;
  }

  operation.cancelled = true;
  return true;
};

export const isLoadBalancerOperationCancelled = (operationId?: string | null): boolean => {
  if (!operationId) return false;
  return operations.get(operationId)?.cancelled === true;
};

export const completeLoadBalancerOperation = (operationId?: string | null) => {
  if (!operationId) return;
  operations.delete(operationId);
};
