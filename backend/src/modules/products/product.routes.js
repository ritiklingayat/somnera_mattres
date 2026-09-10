import { Router } from 'express';
import { getProducts, getProductById } from './product.controller.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;
