import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const recomputeProductReviewStats = async (productId) => {
  const aggregations = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { id: true },
  });

  const averageRating =
    aggregations._avg.rating != null
      ? Number(aggregations._avg.rating.toFixed(1))
      : 0;
  const reviewCount = aggregations._count.id || 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: averageRating,
      reviewCount,
    },
  });

  return { averageRating, reviewCount };
};

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
        updatedAt: true,
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            reviewId: true,
            userId: true,
            userName: true,
            userEmail: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
      include: {
        replies: {
          select: {
            id: true,
            reviewId: true,
            userId: true,
            userName: true,
            userEmail: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const stats = await recomputeProductReviewStats(product.id);

    return sendSuccess(
      res,
      {
        review: {
          ...review,
          replies: review.replies || [],
        },
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount,
      },
      'Thank you for your feedback! Review submitted successfully.',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const updateProductReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const targetReviewId = reviewId || id;

    const review = await prisma.review.findUnique({
      where: { id: targetReviewId },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            reviewId: true,
            userId: true,
            userName: true,
            userEmail: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!review) {
      return sendError(res, 'Review not found.', 404);
    }

    if (!req.user) {
      return sendError(res, 'Authentication token required. Please sign in.', 401);
    }

    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'Access denied. You can only edit your own reviews.', 403);
    }

    let updatedRating = review.rating;
    if (req.body.rating !== undefined) {
      const parsedRating = parseInt(req.body.rating, 10);
      if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return sendError(res, 'Rating must be an integer between 1 and 5.', 400);
      }
      updatedRating = parsedRating;
    }

    let updatedComment = review.comment;
    if (req.body.comment !== undefined) {
      const trimmedComment = (req.body.comment || '').trim();
      if (!trimmedComment || trimmedComment.length < 3) {
        return sendError(res, 'Review comment must be at least 3 characters long.', 400);
      }
      updatedComment = trimmedComment;
    }

    const updatedTitle = req.body.title !== undefined ? (req.body.title || '').trim() || null : review.title;

    const updated = await prisma.review.update({
      where: { id: targetReviewId },
      data: {
        rating: updatedRating,
        comment: updatedComment,
        title: updatedTitle,
      },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            reviewId: true,
            userId: true,
            userName: true,
            userEmail: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const stats = await recomputeProductReviewStats(review.productId);

    return sendSuccess(
      res,
      {
        review: updated,
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount,
      },
      'Review updated successfully.'
    );
  } catch (error) {
    next(error);
  }
};

export const deleteProductReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const targetReviewId = reviewId || id;

    const review = await prisma.review.findUnique({
      where: { id: targetReviewId },
    });

    if (!review) {
      return sendError(res, 'Review not found.', 404);
    }

    if (!req.user) {
      return sendError(res, 'Authentication token required. Please sign in.', 401);
    }

    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'Access denied. You can only delete your own reviews.', 403);
    }

    await prisma.review.delete({
      where: { id: targetReviewId },
    });

    const stats = await recomputeProductReviewStats(review.productId);

    return sendSuccess(
      res,
      {
        deletedId: targetReviewId,
        productId: review.productId,
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount,
      },
      'Review deleted successfully.'
    );
  } catch (error) {
    next(error);
  }
};

export const createReviewReply = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const targetReviewId = reviewId || id;

    const review = await prisma.review.findUnique({
      where: { id: targetReviewId },
    });

    if (!review) {
      return sendError(res, 'Review not found.', 404);
    }

    const comment = (req.body.comment || '').trim();
    if (!comment || comment.length < 2) {
      return sendError(res, 'Reply comment must be at least 2 characters long.', 400);
    }

    let userName = (req.body.userName || '').trim();
    if (req.user) {
      const userFullName = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ').trim();
      userName = userName || userFullName || req.user.email || 'Verified Customer';
    } else {
      userName = userName || 'Guest Customer';
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId: targetReviewId,
        userId: req.user ? req.user.id : null,
        userName,
        userEmail: req.user?.email || (req.body.userEmail || '').trim() || null,
        comment,
      },
    });

    return sendSuccess(
      res,
      { reply },
      'Reply posted successfully.',
      201
    );
  } catch (error) {
    next(error);
  }
};
