import { PaymentHistory } from '../../../models/PaymentHistory';
import { isUserPro } from '../services/subscription.service';
import { createOrder, getPaymmentAmount } from '../services/cashfree.service';
import type { AppHandler } from '../../../types/http';

const PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/** POST /api/payments — Create a Cashfree order for Pro subscription */
export const createPaymentOrder: AppHandler = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  // Block if already Pro
  if (await isUserPro(userId)) {
    res.status(400);
    throw new Error('You already have an active Pro subscription');
  }

  let order;
  try {
    const phone = (req.body?.phone as string)?.trim() || '0000000000';
    order = await createOrder(userId, req.user?.email, phone);
  } catch (err: any) {
    // Cashfree SDK errors — surface a clear message instead of passing through
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
    amount: getPaymmentAmount(),
    currency: 'INR',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + PRO_DURATION_MS),
  });

  res.json({
    success: true,
    message: 'Order created',
    data: { orderId: order.orderId, paymentSessionId: order.paymentSessionId },
  });
};
