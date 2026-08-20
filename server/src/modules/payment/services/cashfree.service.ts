import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { randomUUID } from 'crypto';

// Lazy-initialized — env vars aren't available at import time (dotenv loads after imports)
let _cashfree: Cashfree | null = null;

export function getCashfreeEnv(): CFEnvironment {
  return process.env.CASHFREE_ENV === 'sandbox' ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION;
}

function getCashfree(): Cashfree {
  if (!_cashfree) {
    const appId = process.env.CASHFREE_APP_ID || '';
    const secretKey = process.env.CASHFREE_SECRET_KEY || '';
    const env = getCashfreeEnv();
    _cashfree = new Cashfree(env, appId, secretKey);
    _cashfree.XApiVersion = '2023-08-01';
  }
  return _cashfree;
}

export interface CreateOrderResult {
  orderId: string;
  cfOrderId: string | null;
  paymentSessionId: string | null;
}

/** Create a Cashfree order for the Pro subscription */
export async function createOrder(userId: string, email: string | null | undefined, phone: string, amount: number): Promise<CreateOrderResult> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const orderId = `ebp_${randomUUID().replace(/-/g, '').slice(0, 20)}`;

  const request = {
    order_amount: amount,
    order_currency: 'INR',
    order_id: orderId,
    customer_details: {
      customer_id: userId,
      customer_email: email || 'user@edgebalancer.com',
      customer_phone: phone,
    },
    order_meta: {
      return_url: `${clientUrl}/pro?order_id={order_id}`,
      notify_url: `${process.env.BACKEND_URL || process.env.CLIENT_URL || 'http://localhost:8000'}/api/payments/webhook`,
    },
    order_note: 'EdgeBalancer Pro - 30 days',
  };

  const response = await getCashfree().PGCreateOrder(request);

  return {
    orderId,
    cfOrderId: response.data.cf_order_id || null,
    paymentSessionId: response.data.payment_session_id || null,
  };
}

/** Verify Cashfree webhook signature using HMAC-SHA256 */
export function verifyWebhookSignature(
  timestamp: string,
  rawBody: string,
  signature: string
): boolean {
  try {
    getCashfree().PGVerifyWebhookSignature(signature, rawBody, timestamp);
    return true;
  } catch {
    return false;
  }
}

/** Fetch order status from Cashfree to verify payment server-side */
export async function fetchOrderPayments(orderId: string) {
  const response = await getCashfree().PGOrderFetchPayments(orderId);
  return response.data;
}
