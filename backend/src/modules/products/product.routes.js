import { Router } from 'express';
import { getProducts, getProductById } from './product.controller.js';
import {
  getProductReviews,
  createProductReview,
  updateProductReview,
  deleteProductReview,
  createReviewReply,
} from './review.controller.js';
import { authenticateToken, optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', optionalAuth, createProductReview);
router.put('/:id/reviews/:reviewId', authenticateToken, updateProductReview);
router.delete('/:id/reviews/:reviewId', authenticateToken, deleteProductReview);
router.post('/:id/reviews/:reviewId/replies', authenticateToken, createReviewReply);
router.get('/:id', getProductById);

export default router;

