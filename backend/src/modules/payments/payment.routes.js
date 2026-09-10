import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  markPaymentFailed,
} from './payment.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/razorpay/failure', markPaymentFailed);

export default router;
