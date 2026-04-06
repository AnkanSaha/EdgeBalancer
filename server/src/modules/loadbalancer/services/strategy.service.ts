/**
 * Strategy Service
 *
 * Handles load balancer strategy normalization and validation.
 * Provides utilities for strategy-related operations.
 */

export type LoadBalancerStrategy =
  | 'round-robin'
  | 'weighted-round-robin'
  | 'ip-hash'
  | 'cookie-sticky'
  | 'weighted-cookie-sticky'
  | 'failover'
  | 'geo-steering';

/**
 * Get human-readable label for a strategy
 */
export function getStrategyLabel(strategy: string): string {
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
}

/**
 * Normalize stored strategy (from database)
 */
export function normalizeStoredStrategy(
  incomingStrategy: string | undefined,
  weightedEnabled: boolean
): LoadBalancerStrategy {
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
}

/**
 * Check if strategy uses weights
 */
export function isWeightedStrategy(strategy: string): boolean {
  return strategy === 'weighted-round-robin' || strategy === 'weighted-cookie-sticky';
}

/**
 * Normalize strategy from user input
 */
export function normalizeStrategy(
  incomingStrategy: string | undefined,
  weightedEnabled: boolean
): LoadBalancerStrategy {
  return normalizeStoredStrategy(incomingStrategy, weightedEnabled);
}
