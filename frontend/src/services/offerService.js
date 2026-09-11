import { api } from '../config/apiClient';

/**
 * Public: Fetch currently active promotional offers and banners
 */
export async function getActiveOffersApi() {
  try {
    const res = await api.get('/offers/active');
    return Array.isArray(res) ? res : (res?.data || []);
  } catch (err) {
    console.error('Failed to load active offers:', err);
    return [];
  }
}

/**
 * Public: Fetch all promotional offers
 */
export async function getAllOffersApi() {
  try {
    const res = await api.get('/offers');
    return Array.isArray(res) ? res : (res?.data || []);
  } catch (err) {
    console.error('Failed to load all offers:', err);
    return [];
  }
}

/**
 * Admin: Fetch all offers & banners
 */
export async function getAdminOffersApi() {
  const res = await api.get('/admin/offers');
  return Array.isArray(res) ? res : (res?.data || []);
}

/**
 * Admin: Create promotional offer with banner upload
 */
export async function createAdminOfferApi(formData) {
  return await api.post('/admin/offers', formData);
}

/**
 * Admin: Update promotional offer
 */
export async function updateAdminOfferApi(id, formData) {
  return await api.put(`/admin/offers/${id}`, formData);
}

/**
 * Admin: Delete promotional offer
 */
export async function deleteAdminOfferApi(id) {
  return await api.delete(`/admin/offers/${id}`);
}
