import { api } from '../config/apiClient';
import {
  addAdminCategoryApi,
  deleteAdminCategoryApi,
  updateAdminCategoryApi,
} from '../admin/services/adminCategoryService';

export async function getCategories() {
  const data = await api.get('/categories');
  return Array.isArray(data) ? data : (data?.data || []);
}

export async function getCategoryById(id) {
  const categories = await getCategories();
  return categories.find((item) => String(item.id) === String(id) || String(item.slug) === String(id)) || null;
}

export async function addCategory(category, imageFile = null) {
  return await addAdminCategoryApi(category, imageFile);
}

export async function updateCategory(id, updates, imageFile = null) {
  return await updateAdminCategoryApi(id, updates, imageFile);
}

export async function deleteCategory(id) {
  return await deleteAdminCategoryApi(id);
}
