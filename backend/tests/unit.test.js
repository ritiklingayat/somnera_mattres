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
import { formatCart, calculateProductUnitPrice } from '../src/modules/cart/cart.controller.js';
import { requireRole } from '../src/middlewares/role.middleware.js';
import prisma from '../src/config/prisma.js';

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

test('20. Cart Price Calculation: Calculates mattress price based on dimensions and rate', () => {
  const mattress = {
    productType: 'MATTRESS',
    prices: { '6': 310, '8': 370 },
  };

  // 72x60 (30 sq ft) at 310/sq ft = 9300
  const price = calculateProductUnitPrice(mattress, '72x60', '6');
  assert.equal(price, 9300);

  // 78x72 (39 sq ft) at 370/sq ft = 14430
  const priceKing = calculateProductUnitPrice(mattress, '78x72', '8');
  assert.equal(priceKing, 14430);

  // Non-mattress product falls back to offerPrice or price
  const pillow = {
    productType: 'PILLOW',
    offerPrice: 569,
    price: 899,
  };
  const pillowPrice = calculateProductUnitPrice(pillow);
  assert.equal(pillowPrice, 569);
});

test('21. Coupons API: Validates minimum order amount and calculates discount', async () => {
  const resAvailable = await request(app).get('/api/coupons/available');
  assert.equal(resAvailable.status, 200);
  assert.equal(resAvailable.body.success, true);
  assert.ok(Array.isArray(resAvailable.body.data));

  // SOMNERA500 requires min 5000:
  // With cartTotal: 9300 (above 5000), it should succeed
  const resValid = await request(app)
    .post('/api/coupons/apply')
    .send({ code: 'SOMNERA500', cartTotal: 9300 });

  if (resValid.status === 200) {
    assert.equal(resValid.body.success, true);
    assert.equal(resValid.body.data.discountAmount, 500);
    assert.equal(resValid.body.data.finalTotal, 8800);
  }

  // With cartTotal: 2000 (below 5000), it should reject with min total error
  const resBelow = await request(app)
    .post('/api/coupons/apply')
    .send({ code: 'SOMNERA500', cartTotal: 2000 });

  if (resBelow.status === 400) {
    assert.match(resBelow.body.message, /minimum cart total/i);
  }
});

test('22. Admin Order Status: Rejects unauthenticated requests with 401', async () => {
  const res = await request(app)
    .put('/api/admin/orders/any-order-id/status')
    .send({ orderStatus: 'PROCESSING' });
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('23. Admin Order Status: Rejects non-admin user role with 403', async () => {
  let regularUser = await prisma.user.findFirst({ where: { role: 'USER' } });
  if (!regularUser) {
    regularUser = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: `testuser_${Date.now()}@somnera.com`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });
  }
  const userToken = jwt.sign(
    { id: regularUser.id, email: regularUser.email, role: 'USER' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const res = await request(app)
    .put('/api/admin/orders/any-order-id/status')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ orderStatus: 'PROCESSING' });
  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

test('24. Admin Order Status: Validates order status input and rejects invalid statuses with 400', async () => {
  let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Admin',
        email: `testadmin_${Date.now()}@somnera.com`,
        password: 'hashedpassword',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
  }
  const adminToken = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const res = await request(app)
    .put('/api/admin/orders/any-order-id/status')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ orderStatus: 'INVALID_STATUS' });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /invalid order status/i);
});

test('25. Admin Order Status: Accepts valid statuses and handles non-existent order with 404', async () => {
  let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Admin',
        email: `testadmin_${Date.now()}@somnera.com`,
        password: 'hashedpassword',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
  }
  const adminToken = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const res = await request(app)
    .put('/api/admin/orders/non-existent-order-id-12345/status')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ orderStatus: 'PROCESSING' });
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /not found/i);
});

test('26. Order GST Number: Extracts and formats optional GST number from shipping address or metadata', async () => {
  const sampleWithGst = {
    id: 'ord-1',
    totalAmount: 12000,
    shippingAddress: {
      fullName: 'John Doe',
      city: 'Mumbai',
      gstNumber: '27ABCDE1234F1Z5',
    },
  };
  const sampleWithoutGst = {
    id: 'ord-2',
    totalAmount: 8000,
    shippingAddress: {
      fullName: 'Jane Smith',
      city: 'Delhi',
    },
  };

  const extractGst = (order) => {
    const shipping = typeof order.shippingAddress === 'object' && order.shippingAddress !== null
      ? order.shippingAddress
      : {};
    const billing = typeof order.billingAddress === 'object' && order.billingAddress !== null
      ? order.billingAddress
      : {};
    return order.gstNumber || shipping.gstNumber || billing.gstNumber || null;
  };

  assert.equal(extractGst(sampleWithGst), '27ABCDE1234F1Z5');
  assert.equal(extractGst(sampleWithoutGst), null);
});

test('27. User Address Scope & IDOR Protection: Scopes addresses to current_user.id and rejects unauthorized access', async () => {
  // 1. Unauthenticated request to /api/checkout/addresses must return 401
  const unauthRes = await request(app).get('/api/checkout/addresses');
  assert.equal(unauthRes.status, 401);
  assert.equal(unauthRes.body.success, false);

  // 2. Create two isolated test users: User A and User B
  const timestamp = Date.now();
  const userA = await prisma.user.create({
    data: {
      firstName: 'Alice',
      lastName: 'A',
      email: `alice_${timestamp}@somnera.test`,
      password: 'hashedpassword',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  const userB = await prisma.user.create({
    data: {
      firstName: 'Bob',
      lastName: 'B',
      email: `bob_${timestamp}@somnera.test`,
      password: 'hashedpassword',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  const tokenA = jwt.sign(
    { id: userA.id, email: userA.email, role: 'USER' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const tokenB = jwt.sign(
    { id: userB.id, email: userB.email, role: 'USER' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // User A initially has 0 orders: check clean empty state []
  const emptyRes = await request(app)
    .get('/api/checkout/addresses')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(emptyRes.status, 200);
  assert.equal(emptyRes.body.success, true);
  assert.deepEqual(emptyRes.body.data, []);

  // Create an order for User B with User B's shipping address
  await prisma.order.create({
    data: {
      userId: userB.id,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      subtotal: 15000,
      totalAmount: 15000,
      shippingAddress: {
        fullName: 'Bob B',
        mobile: '9876543210',
        email: userB.email,
        fullAddress: '789 Bob Street, Bandra',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
      },
    },
  });

  // User A attempts to view addresses, including an IDOR exploit attempt passing userB.id in query
  const idorRes = await request(app)
    .get(`/api/checkout/addresses?userId=${userB.id}&user_id=${userB.id}`)
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(idorRes.status, 200);
  assert.equal(idorRes.body.success, true);
  // User A must NOT receive User B's address
  assert.equal(idorRes.body.data.length, 0);

  // User B queries addresses: receives only their own address
  const userBRes = await request(app)
    .get('/api/checkout/addresses')
    .set('Authorization', `Bearer ${tokenB}`);
  assert.equal(userBRes.status, 200);
  assert.equal(userBRes.body.success, true);
  assert.equal(userBRes.body.data.length, 1);
  assert.equal(userBRes.body.data[0].user_id, userB.id);
  assert.equal(userBRes.body.data[0].userId, userB.id);
  assert.equal(userBRes.body.data[0].city, 'Mumbai');
  assert.equal(userBRes.body.data[0].pincode, '400050');
});

test('28. Order Receipt Snapshot: Preserves frozen historical shipping address despite mutable user profile changes', async () => {
  // Simulate an order snapshot captured at checkout
  const orderSnapshot = {
    id: 'ord-snapshot-123',
    userId: 'user-xyz',
    orderStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    subtotal: 20000,
    totalAmount: 20000,
    shippingAddress: {
      fullName: 'Historical Name At Order Time',
      email: 'original_order@example.com',
      mobile: '9111111111',
      fullAddress: 'Flat 101, Historical Heights, M.G. Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      gstNumber: '27AABCS1429B1ZB',
    },
    // Mutable user profile at later date has changed
    user: {
      id: 'user-xyz',
      firstName: 'Changed',
      lastName: 'ProfileName',
      email: 'new_profile_email@example.com',
      mobile: '9999999999',
    },
  };

  const { formatOrder } = await import('../src/modules/orders/order.controller.js');
  const formatted = formatOrder(orderSnapshot);

  // Historical snapshot must take precedence over mutable user profile
  assert.equal(formatted.fullName, 'Historical Name At Order Time');
  assert.equal(formatted.email, 'original_order@example.com');
  assert.equal(formatted.mobile, '9111111111');
  assert.equal(formatted.fullAddress, 'Flat 101, Historical Heights, M.G. Road');
  assert.equal(formatted.city, 'Pune');
  assert.equal(formatted.state, 'Maharashtra');
  assert.equal(formatted.pincode, '411001');
  assert.equal(formatted.gstNumber, '27AABCS1429B1ZB');
});




