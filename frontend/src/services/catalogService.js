import { getCategories, getCategoryById } from '../repositories/categoryRepository';
import { getProducts, getProductById } from '../repositories/productRepository';

export const getCategoriesApi = getCategories;
export const getCategoryByIdApi = getCategoryById;
export const getProductsApi = getProducts;
export const getProductByIdApi = getProductById;
