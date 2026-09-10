import { Router } from 'express';
import {
  sendRegistrationOtp,
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
} from './auth.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/send-otp', sendRegistrationOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

export default router;
