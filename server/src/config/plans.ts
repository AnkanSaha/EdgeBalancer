export type PlanType = 'free' | 'trial' | 'student' | 'pro';

export interface PlanConfig {
  name: string;
  label: string;
  price: number;
  durationDays: number;
  lbLimit: number;
  allowedStrategies: string[];   // empty = all
  maxHealthCheckLBs: number;     // 0 = none, -1 = unlimited
  hasAnalytics: boolean;
  hasScriptDownload: boolean;
  hasAi: boolean;
  hasRateLimit: boolean;
  canEditPlacement: boolean;
}

const ALL_STRATEGIES: string[] = [];

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Free',
    label: 'Free',
    price: 0,
    durationDays: 0,
    lbLimit: 3,
    allowedStrategies: ['round-robin', 'cookie-sticky', 'ip-hash'],
    maxHealthCheckLBs: 0,
    hasAnalytics: false,
    hasScriptDownload: false,
    hasAi: false,
    hasRateLimit: false,
    canEditPlacement: false,
  },
  trial: {
    name: "Student's Support — Trial",
    label: 'Trial',
    price: 10,
    durationDays: 7,
    lbLimit: 10,
    allowedStrategies: ALL_STRATEGIES,
    maxHealthCheckLBs: 5,
    hasAnalytics: true,
    hasScriptDownload: true,
    hasAi: false,
    hasRateLimit: false,
    canEditPlacement: true,
  },
  student: {
    name: "Student's Support",
    label: 'Student',
    price: 89,
    durationDays: 30,
    lbLimit: 10,
    allowedStrategies: ALL_STRATEGIES,
    maxHealthCheckLBs: 5,
    hasAnalytics: true,
    hasScriptDownload: true,
    hasAi: false,
    hasRateLimit: false,
    canEditPlacement: true,
  },
  pro: {
    name: 'Pro',
    label: 'Pro',
    price: 199,
    durationDays: 30,
    lbLimit: 0,
    allowedStrategies: ALL_STRATEGIES,
    maxHealthCheckLBs: -1,
    hasAnalytics: true,
    hasScriptDownload: true,
    hasAi: true,
    hasRateLimit: true,
    canEditPlacement: true,
  },
};

/** Check if a strategy is allowed for the given plan */
export function isStrategyAllowed(plan: PlanType, strategy: string): boolean {
  const allowed = PLANS[plan].allowedStrategies;
  return allowed.length === 0 || allowed.includes(strategy);
}

/** Get the active plan for a user — checks expiry, reverts to free if expired */
export function resolvePlan(plan: PlanType | undefined | null, planExpiresAt: Date | undefined | null): PlanType {
  if (!plan || plan === 'free') return 'free';
  if (planExpiresAt && planExpiresAt <= new Date()) return 'free';
  return plan;
}
