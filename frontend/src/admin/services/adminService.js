import { createId, deleteOne, getAll, getOne, putOne } from '../../db/database';
import { api } from '../../config/apiClient';

export async function getAdminCustomersApi() {
  try {
    const data = await api.get('/admin/customers');
    if (Array.isArray(data)) return data;
  } catch (err) {
    // Fallback
  }
  return (await getAll('users')).filter((user) => user.role !== 'ADMIN').map(({ password: _password, ...user }) => user);
}

export async function getAdminOrdersApi() {
  try {
    const data = await api.get('/admin/orders');
    if (Array.isArray(data)) return data;
  } catch (err) {
    // Fallback
  }
  return (await getAll('orders')).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function updateAdminOrderStatusApi(orderId, orderStatus) {
  try {
    const data = await api.put(`/admin/orders/${orderId}/status`, { orderStatus });
    if (data) {
      try {
        const local = await getOne('orders', orderId);
        if (local) {
          await putOne('orders', { ...local, orderStatus, updatedAt: new Date().toISOString() });
        }
      } catch (_) {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('somnera:order-updated', { detail: { orderId, orderStatus } }));
      }
      return data;
    }
  } catch (err) {
    if (err.status) throw err;
  }

  // Local fallback
  const current = await getOne('orders', orderId);
  if (!current) throw new Error('Order not found.');
  const updated = {
    ...current,
    orderStatus,
    updatedAt: new Date().toISOString(),
  };
  await putOne('orders', updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('somnera:order-updated', { detail: { orderId, orderStatus } }));
  }
  return updated;
}

export async function getAdminDistributorRequestsApi() {
  const data = await api.get('/admin/distributor-requests');
  return Array.isArray(data) ? data : (data?.data || []);
}

export async function updateAdminCustomerStatusApi(userId, status) {
  try {
    const data = await api.put(`/admin/customers/${userId}/status`, { status });
    if (data) return data;
  } catch (err) {
    // Fallback
  }
  const user = await getOne('users', userId);
  if (!user) throw new Error('Customer not found.');
  const updated = { ...user, status, updatedAt: new Date().toISOString() };
  await putOne('users', updated);
  const { password: _password, ...safe } = updated;
  return safe;
}

export async function getAdminCouponsApi() {
  try {
    const data = await api.get('/admin/coupons');
    if (Array.isArray(data)) return data;
  } catch (err) {
    // Fallback
  }
  return getAll('coupons');
}

export async function createAdminCouponApi(couponData) {
  try {
    const data = await api.post('/admin/coupons', couponData);
    if (data) return data;
  } catch (err) {
    if (err.status && err.status !== 404 && err.status !== 500) throw err;
  }
  const code = couponData.code.trim().toUpperCase();
  if ((await getAll('coupons')).some((item) => item.code === code)) throw new Error('Coupon code already exists.');
  const coupon = {
    ...couponData,
    id: createId('coupon'),
    code,
    discountValue: Number(couponData.discountValue),
    createdAt: new Date().toISOString(),
  };
  await putOne('coupons', coupon);
  return coupon;
}

export async function updateAdminCouponApi(couponId, couponData) {
  try {
    const data = await api.put(`/admin/coupons/${couponId}`, couponData);
    if (data) return data;
  } catch (err) {
    if (err.status && err.status !== 404 && err.status !== 500) throw err;
  }
  const current = await getOne('coupons', couponId);
  if (!current) throw new Error('Coupon not found.');
  const updated = {
    ...current,
    ...couponData,
    id: current.id,
    code: couponData.code.trim().toUpperCase(),
    discountValue: Number(couponData.discountValue),
    updatedAt: new Date().toISOString(),
  };
  await putOne('coupons', updated);
  return updated;
}

export async function deleteAdminCouponApi(couponId) {
  try {
    await api.delete(`/admin/coupons/${couponId}`);
    return { success: true };
  } catch (err) {
    // Fallback
  }
  await deleteOne('coupons', couponId);
  return { success: true };
}

export async function getAdminReviewsApi(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.set('search', params.search);
  if (params.productId) queryParams.set('productId', params.productId);
  if (params.rating) queryParams.set('rating', params.rating);

  const qs = queryParams.toString();
  const endpoint = `/admin/reviews${qs ? `?${qs}` : ''}`;
  const data = await api.get(endpoint);
  return data || { reviews: [], total: 0, averageRating: 0 };
}

export async function deleteAdminReviewApi(reviewId) {
  const data = await api.delete(`/admin/reviews/${reviewId}`);
  return data || { success: true };
}

