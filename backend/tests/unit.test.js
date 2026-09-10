import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { razorpayService } from '../src/services/razorpay.service.js';
import { emailService } from '../src/services/email.service.js';
import { formatProduct } from '../src/modules/products/product.controller.js';
import { formatCart } from '../src/modules/cart/cart.controller.js';
import { requireRole } from '../src/middlewares/role.middleware.js';

test('1. Health Check Endpoint', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'ONLINE');
  assert.equal(res.body.data.service, 'Somnera Mattress API');
});

test('2. Security Headers (Helmet) Present', async () => {
  const res = await request(app).get('/api/health');
  assert.ok(res.headers['x-dns-prefetch-control']);
  assert.ok(res.headers['x-frame-options']);
  assert.ok(res.headers['x-content-type-options']);
});

test('3. Auth Validation: Missing fields return 400', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ firstName: 'Somnera' });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('4. Auth Validation: Password mismatch returns 400', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      firstName: 'John',
      email: 'john@example.com',
      password: 'mypassword123',
      confirmPassword: 'notthesamepassword',
      otp: '123456',
    });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /Passwords do not match/);
});

test('5. Auth Validation: Short password returns 400', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      firstName: 'John',
      email: 'john@example.com',
      password: '123',
      confirmPassword: '123',
      otp: '123456',
    });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /at least 6 characters/);
});

test('6. Brevo Email Service: Simulated OTP Dispatch', async () => {
  const result = await emailService.sendOtpEmail('test@example.com', '654321', 'Registration');
  assert.equal(result.success, true);
});

test('7. Brevo Email Service: Simulated Order Confirmation', async () => {
  const mockOrder = {
    id: 'ord_test_99999999',
    totalAmount: 18500,
    paymentStatus: 'PAID',
    items: [
      { productName: 'OG-Ortho', size: '72x60', quantity: 1, itemTotal: 18500 },
    ],
  };
  const result = await emailService.sendOrderConfirmationEmail('buyer@example.com', mockOrder);
  assert.equal(result.success, true);
});

test('8. Razorpay Service: HMAC SHA-256 Signature Verification', () => {
  const testSecret = 'secret_key_somnera_test_123';
  const orderId = 'order_somnera_test_888';
  const paymentId = 'pay_somnera_test_999';

  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const origSecret = razorpayService.keySecret;
  razorpayService.keySecret = testSecret;

  const verified = razorpayService.verifyPaymentSignature({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: validSignature,
  });

  const tampered = razorpayService.verifyPaymentSignature({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: 'tampered_signature_string',
  });

  razorpayService.keySecret = origSecret;

  assert.equal(verified, true, 'HMAC signature should verify successfully');
  assert.equal(tampered, false, 'Tampered HMAC signature must fail');
});

test('9. Razorpay Service: Order Creation in Dev/Simulation Mode', async () => {
  const order = await razorpayService.createOrder({
    amountInPaise: 95000,
    receipt: 'order_seed_1',
  });
  assert.ok(order.id);
  assert.equal(order.amount, 95000);
  assert.equal(order.currency, 'INR');
});

test('10. Product Formatting: Handles Mattress and Accessories', () => {
  const rawProduct = {
    id: 'og-ortho',
    name: 'OG-Ortho',
    productSection: 'MATTRESS',
    productType: 'MATTRESS',
    sku: 'SOM-MAT-OG-ORTHO',
    prices: { 6: 950, 8: 1050 },
    price: 950,
    sellingPrice: 950,
    mrp: 1200,
    stock: 25,
    isActive: true,
    isFeatured: true,
    image: '/product-images/og-ortho.jpeg',
    category: { name: 'Mattresses', categoryName: 'Mattresses' },
    subCategory: { name: 'Somnera Mattresses', subCategoryName: 'Somnera Mattresses' },
  };

  const formatted = formatProduct(rawProduct);
  assert.equal(formatted.id, 'og-ortho');
  assert.equal(formatted.name, 'OG-Ortho');
  assert.equal(formatted.productSection, 'MATTRESS');
  assert.equal(formatted.price, 950);
  assert.equal(formatted.prices['6'], 950);
  assert.equal(formatted.category, 'Mattresses');
  assert.equal(formatted.subcategory, 'Somnera Mattresses');
  assert.equal(formatted.isActive, true);
});

test('11. Cart Formatting: Computes Total Items and Cart Total', () => {
  const rawCart = {
    id: 'cart-user-1',
    userId: 'user-1',
    items: [
      {
        id: 'item-1',
        productId: 'og-ortho',
        product: { name: 'OG-Ortho', image: '/img1.jpg', productType: 'MATTRESS' },
        size: '72x60',
        thickness: '6',
        quantity: 2,
        unitPrice: 950,
        itemTotal: 1900,
      },
      {
        id: 'item-2',
        productId: 'dreamio',
        product: { name: 'Dreamio', image: '/img2.jpg', productType: 'PILLOW' },
        size: '',
        thickness: '',
        quantity: 3,
        unitPrice: 569,
        itemTotal: 1707,
      },
    ],
  };

  const formatted = formatCart(rawCart);
  assert.equal(formatted.cartId, 'cart-user-1');
  assert.equal(formatted.totalItems, 5);
  assert.equal(formatted.cartTotal, 3607);
  assert.equal(formatted.items.length, 2);
  assert.equal(formatted.items[0].productName, 'OG-Ortho');
  assert.equal(formatted.items[1].productName, 'Dreamio');
});

test('12. Role Middleware: Restricts access to unauthorized roles', () => {
  const middleware = requireRole('ADMIN');

  let passed = false;
  const next = () => { passed = true; };

  // Case 1: No user
  const reqNoUser = {};
  const resNoUser = {
    status: (code) => ({
      json: (data) => ({ code, data }),
    }),
  };
  const result1 = middleware(reqNoUser, resNoUser, next);
  assert.equal(passed, false);

  // Case 2: Regular USER role
  const reqUser = { user: { role: 'USER' } };
  const resUser = {
    status: (code) => ({
      json: (data) => ({ code, data }),
    }),
  };
  middleware(reqUser, resUser, next);
  assert.equal(passed, false);

  // Case 3: ADMIN role
  const reqAdmin = { user: { role: 'ADMIN' } };
  const resAdmin = {};
  middleware(reqAdmin, resAdmin, next);
  assert.equal(passed, true);
});

test('13. Protected Endpoints: Reject Missing or Invalid JWT Token', async () => {
  // Missing token
  const res1 = await request(app).get('/api/cart');
  assert.equal(res1.status, 401);
  assert.equal(res1.body.success, false);

  // Invalid token
  const res2 = await request(app)
    .get('/api/cart')
    .set('Authorization', 'Bearer invalid_garbage_token');
  assert.equal(res2.status, 401);
  assert.equal(res2.body.success, false);

  // Expired token
  const expiredToken = jwt.sign(
    { id: 'user-expired', email: 'exp@somnera.com' },
    env.JWT_SECRET,
    { expiresIn: '0s' }
  );
  const res3 = await request(app)
    .get('/api/cart')
    .set('Authorization', `Bearer ${expiredToken}`);
  assert.equal(res3.status, 401);
  assert.match(res3.body.message, /expired/);
});

test('14. Admin Endpoints: Reject Non-Admin Access', async () => {
  const res = await request(app).get('/api/admin/overview');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('15. Admin JWT & RBAC: Token payload contains ADMIN role and validates against requireAdmin', () => {
  const adminPayload = {
    id: 'admin',
    email: 'admin@somnera.com',
    role: 'ADMIN',
  };

  const adminToken = jwt.sign(adminPayload, env.JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(adminToken, env.JWT_SECRET);

  assert.equal(decoded.role, 'ADMIN');
  assert.equal(decoded.email, 'admin@somnera.com');

  // Verify requireAdmin middleware logic
  const req = { user: { id: decoded.id, role: decoded.role } };
  let passed = false;
  requireRole('ADMIN')(req, {}, () => { passed = true; });
  assert.equal(passed, true, 'Admin role should pass requireAdmin middleware');
});

test('16. Admin Seeding Password Hash: Bcrypt securely hashes and verifies admin password', async () => {
  const password = 'admin';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  const isMatch = await bcrypt.compare(password, hash);
  const isWrong = await bcrypt.compare('wrong_password', hash);

  assert.equal(isMatch, true, 'Bcrypt hash should correctly verify the password');
  assert.equal(isWrong, false, 'Bcrypt hash should reject wrong password');
});

test('17. Offers API: GET /api/offers/active returns active promotional offers', async () => {
  const res = await request(app).get('/api/offers/active');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data), 'Offers data should be an array');
});

test('18. Categories API: GET /api/categories returns active categories', async () => {
  const res = await request(app).get('/api/categories');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data), 'Categories data should be an array');
});

test('19. Products API: GET /api/products returns products and supports slug lookup', async () => {
  const resList = await request(app).get('/api/products?limit=10');
  assert.equal(resList.status, 200);
  assert.equal(resList.body.success, true);
  assert.ok(Array.isArray(resList.body.data), 'Products list should contain products array');

  if (resList.body.data.length > 0) {
    const firstProduct = resList.body.data[0];
    const lookupKey = firstProduct.slug || firstProduct.id;
    const resSingle = await request(app).get(`/api/products/${lookupKey}`);
    assert.equal(resSingle.status, 200);
    assert.equal(resSingle.body.success, true);
    assert.equal(resSingle.body.data.id, firstProduct.id);
  }
});


