import { getOne, putOne } from '../db/database';
import { getCurrentUserApi } from '../components/Account/authService';
import { getProductById } from '../repositories/productRepository';
import { api } from '../config/apiClient';

export function mapWishlistItemFromApi(item) { return item; }

async function currentWishlist() {
  const user = await getCurrentUserApi();
  return (await getOne('wishlists', user.id)) || { id: user.id, productIds: [] };
}

async function response(list) {
  const items = (await Promise.all(list.productIds.map(getProductById))).filter(Boolean);
  return { items, totalItems: items.length };
}

export async function getWishlistApi() {
  try {
    const data = await api.get('/wishlist');
    if (data?.items) return data;
  } catch (err) {
    // Fallback
  }
  return response(await currentWishlist());
}

export async function addWishlistItemApi(productId) {
  try {
    const data = await api.post('/wishlist/items', { productId });
    if (data?.items) return data;
  } catch (err) {
    // Fallback
  }
  const list = await currentWishlist();
  if (!list.productIds.some((id) => String(id) === String(productId))) list.productIds.push(productId);
  await putOne('wishlists', list);
  return response(list);
}

export async function removeWishlistItemApi(productId) {
  try {
    const data = await api.delete(`/wishlist/items/${productId}`);
    if (data?.items) return data;
  } catch (err) {
    // Fallback
  }
  const list = await currentWishlist();
  list.productIds = list.productIds.filter((id) => String(id) !== String(productId));
  await putOne('wishlists', list);
  return response(list);
}

export async function checkWishlistItemApi(productId) {
  try {
    const data = await api.get(`/wishlist/check/${productId}`);
    if (typeof data?.inWishlist === 'boolean') return data.inWishlist;
  } catch (err) {
    // Fallback
  }
  return (await currentWishlist()).productIds.some((id) => String(id) === String(productId));
}
