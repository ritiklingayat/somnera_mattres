import { Router } from 'express';
import { initializeCheckout } from './checkout.controller.js';
import { getUserAddresses } from '../addresses/address.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/addresses', authenticateToken, getUserAddresses);
router.post('/initialize', authenticateToken, initializeCheckout);

export default router;
