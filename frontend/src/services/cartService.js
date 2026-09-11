import { getPrice } from '../data/productsData';
import { getOne, putOne } from '../db/database';
import { getCurrentUserApi } from '../components/Account/authService';
import { getProductById } from '../repositories/productRepository';
import { api } from '../config/apiClient';

export function mapCartItemFromApi(item) { return item; }
export function mapCartFromApi(cart) {
  const items = cart?.items || [];
  return {
    cartId: cart?.id || cart?.cartId || null,
    items,
    totalItems: cart?.totalItems ?? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    cartTotal: cart?.cartTotal ?? items.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0),
  };
}

async function currentCart() {
  const user = await getCurrentUserApi();
  return (await getOne('carts', user.id)) || { id: user.id, items: [] };
}

async function save(cart) {
  await putOne('carts', cart);
  return mapCartFromApi(cart);
}

export async function getCartApi() {
  try {
    const data = await api.get('/cart');
    if (data) return mapCartFromApi(data);
  } catch (err) {
    // Fallback to local
  }
  return mapCartFromApi(await currentCart());
}

export async function addToCartApi({ productId, size, thickness, quantity = 1 }) {
  try {
    const data = await api.post('/cart/items', { productId, size, thickness, quantity });
    if (data) return mapCartFromApi(data);
  } catch (err) {
    if (err.status && err.status !== 404 && err.status !== 500) {
      throw err;
    }
  }

  // Local fallback
  const cart = await currentCart();
  const product = await getProductById(productId);
  if (!product) throw new Error('Product not found.');
  const isMattress = product.productType === 'MATTRESS' || product.productSection === 'MATTRESS';
  const normalizedSize = size == null ? '' : String(size);
  const normalizedThickness = thickness == null ? '' : String(thickness);
  const unitPrice = isMattress ? getPrice(product, size, thickness) : Number(product.offerPrice ?? product.sellingPrice ?? product.price ?? 0);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new Error('This product does not have a valid price yet.');
  if (product.stock != null && Number(product.stock) <= 0) throw new Error('This product is out of stock.');
  const existing = cart.items.find((item) => String(item.productId) === String(product.id) && item.size === normalizedSize && item.thickness === normalizedThickness);
  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + Number(quantity));
    existing.itemTotal = existing.unitPrice * existing.quantity;
  } else {
    cart.items.push({
      cartItemId: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: product.id, name: product.name, productName: product.name, image: product.image, imageUrl: product.image,
      productType: product.productType || product.productSection,
      packSize: product.productType === 'PILLOW' || product.productSection === 'PILLOW'
        ? (Number(product.packSize) === 2 ? 2 : 1)
        : 1,
      categoryId: product.categoryId, category: product.category, categoryName: product.category, subCategoryId: product.subCategoryId,
      subcategory: product.subcategory, subCategoryName: product.subcategory, size: normalizedSize, thickness: normalizedThickness,
      unitPrice, price: unitPrice, quantity: Number(quantity), itemTotal: unitPrice * Number(quantity),
    });
  }
  return save(cart);
}

export async function updateCartItemApi(itemId, quantity) {
  try {
    const data = await api.put(`/cart/items/${itemId}`, { quantity });
    if (data) return mapCartFromApi(data);
  } catch (err) {
    if (err.status && err.status !== 404 && err.status !== 500) throw err;
  }

  const cart = await currentCart();
  const item = cart.items.find((entry) => String(entry.cartItemId) === String(itemId) || String(entry.id) === String(itemId));
  if (!item) throw new Error('Cart item not found.');
  item.quantity = Number(quantity);
  item.itemTotal = item.unitPrice * item.quantity;
  return save(cart);
}

export async function removeCartItemApi(itemId) {
  try {
    const data = await api.delete(`/cart/items/${itemId}`);
    if (data) return mapCartFromApi(data);
  } catch (err) {
    // Fallback
  }
  const cart = await currentCart();
  cart.items = cart.items.filter((item) => String(item.cartItemId) !== String(itemId) && String(item.id) !== String(itemId));
  return save(cart);
}

export async function clearCartApi() {
  try {
    await api.delete('/cart');
  } catch (err) {
    // Fallback
  }
  const cart = await currentCart();
  cart.items = [];
  return save(cart);
}
