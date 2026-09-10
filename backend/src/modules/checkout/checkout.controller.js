import prisma from '../../config/prisma.js';
import { razorpayService } from '../../services/razorpay.service.js';
import { emailService } from '../../services/email.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const initializeCheckout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      shippingAddress = {},
      billingAddress = null,
      paymentMethod = 'ONLINE',
      couponCode = null,
      notes = {},
    } = req.body;

    // 1. Fetch user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || !cart.items.length) {
      return sendError(res, 'Your cart is empty.', 400);
    }

    // 2. Validate Cart Items & Calculate Subtotal
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        return sendError(res, `Product "${product?.name || item.productId}" is no longer available.`, 400);
      }

      if (product.stock < item.quantity) {
        return sendError(res, `Insufficient stock for "${product.name}". Only ${product.stock} left.`, 400);
      }

      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        productImage: product.image || product.imageUrl,
        productType: product.productType || product.productSection,
        size: item.size,
        thickness: item.thickness,
        packSize: item.packSize || 1,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemTotal,
      });
    }

    // 3. Process Coupon & Discount
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode) {
      const normalizedCode = String(couponCode).trim().toUpperCase();
      validCoupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });

      if (
        validCoupon &&
        validCoupon.active &&
        (!validCoupon.expiryDate || new Date(validCoupon.expiryDate) >= new Date()) &&
        (!validCoupon.minOrderAmount || subtotal >= validCoupon.minOrderAmount) &&
        (!validCoupon.usageLimit || validCoupon.usedCount < validCoupon.usageLimit)
      ) {
        if (validCoupon.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * validCoupon.discountValue) / 100;
          if (validCoupon.maxDiscount && discountAmount > validCoupon.maxDiscount) {
            discountAmount = validCoupon.maxDiscount;
          }
        } else {
          discountAmount = validCoupon.discountValue;
        }
        discountAmount = Math.min(subtotal, Math.round(discountAmount * 100) / 100);
      }
    }

    const totalAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    const amountInPaise = Math.round(totalAmount * 100);

    const isCod = String(paymentMethod).toUpperCase() === 'COD';

    // 4. Create Order in Database
    const order = await prisma.order.create({
      data: {
        userId,
        orderStatus: isCod ? 'CONFIRMED' : 'PENDING_PAYMENT',
        paymentStatus: isCod ? 'PENDING' : 'PENDING',
        paymentMethod: isCod ? 'COD' : 'ONLINE',
        subtotal,
        discountAmount,
        totalAmount,
        couponCode: validCoupon?.code || null,
        shippingAddress: shippingAddress || {},
        billingAddress: billingAddress || null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // 5. Payment Gateway Setup (Razorpay)
    if (!isCod) {
      try {
        const razorpayOrder = await razorpayService.createOrder({
          amountInPaise,
          receipt: order.id,
          currency: 'INR',
          notes: {
            orderId: order.id,
            userId,
            ...notes,
          },
        });

        // Update order with razorpayOrderId
        await prisma.order.update({
          where: { id: order.id },
          data: { razorpayOrderId: razorpayOrder.id },
        });

        return sendSuccess(
          res,
          {
            ...order,
            orderId: order.id,
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: razorpayOrder.keyId,
            amount: totalAmount,
            amountInPaise,
            currency: 'INR',
          },
          'Checkout initialized. Ready for payment.',
          201
        );
      } catch (err) {
        return sendError(res, 'Failed to create payment order with gateway.', 502);
      }
    }

    // If COD: Clear cart and send order confirmation email
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Decrement stock
    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      }).catch(() => {});
    }

    // Send confirmation email
    const recipientEmail = shippingAddress?.email || req.user.email;
    if (recipientEmail) {
      emailService.sendOrderConfirmationEmail(recipientEmail, order).catch(() => {});
    }

    return sendSuccess(
      res,
      {
        ...order,
        orderId: order.id,
        amount: totalAmount,
        amountInPaise,
        currency: 'INR',
      },
      'Order placed successfully with Cash on Delivery.',
      201
    );
  } catch (error) {
    next(error);
  }
};
