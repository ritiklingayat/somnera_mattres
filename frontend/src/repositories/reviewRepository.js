import { api } from '../config/apiClient';

export async function getProductReviews(productId) {
  const res = await api.get(`/products/${productId}/reviews`);
  return res || { reviews: [], averageRating: 0, reviewCount: 0, ratingDistribution: {} };
}

export async function submitProductReview(productId, reviewData) {
  const res = await api.post(`/products/${productId}/reviews`, reviewData);
  return res;
}

export async function updateProductReview(productId, reviewId, reviewData) {
  const res = await api.put(`/products/${productId}/reviews/${reviewId}`, reviewData);
  return res;
}

export async function deleteProductReview(productId, reviewId) {
  const res = await api.delete(`/products/${productId}/reviews/${reviewId}`);
  return res;
}

export async function createReviewReply(productId, reviewId, replyData) {
  const res = await api.post(`/products/${productId}/reviews/${reviewId}/replies`, replyData);
  return res;
}
