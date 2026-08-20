import { User } from '../../../models/User';
import type { IUser } from '../../../models/User';
import { setProCache, removeProCache, isUserPro as isUserProCached } from '../../../utils/proCache';
import type { AppHandler } from '../../../types/http';

const PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Check if a user currently has an active Pro subscription (Redis first, DB fallback) */
export async function isUserPro(userId: string): Promise<boolean> {
  return isUserProCached(userId);
}

/** Activate Pro for a user — extends from now if already Pro, or starts fresh */
export async function activatePro(userId: string): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  // If already Pro and not expired, extend from current expiry. Otherwise from now.
  const base = user.proExpiresAt && user.proExpiresAt > now ? user.proExpiresAt : now;
  user.proExpiresAt = new Date(base.getTime() + PRO_DURATION_MS);
  await user.save();

  // Cache in Redis with exact TTL
  await setProCache(userId, user.proExpiresAt);

  return user;
}

/** Middleware that blocks non-Pro users with 403 */
export const requirePro: AppHandler = async (req, res, next) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const pro = await isUserPro(userId);
  if (!pro) {
    res.status(403);
    throw new Error('This feature requires an EdgeBalancer Pro subscription');
  }

  next();
};
