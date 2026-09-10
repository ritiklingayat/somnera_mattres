import { api } from '../../config/apiClient';

export function mapAdminCategory(category) {
  if (!category) return null;
  const subCategories = (category.subCategories || category.subcategories || []).map((sub, index) => {
    const name = typeof sub === 'string' ? sub : (sub.name || sub.subCategoryName);
    return {
      id: typeof sub === 'object' && sub.id ? sub.id : `${category.id}-sub-${index}`,
      name,
      subCategoryName: name,
    };
  });
  return {
    ...category,
    name: category.name || category.categoryName || '',
    categoryName: category.name || category.categoryName || '',
    imageUrl: category.imageUrl || category.image || null,
    image: category.imageUrl || category.image || null,
    isActive: category.isActive !== false,
    subcategories: subCategories.map((sub) => sub.name).filter(Boolean),
    subCategories,
  };
}

export async function getAdminCategoriesApi() {
  const data = await api.get('/admin/categories');
  return (Array.isArray(data) ? data : (data?.data || [])).map(mapAdminCategory).filter(Boolean);
}

export async function addAdminCategoryApi(category, imageFile = null) {
  const file = imageFile || category.imageFile;
  const formData = new FormData();
  formData.append('name', (category.name || '').trim());
  if (category.description) formData.append('description', category.description.trim());
  if (category.slug) formData.append('slug', category.slug);
  if (category.subcategories) formData.append('subcategories', JSON.stringify(category.subcategories || []));
  if (category.isActive !== undefined) formData.append('isActive', String(category.isActive));
  if (file) {
    formData.append('image', file);
  } else if (category.imageUrl) {
    formData.append('imageUrl', category.imageUrl);
  }
  const data = await api.post('/admin/categories', formData);
  return mapAdminCategory(data);
}

export async function updateAdminCategoryApi(id, category, imageFile = null) {
  const file = imageFile || category.imageFile;
  const formData = new FormData();
  if (category.name) formData.append('name', category.name.trim());
  if (category.description !== undefined) formData.append('description', category.description);
  if (category.slug) formData.append('slug', category.slug);
  if (category.subcategories) formData.append('subcategories', JSON.stringify(category.subcategories));
  if (category.isActive !== undefined) formData.append('isActive', String(category.isActive));
  if (file) {
    formData.append('image', file);
  } else if (category.imageUrl) {
    formData.append('imageUrl', category.imageUrl);
  }
  const data = await api.put(`/admin/categories/${id}`, formData);
  return mapAdminCategory(data);
}

export async function deleteAdminCategoryApi(id) {
  await api.delete(`/admin/categories/${id}`);
  return { success: true };
}
