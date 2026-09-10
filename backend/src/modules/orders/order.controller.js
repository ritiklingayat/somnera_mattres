import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, orders, 'Orders retrieved successfully.');
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
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return sendError(res, 'Order not found.', 404);
    }

    return sendSuccess(res, order, 'Order details retrieved.');
  } catch (error) {
    next(error);
  }
};
