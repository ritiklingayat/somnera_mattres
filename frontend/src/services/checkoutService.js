import { createId, getAll, putOne } from '../db/database';
import { getCurrentUserApi, getMyOrdersApi } from '../components/Account/authService';
import { getCartApi } from './cartService';
import { api } from '../config/apiClient';

export async function getPreviousAddressesApi() {
  try {
    const data = await api.get('/checkout/addresses');
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.addresses)) return data.addresses;
  } catch (err) {
    // Fallback to user-scoped orders
  }

  try {
    const user = await getCurrentUserApi();
    const orders = await getMyOrdersApi();
    const unique = [];
    const seen = new Set();
    (Array.isArray(orders) ? orders : []).forEach((order) => {
      // Scope strictly to current user id (IDOR defense-in-depth)
      if (order.userId && String(order.userId) !== String(user.id)) return;
      const addr = order.shippingAddress || {};
      const fullAddress = order.fullAddress || addr.fullAddress || addr.address;
      const city = order.city || addr.city;
      const state = order.state || addr.state;
      const pincode = order.pincode || addr.pincode;
      if (!fullAddress || !city || !pincode) return;
      const key = `${fullAddress}|${city}|${state}|${pincode}`.toLowerCase().trim();
      if (seen.has(key)) return;
      seen.add(key);
      unique.push({
        id: order.id,
        user_id: user.id,
        userId: user.id,
        fullName:
          addr.fullName ||
          order.fullName ||
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          'Customer',
        mobile: addr.mobile || order.mobile || user.mobile || '',
        email: addr.email || order.email || user.email || '',
        fullAddress,
        address: fullAddress,
        city,
        state: state || '',
        pincode,
        gstNumber: addr.gstNumber || order.gstNumber || null,
        createdAt: order.createdAt,
      });
    });
    return unique;
  } catch (_) {
    return [];
  }
}

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
  const numericCartTotal = Number(cartTotal) || 0;
  try {
    const result = await api.post('/coupons/apply', { code: couponCode, cartTotal: numericCartTotal });
    if (result?.coupon) {
      const discountAmount = Number(result.discountAmount) || 0;
      const finalTotal = Number(result.finalTotal ?? (numericCartTotal - discountAmount));
      const subtotal = Number(result.subtotal ?? numericCartTotal);
      return {
        ...result.coupon,
        couponCode: result.coupon.code,
        code: result.coupon.code,
        discountAmount,
        finalTotal,
        finalAmount: finalTotal,
        subtotal,
        message: 'Coupon applied successfully.',
      };
    }
  } catch (err) {
    if (err.status && err.status !== 404 && err.status !== 500) throw err;
  }

  const coupon = (await getAvailableCouponsApi()).find(
    (item) => item.code === String(couponCode || '').trim().toUpperCase()
  );
  if (!coupon) throw new Error('Invalid or expired coupon.');
  if (coupon.minOrderAmount && numericCartTotal < coupon.minOrderAmount) {
    throw new Error(`This coupon requires a minimum cart total of ₹${coupon.minOrderAmount}.`);
  }
  const discountAmount = coupon.discountType === 'PERCENTAGE'
    ? Math.round(((numericCartTotal * Number(coupon.discountValue)) / 100) * 100) / 100
    : Number(coupon.discountValue);
  const finalTotal = Math.max(0, numericCartTotal - discountAmount);
  return {
    ...coupon,
    couponCode: coupon.code,
    code: coupon.code,
    discountAmount,
    finalTotal,
    finalAmount: finalTotal,
    subtotal: numericCartTotal,
    message: 'Coupon applied successfully.',
  };
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
    shippingAddress: data.shippingAddress || {
      fullName: data.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      mobile: data.mobile || user.mobile || '',
      email: data.email || user.email || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      fullAddress: data.fullAddress || '',
      address: data.fullAddress || '',
      gstNumber: data.gstNumber ? String(data.gstNumber).trim().toUpperCase() : null,
    },
    state: data.state || '',
    city: data.city || '',
    pincode: data.pincode || '',
    fullAddress: data.fullAddress || '',
    gstNumber: data.gstNumber ? String(data.gstNumber).trim().toUpperCase() : null,
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
