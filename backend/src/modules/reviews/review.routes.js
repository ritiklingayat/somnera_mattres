import { Router } from 'express';
import {
  updateProductReview,
  deleteProductReview,
  createReviewReply,
} from '../products/review.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.put('/:id', authenticateToken, updateProductReview);
router.delete('/:id', authenticateToken, deleteProductReview);
router.post('/:id/replies', authenticateToken, createReviewReply);

export default router;
