import { Router } from 'express';
import { getAvailableCoupons, applyCoupon } from './coupon.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/available', getAvailableCoupons);
router.post('/apply', optionalAuth, applyCoupon);

export default router;
