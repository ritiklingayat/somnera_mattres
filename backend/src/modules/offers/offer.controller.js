import prisma from '../../config/prisma.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Public: Fetch currently active promotional offers and banners
 * Evaluates isActive flag and date ranges (startDate / endDate)
 */
export const getActiveOffers = async (req, res, next) => {
  try {
    const now = new Date();
    const offers = await prisma.offer.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, offers, 'Active promotional offers and banners.');
  } catch (error) {
    next(error);
  }
};

/**
 * Public / Catalog: Fetch all offers
 */
export const getAllOffers = async (req, res, next) => {
  try {
    const offers = await prisma.offer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, offers, 'All promotional offers.');
  } catch (error) {
    next(error);
  }
};
