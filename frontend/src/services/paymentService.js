import { getOne, putOne } from '../db/database';
import { clearCartApi } from './cartService';
import { api } from '../config/apiClient';

export async function verifyPaymentApi({ orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature }) {
  try {
    const updated = await api.post('/payments/razorpay/verify', {
      orderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });
    if (updated) {
      await clearCartApi();
      return updated;
    }
  } catch (err) {
    if (err.status && err.status !== 404 && err.status !== 500) throw err;
  }

  // Local fallback
  const order = await getOne('orders', orderId);
  if (!order) throw new Error('Order not found.');
  const updated = {
    ...order,
    razorpayPaymentId,
    razorpayOrderId,
    paymentStatus: 'PAID',
    orderStatus: 'CONFIRMED',
    updatedAt: new Date().toISOString(),
  };
  await putOne('orders', updated);
  await clearCartApi();
  return updated;
}
