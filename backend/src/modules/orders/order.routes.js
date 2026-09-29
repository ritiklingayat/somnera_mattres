import { Router } from 'express';
import { getMyOrders, getMyOrderById, getOrderReceipt } from './order.controller.js';
import { getUserAddresses } from '../addresses/address.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/my-orders', getMyOrders);
router.get('/my-orders/:id', getMyOrderById);
router.get('/my-orders/:id/receipt', getOrderReceipt);
router.get('/:id/receipt', getOrderReceipt);
router.get('/addresses', getUserAddresses);

export default router;
