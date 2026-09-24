import { Router } from 'express';
import { getUserAddresses, getUserAddressById } from './address.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserAddresses);
router.get('/:id', getUserAddressById);

export default router;
