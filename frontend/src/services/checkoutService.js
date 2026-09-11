import { createId, getAll, putOne } from '../db/database';
import { getCurrentUserApi } from '../components/Account/authService';
import { getCartApi } from './cartService';
import { api } from '../config/apiClient';

export async function getAvailableCouponsApi() {
  try {
    const coupons = await api.get('/coupons/available');
    if (Array.isArray(coupons)) return coupons;
  } catch (err) {
    // Fallback to local
  }
  const today = new Date().toISOString().slice(0, 10);
  return (await getAll('coupons')).filter(
    (coupon) => coupon.active !== false && coupon.publicVisible !== false && (!coupon.expiryDate || coupon.expiryDate >= today)
  );
}

export async function applyCouponApi(couponCode, cartTotal = 0) {
  try {
    const result = await api.post('/coupons/apply', { code: couponCode, cartTotal });
    if (result?.coupon) {
      return {
        ...result.coupon,
        discountAmount: result.discountAmount,
        finalTotal: result.finalTotal,
      };
    }
  } catch (err) {
    if (err.status && err.status !== 404 && err.status !== 500) throw err;
  }

  const coupon = (await getAvailableCouponsApi()).find(
    (item) => item.code === String(couponCode || '').trim().toUpperCase()
  );
  if (!coupon) throw new Error('Invalid or expired coupon.');
  return coupon;
}

export async function initializeCheckoutApi(data) {
  try {
    const order = await api.post('/checkout/initialize', data);
    if (order?.orderId || order?.id) {
      return {
        ...order,
        orderId: order.orderId || order.id,
        razorpayOrderId: order.razorpayOrderId,
        razorpayKeyId: order.razorpayKeyId,
        amount: order.amount || order.totalAmount,
        amountInPaise: order.amountInPaise || Math.round((order.amount || order.totalAmount) * 100),
        currency: order.currency || 'INR',
      };
    }
  } catch (err) {
    if (err.status && err.status !== 404 && err.status !== 500) throw err;
  }

  // Local fallback
  const user = await getCurrentUserApi();
  const cart = await getCartApi();
  if (!cart.items.length) throw new Error('Your cart is empty.');
  let coupon = null;
  if (data.couponCode) coupon = await applyCouponApi(data.couponCode, cart.cartTotal);
  const discount = coupon
    ? coupon.discountType === 'PERCENTAGE'
      ? (cart.cartTotal * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue)
    : 0;
  const totalAmount = Math.max(0, cart.cartTotal - discount);
  const id = createId('order');
  const order = {
    id,
    userId: user.id,
    ...data,
    couponCode: coupon?.code || null,
    subtotal: cart.cartTotal,
    discountAmount: discount,
    totalAmount,
    items: cart.items,
    orderStatus: data.paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING_PAYMENT',
    paymentStatus: data.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
    createdAt: new Date().toISOString(),
  };
  await putOne('orders', order);
  return {
    ...order,
    orderId: id,
    razorpayOrderId: `local-${id}`,
    razorpayKeyId: 'rzp_test_somnera_key',
    amount: totalAmount,
    amountInPaise: Math.round(totalAmount * 100),
    currency: 'INR',
  };
}
