import prisma from '../../config/prisma.js';
import { razorpayService } from '../../services/razorpay.service.js';
import { emailService } from '../../services/email.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return sendError(res, 'Order ID is required.', 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id,
      },
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    if (order.paymentStatus === 'PAID') {
      return sendError(res, 'This order has already been paid.', 400);
    }

    const amountInPaise = Math.round(order.totalAmount * 100);
    const razorpayOrder = await razorpayService.createOrder({
      amountInPaise,
      receipt: order.id,
      currency: 'INR',
      notes: { orderId: order.id, userId: req.user.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return sendSuccess(res, {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: razorpayOrder.keyId,
      amount: order.totalAmount,
      amountInPaise,
      currency: 'INR',
    }, 'Razorpay order created.');
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayPaymentId) {
      return sendError(res, 'Order ID and Razorpay Payment ID are required.', 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpayOrderId: razorpayOrderId || order.razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'simulated_signature',
    });

    if (!isValid) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED' },
      });
      return sendError(res, 'Payment signature verification failed. Transaction was not verified.', 400);
    }

    // Mark as PAID and CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        razorpayPaymentId,
        razorpayOrderId: razorpayOrderId || order.razorpayOrderId,
        razorpaySignature: razorpaySignature || null,
      },
      include: {
        items: true,
      },
    });

    // Increment coupon used count if applicable
    if (order.couponCode) {
      await prisma.coupon.update({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 } },
      }).catch(() => {});
    }

    // Decrement product inventory
    for (const item of order.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }).catch(() => {});
      }
    }

    // Clear user's cart
    const userCart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (userCart) {
      await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
    }

    // Send confirmation email
    const recipientEmail = (order.shippingAddress && order.shippingAddress.email) || req.user.email;
    if (recipientEmail) {
      emailService.sendOrderConfirmationEmail(recipientEmail, updatedOrder).catch(() => {});
    }

    return sendSuccess(res, updatedOrder, 'Payment verified successfully. Order confirmed.');
  } catch (error) {
    next(error);
  }
};

export const markPaymentFailed = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id,
      },
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'FAILED' },
    });

    return sendSuccess(res, updated, 'Order payment status marked as failed.');
  } catch (error) {
    next(error);
  }
};
