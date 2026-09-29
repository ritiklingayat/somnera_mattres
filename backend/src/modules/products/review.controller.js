import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { sku: id }],
      },
      select: {
        id: true,
        name: true,
        rating: true,
        reviewCount: true,
      },
    });

    if (!product) {
      return sendError(res, 'Product not found.', 404);
    }

    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productId: true,
        userId: true,
        userName: true,
        rating: true,
        title: true,
        comment: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const total = reviews.length;
    const averageRating =
      total > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1))
        : 0;

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      if (ratingDistribution[star] !== undefined) {
        ratingDistribution[star]++;
      }
    });

    return sendSuccess(
      res,
      {
        reviews,
        averageRating,
        reviewCount: total,
        ratingDistribution,
      },
      'Product reviews retrieved successfully.'
    );
  } catch (error) {
    next(error);
  }
};

export const createProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { sku: id }],
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!product) {
      return sendError(res, 'Product not found.', 404);
    }

    const rawRating = req.body.rating;
    const parsedRating = parseInt(rawRating, 10);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return sendError(res, 'Rating must be an integer between 1 and 5.', 400);
    }

    const comment = (req.body.comment || '').trim();
    if (!comment || comment.length < 3) {
      return sendError(res, 'Review comment must be at least 3 characters long.', 400);
    }

    const title = (req.body.title || '').trim() || null;

    let userName = (req.body.userName || '').trim();
    if (req.user) {
      const userFullName = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ').trim();
      userName = userName || userFullName || req.user.email || 'Verified Customer';
    } else {
      userName = userName || 'Guest Customer';
    }

    const isVerified = Boolean(req.user);

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId: req.user ? req.user.id : null,
        userName,
        userEmail: req.user?.email || (req.body.userEmail || '').trim() || null,
        rating: parsedRating,
        title,
        comment,
        isVerified,
      },
    });

    // Compute updated aggregates for this product
    const aggregations = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating =
      aggregations._avg.rating != null
        ? Number(aggregations._avg.rating.toFixed(1))
        : parsedRating;
    const reviewCount = aggregations._count.id || 1;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: averageRating,
        reviewCount,
      },
    });

    return sendSuccess(
      res,
      {
        review,
        averageRating,
        reviewCount,
      },
      'Thank you for your feedback! Review submitted successfully.',
      201
    );
  } catch (error) {
    next(error);
  }
};
