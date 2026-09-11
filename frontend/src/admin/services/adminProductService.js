import { hydrate } from '../../repositories/productRepository';
import { api } from '../../config/apiClient';

const numberOrNull = (value) => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Number(value);

export function buildProductRequest(draft) {
  const prices = {};
  [4, 5, 6, 8].forEach((size) => {
    const value = numberOrNull(draft[`price${size}`]);
    if (value != null) prices[size] = value;
  });
  const effectivePrice = numberOrNull(draft.offerPrice) ?? numberOrNull(draft.sellingPrice);
  return {
    ...draft,
    name: draft.name.trim(),
    productName: draft.name.trim(),
    productSection: draft.productSection === 'PILLOWS_ACCESSORIES' ? 'PILLOW' : draft.productSection,
    description: draft.description?.trim() || draft.shortDescription?.trim() || '',
    shortDescription: draft.shortDescription?.trim() || draft.description?.trim() || '',
    materials: typeof draft.materials === 'string' ? draft.materials.split(',').map((value) => value.trim()).filter(Boolean) : (draft.materials || []),
    price4Inch: numberOrNull(draft.price4),
    price5Inch: numberOrNull(draft.price5),
    price6Inch: numberOrNull(draft.price6),
    price8Inch: numberOrNull(draft.price8),
    prices,
    mrp: numberOrNull(draft.mrp),
    sellingPrice: numberOrNull(draft.sellingPrice),
    offerPrice: numberOrNull(draft.offerPrice),
    price: effectivePrice,
    stock: numberOrNull(draft.stock),
    stockQuantity: numberOrNull(draft.stock),
    isActive: draft.isActive !== false,
    active: draft.isActive !== false,
    isFeatured: draft.isFeatured === true,
    featured: draft.isFeatured === true,
    showOnHomepage: draft.showOnHomepage === true,
    availableSizes: draft.availableSizes || [],
    packSize: draft.productSection === 'PILLOW' && Number(draft.packSize) === 2 ? 2 : 1,
    needs: draft.needs || [],
    userTypes: draft.userTypes || [],
    tech: draft.tech || [],
    feels: draft.feels || [],
    image: draft.image || '',
    imageUrl: draft.image || '',
    galleryImages: (draft.galleryImages || []).filter(Boolean),
    galleryVideos: (draft.galleryVideos || []).filter(Boolean),
  };
}

function buildFormData(request, imageFile, galleryFiles = [], galleryVideoFiles = []) {
  const fd = new FormData();
  Object.entries(request).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      if (typeof val === 'object' && !(val instanceof Blob) && !(val instanceof File)) {
        fd.append(key, JSON.stringify(val));
      } else {
        fd.append(key, String(val));
      }
    }
  });
  if (imageFile instanceof Blob || imageFile instanceof File) {
    fd.append('image', imageFile);
  }
  (galleryFiles || []).forEach((f) => {
    if (f instanceof Blob || f instanceof File) fd.append('galleryImages', f);
  });
  (galleryVideoFiles || []).forEach((f) => {
    if (f instanceof Blob || f instanceof File) fd.append('galleryVideos', f);
  });
  return fd;
}

export async function getAdminProductsApi() {
  const data = await api.get('/admin/products');
  const items = Array.isArray(data) ? data : (data?.data || []);
  return items.map(hydrate);
}

export async function addAdminProductApi(draft, imageFile, galleryFiles = [], galleryVideoFiles = []) {
  if (!imageFile && !draft.image && !draft.imageUrl) {
    throw new Error('Product image is required.');
  }
  const request = buildProductRequest(draft);
  const formData = buildFormData(request, imageFile, galleryFiles, galleryVideoFiles);
  const data = await api.post('/admin/products', formData);
  return hydrate(data);
}

export async function updateAdminProductApi(id, draft, imageFile = null, galleryFiles = [], galleryVideoFiles = []) {
  const request = buildProductRequest(draft);
  const formData = buildFormData(request, imageFile, galleryFiles, galleryVideoFiles);
  const data = await api.put(`/admin/products/${id}`, formData);
  return hydrate(data);
}

export async function deleteAdminProductApi(id) {
  const res = await api.delete(`/admin/products/${id}`);
  return res || { success: true };
}
