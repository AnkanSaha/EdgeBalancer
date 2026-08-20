import { User } from '../../../models/User';
import type { IUser } from '../../../models/User';
import { setPlanCache, removePlanCache, isUserPro as isUserProCached } from '../../../utils/proCache';
import { PLANS, type PlanType } from '../../../config/plans';
import type { AppHandler } from '../../../types/http';

/** Get the resolved active plan for a user */
export async function getUserPlan(userId: string): Promise<{ plan: PlanType; expiresAt: Date | null }> {
  const user = await User.findById(userId).select('plan planExpiresAt').lean();
  if (!user) return { plan: 'free', expiresAt: null };
  const plan = user.plan || 'free';
  if (plan !== 'free' && user.planExpiresAt && user.planExpiresAt <= new Date()) {
    return { plan: 'free', expiresAt: null };
  }
  return { plan: plan as PlanType, expiresAt: user.planExpiresAt ?? null };
}

/** Check if user has Pro plan (backward compat) */
export async function isUserPro(userId: string): Promise<boolean> {
  return isUserProCached(userId);
}

/** Activate a plan for a user */
export async function activatePlan(userId: string, planType: PlanType): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const config = PLANS[planType];
  if (!config || config.durationDays === 0) throw new Error('Invalid plan type');

  const now = new Date();
  user.plan = planType;
  user.hasEverSubscribed = true;

  // If already on same plan and not expired, extend. Otherwise start fresh.
  if (user.plan === planType && user.planExpiresAt && user.planExpiresAt > now) {
    user.planExpiresAt = new Date(user.planExpiresAt.getTime() + config.durationDays * 24 * 60 * 60 * 1000);
  } else {
    user.planExpiresAt = new Date(now.getTime() + config.durationDays * 24 * 60 * 60 * 1000);
  }

  await user.save();

  // Update Redis cache
  await setPlanCache(userId, planType, user.planExpiresAt);

  return user;
}

/** Downgrade user to free (called when plan expires or manually) */
export async function downgradeToFree(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { plan: 'free', planExpiresAt: null });
  await removePlanCache(userId);
}

/** Middleware that blocks non-Pro users */
export const requirePro: AppHandler = async (req, res, next) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (!(await isUserPro(userId))) {
    res.status(403);
    throw new Error('This feature requires an EdgeBalancer Pro subscription');
  }

  next();
};

/** Middleware that blocks non-subscribed users */
export const requireSubscribed: AppHandler = async (req, res, next) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const { plan } = await getUserPlan(userId);
  if (plan === 'free') {
    res.status(403);
    throw new Error('This feature requires an active subscription');
  }

  next();
};
