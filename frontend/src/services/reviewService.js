import {
  getProductReviews,
  submitProductReview,
  updateProductReview,
  deleteProductReview,
  createReviewReply,
} from '../repositories/reviewRepository';

export const getProductReviewsApi = getProductReviews;
export const submitProductReviewApi = submitProductReview;
export const updateProductReviewApi = updateProductReview;
export const deleteProductReviewApi = deleteProductReview;
export const createReviewReplyApi = createReviewReply;
