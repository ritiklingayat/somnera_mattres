import { Router } from 'express';
import { getMyOrders, getMyOrderById } from './order.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/my-orders', getMyOrders);
router.get('/my-orders/:id', getMyOrderById);

export default router;
