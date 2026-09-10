import { Router } from 'express';
import { initializeCheckout } from './checkout.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/initialize', authenticateToken, initializeCheckout);

export default router;
