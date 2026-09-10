import { Router } from 'express';
import {
  getAdminOverview,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  getAdminOrders,
  updateAdminOrderStatus,
  getAdminCustomers,
  updateAdminCustomerStatus,
  getAdminShowrooms,
  getAdminDistributorRequests,
  getAdminOffers,
  createAdminOffer,
  updateAdminOffer,
  deleteAdminOffer,
} from './admin.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { productUploadMiddleware, singleImageUploadMiddleware } from '../../middlewares/upload.middleware.js';

const router = Router();

// Guard all admin routes with authentication and ADMIN role check
router.use(authenticateToken);
router.use(requireAdmin);

// Overview
router.get('/overview', getAdminOverview);

// Categories with Cloudinary image upload
router.get('/categories', getAdminCategories);
router.post('/categories', singleImageUploadMiddleware, createAdminCategory);
router.put('/categories/:id', singleImageUploadMiddleware, updateAdminCategory);
router.delete('/categories/:id', deleteAdminCategory);

// Products with direct Cloudinary multi-image upload
router.get('/products', getAdminProducts);
router.post('/products', productUploadMiddleware, createAdminProduct);
router.put('/products/:id', productUploadMiddleware, updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);

// Promotional Offers & Banners with Cloudinary image upload
router.get('/offers', getAdminOffers);
router.post('/offers', singleImageUploadMiddleware, createAdminOffer);
router.put('/offers/:id', singleImageUploadMiddleware, updateAdminOffer);
router.delete('/offers/:id', deleteAdminOffer);

// Coupons
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createAdminCoupon);
router.put('/coupons/:id', updateAdminCoupon);
router.delete('/coupons/:id', deleteAdminCoupon);

// Orders
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateAdminOrderStatus);

// Customers
router.get('/customers', getAdminCustomers);
router.put('/customers/:id/status', updateAdminCustomerStatus);

// Showrooms & Distributors
router.get('/showrooms', getAdminShowrooms);
router.get('/distributor-requests', getAdminDistributorRequests);

export default router;
