import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const formatOrder = (order, reqUser = null) => {
  if (!order) return order;
  let shipping = order.shippingAddress;
  if (typeof shipping === 'string') {
    try { shipping = JSON.parse(shipping); } catch (_) { shipping = {}; }
  } else if (!shipping || typeof shipping !== 'object') {
    shipping = {};
  }
  let billing = order.billingAddress;
  if (typeof billing === 'string') {
    try { billing = JSON.parse(billing); } catch (_) { billing = {}; }
  } else if (!billing || typeof billing !== 'object') {
    billing = {};
  }

  const user = order.user || reqUser || {};
  const userFullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const shippingFullName =
    shipping.fullName ||
    [shipping.firstName, shipping.lastName].filter(Boolean).join(' ').trim();

  const fullName =
    shippingFullName ||
    (order.fullName && order.fullName !== 'Customer' ? order.fullName : '') ||
    userFullName ||
    order.name ||
    'Customer';

  const email = shipping.email || order.email || user.email || '';
  const mobile = shipping.mobile || shipping.phone || order.mobile || order.phone || user.mobile || '';
  const gstNumber = shipping.gstNumber || order.gstNumber || billing.gstNumber || null;

  const fullAddress =
    shipping.fullAddress ||
    shipping.address ||
    order.fullAddress ||
    [shipping.address, shipping.apartment, shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(', ') ||
    '';
  const state = shipping.state || order.state || '';
  const city = shipping.city || order.city || '';
  const pincode = shipping.pincode || shipping.postalCode || shipping.pin || order.pincode || '';

  const isPaid = String(order.paymentStatus || '').toUpperCase() === 'PAID';
  const receiptUrl = isPaid ? `/api/orders/${order.id}/receipt` : null;

  return {
    ...order,
    fullName,
    email,
    mobile,
    fullAddress,
    state,
    city,
    pincode,
    gstNumber,
    receipt_url: receiptUrl,
    receiptUrl,
    invoiceUrl: receiptUrl,
    isReceiptAvailable: isPaid,
    shippingAddress: {
      ...shipping,
      fullName: shipping.fullName || fullName,
      email: shipping.email || email,
      mobile: shipping.mobile || mobile,
      fullAddress: shipping.fullAddress || fullAddress,
      state: shipping.state || state,
      city: shipping.city || city,
      pincode: shipping.pincode || pincode,
      gstNumber: shipping.gstNumber || gstNumber,
    },
    billingAddress: billing,
    user: {
      id: user.id || order.userId,
      firstName: user.firstName || (fullName !== 'Customer' ? fullName.split(' ')[0] : ''),
      lastName: user.lastName || (fullName !== 'Customer' ? fullName.split(' ').slice(1).join(' ') : ''),
      email: email || user.email,
      mobile: mobile || user.mobile,
    },
  };
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
        OR: [
          { paymentStatus: 'PAID' },
          { paymentMethod: 'COD' },
        ],
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, orders.map((o) => formatOrder(o, req.user)), 'Orders retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

export const getMyOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: req.user.id,
        OR: [
          { paymentStatus: 'PAID' },
          { paymentMethod: 'COD' },
        ],
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    return sendSuccess(res, formatOrder(order, req.user), 'Order details retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getOrderReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'Access denied.', 403);
    }

    const isPaid = String(order.paymentStatus || '').toUpperCase() === 'PAID';
    if (!isPaid) {
      return sendError(res, 'Receipt is only available for paid and confirmed orders.', 403);
    }

    return sendSuccess(res, formatOrder(order, req.user), 'Order receipt retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

