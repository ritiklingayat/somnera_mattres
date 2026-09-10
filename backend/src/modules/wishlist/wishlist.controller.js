import prisma from '../../config/prisma.js';
import { formatProduct } from '../products/product.controller.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

const getOrCreateWishlist = async (userId) => {
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: { category: true, subCategory: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true, subCategory: true },
            },
          },
        },
      },
    });
  }

  return wishlist;
};

export const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user.id);
    const items = (wishlist.items || [])
      .map((entry) => formatProduct(entry.product))
      .filter(Boolean);

    return sendSuccess(res, {
      items,
      totalItems: items.length,
    }, 'Wishlist retrieved.');
  } catch (error) {
    next(error);
  }
};

export const toggleWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const wishlist = await getOrCreateWishlist(req.user.id);

    const existing = wishlist.items.find((item) => item.productId === productId);

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return sendError(res, 'Product not found.', 404);
      }
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
    }

    const updated = await getOrCreateWishlist(req.user.id);
    const items = (updated.items || [])
      .map((entry) => formatProduct(entry.product))
      .filter(Boolean);

    return sendSuccess(res, {
      items,
      totalItems: items.length,
      inWishlist: !existing,
    }, existing ? 'Item removed from wishlist.' : 'Item added to wishlist.');
  } catch (error) {
    next(error);
  }
};

export const addWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return sendError(res, 'Product ID is required.', 400);
    }

    const wishlist = await getOrCreateWishlist(req.user.id);
    const existing = wishlist.items.find((item) => item.productId === productId);

    if (!existing) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return sendError(res, 'Product not found.', 404);
      }
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
    }

    const updated = await getOrCreateWishlist(req.user.id);
    const items = (updated.items || [])
      .map((entry) => formatProduct(entry.product))
      .filter(Boolean);

    return sendSuccess(res, { items, totalItems: items.length }, 'Added to wishlist.');
  } catch (error) {
    next(error);
  }
};

export const removeWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const wishlist = await getOrCreateWishlist(req.user.id);

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    const updated = await getOrCreateWishlist(req.user.id);
    const items = (updated.items || [])
      .map((entry) => formatProduct(entry.product))
      .filter(Boolean);

    return sendSuccess(res, { items, totalItems: items.length }, 'Removed from wishlist.');
  } catch (error) {
    next(error);
  }
};

export const checkWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const wishlist = await getOrCreateWishlist(req.user.id);

    const exists = wishlist.items.some((item) => item.productId === productId);
    return sendSuccess(res, { inWishlist: exists }, 'Wishlist status.');
  } catch (error) {
    next(error);
  }
};
