import { Router } from 'express';
import { createDistributorRequest } from './distributor.controller.js';

const router = Router();

router.post('/', createDistributorRequest);

export default router;
