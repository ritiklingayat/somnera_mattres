import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { calculateProductUnitPrice } from '../cart/cart.controller.js';

export const getAvailableCoupons = async (req, res, next) => {
  try {
    const today = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        active: true,
        publicVisible: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: today } },
        ],
      },
      orderBy: { discountValue: 'desc' },
    });

    return sendSuccess(res, coupons, 'Available coupons retrieved.');
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal = 0 } = req.body;

    if (!code) {
      return sendError(res, 'Coupon code is required.', 400);
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon || !coupon.active) {
      return sendError(res, 'Invalid or inactive coupon code.', 404);
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return sendError(res, 'This coupon has expired.', 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return sendError(res, 'This coupon has reached its maximum usage limit.', 400);
    }

    let total = parseFloat(cartTotal) || 0;

    // Fallback: If cartTotal wasn't sent or was 0, calculate from authenticated user's cart
    if (total <= 0 && req.user?.id) {
      const userCart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (userCart && Array.isArray(userCart.items) && userCart.items.length > 0) {
        total = userCart.items.reduce((sum, item) => {
          const unitPrice = item.product
            ? calculateProductUnitPrice(item.product, item.size, item.thickness)
            : Number(item.unitPrice) || 0;
          return sum + (unitPrice * (item.quantity || 1));
        }, 0);
      }
    }

    if (coupon.minOrderAmount && total < coupon.minOrderAmount) {
      return sendError(
        res,
        `This coupon requires a minimum cart total of ₹${coupon.minOrderAmount}.`,
        400
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (total * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(total, Math.round(discountAmount * 100) / 100);
    const finalTotal = Math.max(0, total - discountAmount);

    return sendSuccess(res, {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount,
      finalTotal,
      subtotal: total,
    }, 'Coupon applied successfully.');
  } catch (error) {
    next(error);
  }
};
