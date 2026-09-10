import { Router } from 'express';
import { getAvailableCoupons, applyCoupon } from './coupon.controller.js';

const router = Router();

router.get('/available', getAvailableCoupons);
router.post('/apply', applyCoupon);

export default router;
