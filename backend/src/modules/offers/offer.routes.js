import { Router } from 'express';
import { getActiveOffers, getAllOffers } from './offer.controller.js';

const router = Router();

// Public routes for promotional offers & banners
router.get('/active', getActiveOffers);
router.get('/', getAllOffers);

export default router;
