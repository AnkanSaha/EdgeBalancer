import { load } from '@cashfreepayments/cashfree-js';

const isSandbox = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'sandbox';

/**
 * Open Cashfree popup checkout (like Razorpay) with a payment session ID.
 * Returns a promise that resolves when the user completes or closes the popup.
 */
export async function openCashfreeCheckout(paymentSessionId: string): Promise<{ status: string }> {
  const cashfree = await load({
    mode: isSandbox ? 'sandbox' : 'production',
  });

  return new Promise((resolve) => {
    cashfree.checkout({
      paymentSessionId,
      redirectTarget: '_blank',
    }).then((result: any) => {
      if (result.error) {
        resolve({ status: 'ERROR' });
      } else if (result.paymentDetails) {
        resolve({ status: result.paymentDetails.paymentStatus || 'UNKNOWN' });
      } else {
        resolve({ status: 'CANCELLED' });
      }
    }).catch(() => {
      resolve({ status: 'ERROR' });
    });
  });
}
