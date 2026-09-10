import { Router } from 'express';
import {
  getWishlist,
  toggleWishlistItem,
  addWishlistItem,
  removeWishlistItem,
  checkWishlistItem,
} from './wishlist.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getWishlist);
router.post('/toggle/:productId', toggleWishlistItem);
router.post('/items', addWishlistItem);
router.delete('/items/:productId', removeWishlistItem);
router.get('/check/:productId', checkWishlistItem);

export default router;
