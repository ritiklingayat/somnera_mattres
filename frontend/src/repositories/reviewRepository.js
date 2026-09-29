import { api } from '../config/apiClient';

export async function getProductReviews(productId) {
  const res = await api.get(`/products/${productId}/reviews`);
  return res || { reviews: [], averageRating: 0, reviewCount: 0, ratingDistribution: {} };
}

export async function submitProductReview(productId, reviewData) {
  const res = await api.post(`/products/${productId}/reviews`, reviewData);
  return res;
}
