import { PaymentHistory } from '../../../models/PaymentHistory';
import { User } from '../../../models/User';
import { PLANS, type PlanType } from '../../../config/plans';
import { createOrder } from '../services/cashfree.service';
import type { AppHandler } from '../../../types/http';
import { resolvePlan } from '../../../config/plans';

const VALID_PLANS: PlanType[] = ['trial', 'student', 'pro'];

/** POST /api/payments — Create a Cashfree order for a subscription plan */
export const createPaymentOrder: AppHandler = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const planType = req.body?.planType as string;
  if (!planType || !VALID_PLANS.includes(planType as PlanType)) {
    res.status(400);
    throw new Error('Invalid plan type. Must be: trial, student, or pro');
  }

  const plan = planType as PlanType;
  const config = PLANS[plan];

  // Check if user already has an active plan
  const user = await User.findById(userId).select('plan planExpiresAt hasEverSubscribed').lean();
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const currentPlan = resolvePlan(user.plan, user.planExpiresAt);
  if (currentPlan !== 'free') {
    res.status(400);
    throw new Error('You already have an active subscription');
  }

  // Trial: only for users who never subscribed
  if (plan === 'trial' && user.hasEverSubscribed) {
    res.status(400);
    throw new Error('Trial is only available for first-time subscribers');
  }

  const durationDays = plan === 'trial' ? 7 : config.durationDays;
  const amount = config.price;

  let order;
  try {
    const phone = (req.body?.phone as string)?.trim() || '0000000000';
    // The note shown on the gateway checkout carries the real plan and duration.
    const planLabel = plan === 'trial' ? 'Trial' : config.name;
    const orderNote = `EdgeBalancer ${planLabel} - ${durationDays} days pass`;
    order = await createOrder(userId, req.user?.email, phone, amount, orderNote);
  } catch (err: any) {
    const cfMessage = err?.response?.data?.message || err?.message || 'Unknown error';
    console.error('Cashfree createOrder failed:', cfMessage);
    res.status(502);
    throw new Error(`Payment gateway error: ${cfMessage}`);
  }

  await PaymentHistory.create({
    userId,
    orderId: order.orderId,
    cfOrderId: order.cfOrderId ?? undefined,
    paymentSessionId: order.paymentSessionId ?? undefined,
    amount,
    currency: 'INR',
    status: 'PENDING',
    plan,
    expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
  });

  res.json({
    success: true,
    message: 'Order created',
    data: { orderId: order.orderId, paymentSessionId: order.paymentSessionId, plan, amount },
  });
};
