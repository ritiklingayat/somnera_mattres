import { Router } from 'express';
import { getMyOrders, getMyOrderById } from './order.controller.js';
import { getUserAddresses } from '../addresses/address.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/my-orders', getMyOrders);
router.get('/my-orders/:id', getMyOrderById);
router.get('/addresses', getUserAddresses);

export default router;
