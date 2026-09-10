import { api } from '../config/apiClient';

const objectUrls = new Set();
const blobByObjectUrl = new Map();
export const toUrl = (value) => {
  if (!(value instanceof Blob)) return value || '';
  const url = URL.createObjectURL(value);
  objectUrls.add(url);
  blobByObjectUrl.set(url, value);
  return url;
};

export function hydrate(product) {
  if (!product) return null;
  const imageUrl = product.imageBlob ? toUrl(product.imageBlob) : (product.imageUrl || product.image || '');
  return {
    ...product,
    image: imageUrl,
    imageUrl,
    galleryImages: [
      ...(Array.isArray(product.galleryImages) ? product.galleryImages.filter((url) => !String(url).startsWith('blob:')) : []),
      ...(Array.isArray(product.galleryBlobs) ? product.galleryBlobs.map(toUrl) : []),
    ],
    galleryVideos: [
      ...(Array.isArray(product.galleryVideos) ? product.galleryVideos.filter((url) => !String(url).startsWith('blob:')) : []),
      ...(Array.isArray(product.galleryVideoBlobs) ? product.galleryVideoBlobs.map(toUrl) : []),
    ],
  };
}

export async function getProducts() {
  const res = await api.get('/products?limit=100&activeOnly=false');
  const items = Array.isArray(res) ? res : (res?.products || []);
  return items.map(hydrate);
}

export async function getProductById(id) {
  const res = await api.get(`/products/${id}`);
  if (res?.id) return hydrate(res);
  return null;
}
