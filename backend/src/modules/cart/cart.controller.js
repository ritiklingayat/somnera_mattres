import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

/**
 * Format cart and its items to match frontend expectations
 */
export const formatCart = (cart) => {
  if (!cart) {
    return { cartId: null, items: [], totalItems: 0, cartTotal: 0 };
  }

  const items = (cart.items || []).map((item) => {
    const p = item.product || {};
    return {
      id: item.id,
      cartItemId: item.id,
      productId: item.productId,
      name: p.name || item.productName || 'Product',
      productName: p.name || item.productName || 'Product',
      image: p.image || p.imageUrl || '',
      imageUrl: p.imageUrl || p.image || '',
      productType: p.productType || p.productSection || 'MATTRESS',
      packSize: item.packSize || p.packSize || 1,
      categoryId: p.categoryId,
      category: p.category?.name || p.categoryName || '',
      categoryName: p.category?.categoryName || p.category?.name || '',
      subCategoryId: p.subCategoryId,
      subcategory: p.subCategory?.name || '',
      subCategoryName: p.subCategory?.subCategoryName || '',
      size: item.size || '',
      thickness: item.thickness || '',
      unitPrice: item.unitPrice,
      price: item.unitPrice,
      quantity: item.quantity,
      itemTotal: item.itemTotal,
      createdAt: item.createdAt,
    };
  });

  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const cartTotal = items.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0);

  return {
    id: cart.id,
    cartId: cart.id,
    userId: cart.userId,
    items,
    totalItems,
    cartTotal,
  };
};

/**
 * Calculate correct unit price for a product based on type and dimensions
 */
export const calculateProductUnitPrice = (product, size = '72x60', thickness = '6') => {
  if (!product) return 0;

  const isMattress = product.productType === 'MATTRESS' || product.productSection === 'MATTRESS';

  if (isMattress && thickness && product.prices) {
    const pricesMap = typeof product.prices === 'object' && product.prices ? product.prices : {};
    const rate = Number(pricesMap[String(thickness)] ?? pricesMap[thickness] ?? 0);

    if (rate > 0) {
      const sizeStr = String(size || '72x60').toLowerCase();
      const [lengthStr, widthStr] = sizeStr.split('x');
      const length = Number(lengthStr) || 72;
      const width = Number(widthStr) || 60;
      const areaSqFt = (length * width) / 144;
      return Math.round(areaSqFt * rate);
    }
  }

  const basePrice = Number(product.offerPrice ?? product.sellingPrice ?? product.price ?? 0);
  return Number.isFinite(basePrice) && basePrice > 0 ? basePrice : 500;
};

/**
 * Helper to get or create cart for user
 */
const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
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

  if (!cart) {
    cart = await prisma.cart.create({
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
    return cart;
  }

  // Auto-heal any existing cart items where price was stored as raw sq ft rate
  if (cart.items && cart.items.length > 0) {
    for (const item of cart.items) {
      if (item.product) {
        const correctUnitPrice = calculateProductUnitPrice(item.product, item.size, item.thickness);
        if (correctUnitPrice > 0 && item.unitPrice !== correctUnitPrice) {
          await prisma.cartItem.update({
            where: { id: item.id },
            data: {
              unitPrice: correctUnitPrice,
              itemTotal: correctUnitPrice * item.quantity,
            },
          });
          item.unitPrice = correctUnitPrice;
          item.itemTotal = correctUnitPrice * item.quantity;
        }
      }
    }
  }

  return cart;
};

export const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, formatCart(cart), 'Cart retrieved.');
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, size = '', thickness = '', quantity = 1 } = req.body;

    if (!productId) {
      return sendError(res, 'Product ID is required.', 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: String(productId) },
    });

    if (!product || !product.isActive) {
      return sendError(res, 'Product not found or unavailable.', 404);
    }

    if (product.stock <= 0) {
      return sendError(res, 'This product is out of stock.', 400);
    }

    const normalizedSize = size == null ? '' : String(size);
    const normalizedThickness = thickness == null ? '' : String(thickness);
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    // Calculate proper unit price (e.g. Area * Rate for mattresses)
    const unitPrice = calculateProductUnitPrice(product, normalizedSize, normalizedThickness);

    const cart = await getOrCreateCart(req.user.id);

    // Check if matching item exists in cart
    const existingItem = cart.items.find(
      (item) =>
        item.productId === product.id &&
        (item.size || '') === normalizedSize &&
        (item.thickness || '') === normalizedThickness
    );

    if (existingItem) {
      const newQuantity = Math.min(10, existingItem.quantity + qty);
      const itemTotal = unitPrice * newQuantity;

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice,
          itemTotal,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          size: normalizedSize,
          thickness: normalizedThickness,
          packSize: product.packSize || 1,
          quantity: Math.min(10, qty),
          unitPrice,
          itemTotal: unitPrice * Math.min(10, qty),
        },
      });
    }

    const updatedCart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, formatCart(updatedCart), 'Item added to cart.');
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1 || qty > 10) {
      return sendError(res, 'Quantity must be between 1 and 10.', 400);
    }

    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find((entry) => entry.id === itemId);

    if (!item) {
      return sendError(res, 'Cart item not found.', 404);
    }

    const correctUnitPrice = item.product
      ? calculateProductUnitPrice(item.product, item.size, item.thickness)
      : item.unitPrice;
    const finalUnitPrice = correctUnitPrice > 0 ? correctUnitPrice : item.unitPrice;

    await prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity: qty,
        unitPrice: finalUnitPrice,
        itemTotal: finalUnitPrice * qty,
      },
    });

    const updatedCart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, formatCart(updatedCart), 'Cart item quantity updated.');
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req.user.id);

    const item = cart.items.find((entry) => entry.id === itemId);
    if (!item) {
      return sendError(res, 'Cart item not found.', 404);
    }

    await prisma.cartItem.delete({
      where: { id: item.id },
    });

    const updatedCart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, formatCart(updatedCart), 'Item removed from cart.');
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const updatedCart = await getOrCreateCart(req.user.id);
    return sendSuccess(res, formatCart(updatedCart), 'Cart cleared.');
  } catch (error) {
    next(error);
  }
};
