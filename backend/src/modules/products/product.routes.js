import { Router } from 'express';
import { getProducts, getProductById } from './product.controller.js';
import { getProductReviews, createProductReview } from './review.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', optionalAuth, createProductReview);
router.get('/:id', getProductById);

export default router;
