import type { LoadBalancerStrategy } from '../types/loadBalancer.types';

export const getStrategyLabel = (strategy: string): string => {
  switch (strategy) {
    case 'weighted-round-robin':
      return 'Weighted Round Robin';
    case 'ip-hash':
      return 'IP Hash';
    case 'cookie-sticky':
    case 'sticky-session':
      return 'Sticky Session';
    case 'weighted-cookie-sticky':
      return 'Weighted Sticky Session';
    case 'failover':
      return 'Failover';
    case 'geo-steering':
      return 'Geo Steering';
    default:
      return 'Round Robin';
  }
};

export const normalizeStoredStrategy = (
  incomingStrategy: string | undefined,
  weightedEnabled: boolean
): LoadBalancerStrategy => {
  if (incomingStrategy === 'sticky-session') {
    return 'cookie-sticky';
  }

  if (incomingStrategy === 'cookie-sticky') {
    return 'cookie-sticky';
  }

  if (incomingStrategy === 'weighted-cookie-sticky') {
    return 'weighted-cookie-sticky';
  }

  if (incomingStrategy === 'ip-hash') {
    return 'ip-hash';
  }

  if (incomingStrategy === 'failover') {
    return 'failover';
  }

  if (incomingStrategy === 'geo-steering') {
    return 'geo-steering';
  }

  if (incomingStrategy === 'weighted-round-robin' || weightedEnabled) {
    return 'weighted-round-robin';
  }

  return 'round-robin';
};

export const isWeightedStrategy = (strategy: string): boolean => (
  strategy === 'weighted-round-robin' || strategy === 'weighted-cookie-sticky'
);

export const normalizeStrategy = (
  incomingStrategy: string | undefined,
  weightedEnabled: boolean
): LoadBalancerStrategy => {
  return normalizeStoredStrategy(incomingStrategy, weightedEnabled);
};
