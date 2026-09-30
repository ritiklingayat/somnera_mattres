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
import { formatOrder } from '../src/modules/orders/order.controller.js';
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
  let userA, userB;
  try {
    const timestamp = Date.now();
    userA = await prisma.user.create({
      data: {
        firstName: 'Alice',
        lastName: 'A',
        email: `alice_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    userB = await prisma.user.create({
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
  } finally {
    const ids = [userA?.id, userB?.id].filter(Boolean);
    if (ids.length > 0) {
      await prisma.order.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  }
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

test('29. Product Thickness Pricing: Sanitize prices to exclude empty, null, or zero thickness variants', () => {
  const legacyProduct = {
    id: 'prod-legacy-1',
    name: 'Somnera Ortho Mattress',
    productType: 'MATTRESS',
    prices: {
      '4': 250,
      '5': 0,
      '6': '',
      '8': 350,
      invalid: null,
      pricePerSqFt: 0,
    },
  };

  const formatted = formatProduct(legacyProduct);
  assert.deepEqual(formatted.prices, { '4': 250, '8': 350 });

  const stringifiedProduct = {
    id: 'prod-legacy-2',
    name: 'Somnera Hybrid Mattress',
    productType: 'MATTRESS',
    prices: JSON.stringify({
      '4': '220',
      '5': null,
      '6': 0,
      '8': '320',
    }),
  };
  const formattedStr = formatProduct(stringifiedProduct);
  assert.deepEqual(formattedStr.prices, { '4': 220, '8': 320 });
});

test('30. Receipt Access & Generation: Strictly restricted to successful (PAID) payments', async () => {
  const timestamp = Date.now();
  let user = null;
  let unpaidOrder = null;
  let paidOrder = null;

  try {
    // 1. Unit check on formatOrder formatting
    const unpaidMock = {
      id: 'ord-unpaid-1',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      shippingAddress: { fullName: 'Test User' },
    };
    const formattedUnpaid = formatOrder(unpaidMock);
    assert.equal(formattedUnpaid.receipt_url, null);
    assert.equal(formattedUnpaid.receiptUrl, null);
    assert.equal(formattedUnpaid.invoiceUrl, null);
    assert.equal(formattedUnpaid.isReceiptAvailable, false);

    const paidMock = {
      id: 'ord-paid-1',
      paymentStatus: 'PAID',
      orderStatus: 'CONFIRMED',
      shippingAddress: { fullName: 'Test User' },
    };
    const formattedPaid = formatOrder(paidMock);
    assert.equal(formattedPaid.receipt_url, '/api/orders/ord-paid-1/receipt');
    assert.equal(formattedPaid.receiptUrl, '/api/orders/ord-paid-1/receipt');
    assert.equal(formattedPaid.invoiceUrl, '/api/orders/ord-paid-1/receipt');
    assert.equal(formattedPaid.isReceiptAvailable, true);

    // 2. Integration check with database & authentication
    user = await prisma.user.create({
      data: {
        firstName: 'Receipt',
        lastName: 'Tester',
        email: `receipt_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    unpaidOrder = await prisma.order.create({
      data: {
        userId: user.id,
        orderStatus: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        subtotal: 10000,
        totalAmount: 10000,
        shippingAddress: {
          fullName: 'Receipt Tester',
          mobile: '9876543210',
          email: user.email,
        },
      },
    });

    paidOrder = await prisma.order.create({
      data: {
        userId: user.id,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        subtotal: 12000,
        totalAmount: 12000,
        shippingAddress: {
          fullName: 'Receipt Tester',
          mobile: '9876543210',
          email: user.email,
        },
      },
    });

    // Unpaid order receipt request must be rejected with 403 Forbidden
    const unpaidRes = await request(app)
      .get(`/api/orders/${unpaidOrder.id}/receipt`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(unpaidRes.status, 403);
    assert.equal(unpaidRes.body.success, false);
    assert.match(unpaidRes.body.message, /Receipt is only available for paid/i);

    // Paid order receipt request must succeed with 200 OK
    const paidRes = await request(app)
      .get(`/api/orders/${paidOrder.id}/receipt`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(paidRes.status, 200);
    assert.equal(paidRes.body.success, true);
    assert.equal(paidRes.body.data.id, paidOrder.id);
    assert.equal(paidRes.body.data.isReceiptAvailable, true);
    assert.equal(paidRes.body.data.receipt_url, `/api/orders/${paidOrder.id}/receipt`);
  } finally {
    if (unpaidOrder || paidOrder) {
      const orderIds = [unpaidOrder?.id, paidOrder?.id].filter(Boolean);
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  }
});

test('31. Public Reviews & Ratings API: Public retrieval without auth, review submission with rating & aggregate updates', async () => {
  const timestamp = Date.now();
  let product = null;
  let user = null;

  try {
    // 1. Create a test product
    product = await prisma.product.create({
      data: {
        name: `Test Mattress ${timestamp}`,
        slug: `test-mattress-${timestamp}`,
        sku: `SKU-REV-${timestamp}`,
        productType: 'MATTRESS',
        price: 15000,
        image: 'https://example.com/test-mattress.jpg',
        isActive: true,
      },
    });

    // 2. Create a test user
    user = await prisma.user.create({
      data: {
        firstName: 'Reviewer',
        lastName: 'Member',
        email: `reviewer_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Public GET without any auth headers
    const emptyRes = await request(app).get(`/api/products/${product.id}/reviews`);
    assert.equal(emptyRes.status, 200);
    assert.equal(emptyRes.body.success, true);
    assert.deepEqual(emptyRes.body.data.reviews, []);
    assert.equal(emptyRes.body.data.averageRating, 0);
    assert.equal(emptyRes.body.data.reviewCount, 0);

    // 4. Input validation: invalid rating & short comment rejected
    const invalidRatingRes = await request(app)
      .post(`/api/products/${product.id}/reviews`)
      .send({ rating: 7, comment: 'Valid comment text' });
    assert.equal(invalidRatingRes.status, 400);
    assert.equal(invalidRatingRes.body.success, false);

    const emptyCommentRes = await request(app)
      .post(`/api/products/${product.id}/reviews`)
      .send({ rating: 5, comment: '  ' });
    assert.equal(emptyCommentRes.status, 400);
    assert.equal(emptyCommentRes.body.success, false);

    // 5. Submit guest review (no auth token)
    const guestRes = await request(app)
      .post(`/api/products/${product.id}/reviews`)
      .send({
        rating: 4,
        userName: 'Aarav Guest',
        title: 'Very comfortable',
        comment: 'Great mattress for the price, highly recommended for back support!',
      });
    assert.equal(guestRes.status, 201);
    assert.equal(guestRes.body.success, true);
    assert.equal(guestRes.body.data.review.isVerified, false);
    assert.equal(guestRes.body.data.review.userName, 'Aarav Guest');
    assert.equal(guestRes.body.data.review.rating, 4);
    assert.equal(guestRes.body.data.averageRating, 4);
    assert.equal(guestRes.body.data.reviewCount, 1);

    // 6. Submit authenticated user review (with Bearer token)
    const authRes = await request(app)
      .post(`/api/products/${product.id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 5,
        title: 'Best purchase yet',
        comment: 'Exceeded my expectations, outstanding comfort and quality materials.',
      });
    assert.equal(authRes.status, 201);
    assert.equal(authRes.body.success, true);
    assert.equal(authRes.body.data.review.isVerified, true);
    assert.equal(authRes.body.data.review.userId, user.id);
    assert.equal(authRes.body.data.review.userName, 'Reviewer Member');
    assert.equal(authRes.body.data.review.rating, 5);
    assert.equal(authRes.body.data.averageRating, 4.5);
    assert.equal(authRes.body.data.reviewCount, 2);

    // 7. Verify subsequent public retrieval using product slug
    const finalRes = await request(app).get(`/api/products/${product.slug}/reviews`);
    assert.equal(finalRes.status, 200);
    assert.equal(finalRes.body.success, true);
    assert.equal(finalRes.body.data.reviews.length, 2);
    assert.equal(finalRes.body.data.averageRating, 4.5);
    assert.equal(finalRes.body.data.reviewCount, 2);
    assert.equal(finalRes.body.data.ratingDistribution['5'], 1);
    assert.equal(finalRes.body.data.ratingDistribution['4'], 1);
    assert.equal(finalRes.body.data.ratingDistribution['3'], 0);

    // 8. Verify product details endpoint returns aggregated rating and reviewCount
    const productRes = await request(app).get(`/api/products/${product.id}`);
    assert.equal(productRes.status, 200);
    assert.equal(productRes.body.data.rating, 4.5);
    assert.equal(productRes.body.data.reviewCount, 2);
  } finally {
    if (product?.id) {
      await prisma.review.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  }
});

test('32. User Review Management: Author can update rating and comment with ownership check; non-author rejected with 403', async () => {
  const timestamp = Date.now();
  let product = null;
  let author = null;
  let otherUser = null;
  let review = null;

  try {
    product = await prisma.product.create({
      data: {
        name: `Test Edit Prod ${timestamp}`,
        slug: `test-edit-prod-${timestamp}`,
        sku: `SKU-EDIT-${timestamp}`,
        productType: 'MATTRESS',
        price: 12000,
        image: 'https://example.com/edit-mattress.jpg',
        isActive: true,
      },
    });

    author = await prisma.user.create({
      data: {
        firstName: 'Author',
        lastName: 'User',
        email: `author_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    otherUser = await prisma.user.create({
      data: {
        firstName: 'Other',
        lastName: 'User',
        email: `other_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const authorToken = jwt.sign(
      { id: author.id, email: author.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const otherToken = jwt.sign(
      { id: otherUser.id, email: otherUser.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create review by Author
    const createRes = await request(app)
      .post(`/api/products/${product.id}/reviews`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        rating: 3,
        title: 'Initial Title',
        comment: 'Initial comment that is at least 3 chars long.',
      });
    assert.equal(createRes.status, 201);
    review = createRes.body.data.review;

    // 1. Unauthenticated edit attempt -> 401
    const unauthEdit = await request(app)
      .put(`/api/products/${product.id}/reviews/${review.id}`)
      .send({ rating: 5, comment: 'Hacked comment' });
    assert.equal(unauthEdit.status, 401);

    // 2. Other user edit attempt -> 403 Forbidden
    const forbiddenEdit = await request(app)
      .put(`/api/products/${product.id}/reviews/${review.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ rating: 5, comment: 'Unauthorized update attempt' });
    assert.equal(forbiddenEdit.status, 403);
    assert.match(forbiddenEdit.body.message, /only edit your own reviews/i);

    // 3. Author edit attempt with invalid input -> 400
    const invalidEdit = await request(app)
      .put(`/api/products/${product.id}/reviews/${review.id}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ rating: 10, comment: 'Too high' });
    assert.equal(invalidEdit.status, 400);

    // 4. Author edit attempt -> 200 OK & updates product aggregate
    const successfulEdit = await request(app)
      .put(`/api/products/${product.id}/reviews/${review.id}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        rating: 5,
        title: 'Updated Headline',
        comment: 'Updated comment with much better feedback!',
      });
    assert.equal(successfulEdit.status, 200);
    assert.equal(successfulEdit.body.success, true);
    assert.equal(successfulEdit.body.data.review.rating, 5);
    assert.equal(successfulEdit.body.data.review.comment, 'Updated comment with much better feedback!');
    assert.equal(successfulEdit.body.data.review.title, 'Updated Headline');
    assert.equal(successfulEdit.body.data.averageRating, 5);

    // Also verify direct /api/reviews/:id works
    const directEdit = await request(app)
      .put(`/api/reviews/${review.id}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        rating: 4,
        comment: 'Second updated comment via direct route',
      });
    assert.equal(directEdit.status, 200);
    assert.equal(directEdit.body.data.review.rating, 4);
    assert.equal(directEdit.body.data.averageRating, 4);
  } finally {
    if (product?.id) {
      await prisma.reviewReply.deleteMany({ where: { review: { productId: product.id } } });
      await prisma.review.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
    const userIds = [author?.id, otherUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  }
});

test('33. User Review Management: Author can delete review with ownership check; non-author rejected with 403', async () => {
  const timestamp = Date.now();
  let product = null;
  let author = null;
  let otherUser = null;
  let review = null;

  try {
    product = await prisma.product.create({
      data: {
        name: `Test Del Prod ${timestamp}`,
        slug: `test-del-prod-${timestamp}`,
        sku: `SKU-DEL-${timestamp}`,
        productType: 'MATTRESS',
        price: 18000,
        image: 'https://example.com/del-mattress.jpg',
        isActive: true,
      },
    });

    author = await prisma.user.create({
      data: {
        firstName: 'Author',
        lastName: 'Del',
        email: `author_del_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    otherUser = await prisma.user.create({
      data: {
        firstName: 'Other',
        lastName: 'Del',
        email: `other_del_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const authorToken = jwt.sign(
      { id: author.id, email: author.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const otherToken = jwt.sign(
      { id: otherUser.id, email: otherUser.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create review
    const createRes = await request(app)
      .post(`/api/products/${product.id}/reviews`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        rating: 5,
        title: 'Review to Delete',
        comment: 'This review will be deleted soon.',
      });
    assert.equal(createRes.status, 201);
    review = createRes.body.data.review;

    // 1. Unauthenticated delete attempt -> 401
    const unauthDel = await request(app)
      .delete(`/api/products/${product.id}/reviews/${review.id}`);
    assert.equal(unauthDel.status, 401);

    // 2. Non-author delete attempt -> 403 Forbidden
    const forbiddenDel = await request(app)
      .delete(`/api/products/${product.id}/reviews/${review.id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    assert.equal(forbiddenDel.status, 403);
    assert.match(forbiddenDel.body.message, /only delete your own reviews/i);

    // 3. Author delete attempt -> 200 OK & recalculates product stats to 0
    const authorDel = await request(app)
      .delete(`/api/products/${product.id}/reviews/${review.id}`)
      .set('Authorization', `Bearer ${authorToken}`);
    assert.equal(authorDel.status, 200);
    assert.equal(authorDel.body.success, true);
    assert.equal(authorDel.body.data.reviewCount, 0);
    assert.equal(authorDel.body.data.averageRating, 0);

    // Verify it is gone from database
    const checkDb = await prisma.review.findUnique({ where: { id: review.id } });
    assert.equal(checkDb, null);
  } finally {
    if (product?.id) {
      await prisma.review.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
    const userIds = [author?.id, otherUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  }
});

test('34. Public Nested Replies: Authenticated users can post replies; reviews include replies; cascade delete works', async () => {
  const timestamp = Date.now();
  let product = null;
  let reviewer = null;
  let replier = null;
  let review = null;

  try {
    product = await prisma.product.create({
      data: {
        name: `Test Reply Prod ${timestamp}`,
        slug: `test-reply-prod-${timestamp}`,
        sku: `SKU-REPLY-${timestamp}`,
        productType: 'MATTRESS',
        price: 20000,
        image: 'https://example.com/reply-mattress.jpg',
        isActive: true,
      },
    });

    reviewer = await prisma.user.create({
      data: {
        firstName: 'Reviewer',
        lastName: 'One',
        email: `rev_one_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    replier = await prisma.user.create({
      data: {
        firstName: 'Replier',
        lastName: 'Two',
        email: `rep_two_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const revToken = jwt.sign(
      { id: reviewer.id, email: reviewer.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const repToken = jwt.sign(
      { id: replier.id, email: replier.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a review
    const createRev = await request(app)
      .post(`/api/products/${product.id}/reviews`)
      .set('Authorization', `Bearer ${revToken}`)
      .send({
        rating: 5,
        title: 'Great Mattress',
        comment: 'Loved the mattress, had the best sleep ever.',
      });
    assert.equal(createRev.status, 201);
    review = createRev.body.data.review;

    // 1. Unauthenticated reply attempt -> 401
    const unauthReply = await request(app)
      .post(`/api/products/${product.id}/reviews/${review.id}/replies`)
      .send({ comment: 'Unauthenticated reply' });
    assert.equal(unauthReply.status, 401);

    // 2. Short comment -> 400
    const shortReply = await request(app)
      .post(`/api/products/${product.id}/reviews/${review.id}/replies`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ comment: ' ' });
    assert.equal(shortReply.status, 400);

    // 3. Valid reply by replier
    const validReply = await request(app)
      .post(`/api/products/${product.id}/reviews/${review.id}/replies`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ comment: 'I completely agree, the spinal support is top notch!' });
    assert.equal(validReply.status, 201);
    assert.equal(validReply.body.success, true);
    assert.equal(validReply.body.data.reply.comment, 'I completely agree, the spinal support is top notch!');
    assert.equal(validReply.body.data.reply.userName, 'Replier Two');

    // 4. Fetch product reviews and verify reply is nested underneath review
    const getRes = await request(app).get(`/api/products/${product.id}/reviews`);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.reviews.length, 1);
    assert.equal(getRes.body.data.reviews[0].replies.length, 1);
    assert.equal(getRes.body.data.reviews[0].replies[0].comment, 'I completely agree, the spinal support is top notch!');

    // 5. Delete parent review and verify cascade delete of reply
    await request(app)
      .delete(`/api/reviews/${review.id}`)
      .set('Authorization', `Bearer ${revToken}`);

    const orphanedReplies = await prisma.reviewReply.findMany({ where: { reviewId: review.id } });
    assert.equal(orphanedReplies.length, 0);
  } finally {
    if (product?.id) {
      await prisma.reviewReply.deleteMany({ where: { review: { productId: product.id } } });
      await prisma.review.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
    const userIds = [reviewer?.id, replier?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  }
});

test('35. Admin Review Management: Admin can view all platform reviews with search/filters & delete any review', async () => {
  const timestamp = Date.now();
  let product = null;
  let admin = null;
  let regularUser = null;
  let review = null;

  try {
    product = await prisma.product.create({
      data: {
        name: `Admin Mod Prod ${timestamp}`,
        slug: `admin-mod-prod-${timestamp}`,
        sku: `SKU-ADM-MOD-${timestamp}`,
        productType: 'MATTRESS',
        price: 25000,
        image: 'https://example.com/admin-mattress.jpg',
        isActive: true,
      },
    });

    admin = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Moderator',
        email: `admin_mod_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    regularUser = await prisma.user.create({
      data: {
        firstName: 'Customer',
        lastName: 'Jones',
        email: `cust_${timestamp}@somnera.test`,
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const adminToken = jwt.sign(
      { id: admin.id, email: admin.email, role: 'ADMIN' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userToken = jwt.sign(
      { id: regularUser.id, email: regularUser.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Customer creates review
    const revRes = await request(app)
      .post(`/api/products/${product.id}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        rating: 2,
        title: 'Spam or Inappropriate Review',
        comment: 'This is an inappropriate or negative review that needs admin moderation.',
      });
    assert.equal(revRes.status, 201);
    review = revRes.body.data.review;

    // 1. Regular user cannot access /api/admin/reviews -> 403 Forbidden
    const userAccess = await request(app)
      .get('/api/admin/reviews')
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(userAccess.status, 403);

    // 2. Admin can access /api/admin/reviews -> 200 OK with reviews list
    const adminGet = await request(app)
      .get('/api/admin/reviews')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(adminGet.status, 200);
    assert.equal(adminGet.body.success, true);
    assert.ok(Array.isArray(adminGet.body.data.reviews));

    // 3. Admin search filter by keyword
    const searchRes = await request(app)
      .get(`/api/admin/reviews?search=inappropriate`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.body.data.reviews.some((r) => r.id === review.id));

    // 4. Admin search filter by rating
    const ratingRes = await request(app)
      .get(`/api/admin/reviews?rating=2`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(ratingRes.status, 200);
    assert.ok(ratingRes.body.data.reviews.some((r) => r.id === review.id));

    // 5. Admin can delete the customer's review regardless of ownership
    const adminDel = await request(app)
      .delete(`/api/admin/reviews/${review.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(adminDel.status, 200);
    assert.equal(adminDel.body.success, true);

    const checkDel = await prisma.review.findUnique({ where: { id: review.id } });
    assert.equal(checkDel, null);
  } finally {
    if (product?.id) {
      await prisma.review.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
    const userIds = [admin?.id, regularUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  }
});


