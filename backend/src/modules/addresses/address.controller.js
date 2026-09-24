import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

/**
 * Get all saved/previous shipping addresses for the currently authenticated user.
 * Strictly scoped by current user ID (req.user.id) to prevent IDOR.
 */
export const getUserAddresses = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'Authentication required to access saved addresses.', 401);
    }

    // IDOR Protection: Always enforce user_id / userId from verified session token
    const currentUserId = req.user.id;

    // Fetch past orders belonging strictly to the current user
    const orders = await prisma.order.findMany({
      where: {
        userId: currentUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        shippingAddress: true,
        createdAt: true,
      },
    });

    const uniqueAddresses = [];
    const seen = new Set();

    for (const order of orders) {
      let shipping = order.shippingAddress;
      if (typeof shipping === 'string') {
        try {
          shipping = JSON.parse(shipping);
        } catch (_) {
          shipping = null;
        }
      }

      if (!shipping || typeof shipping !== 'object') continue;

      const street = (
        shipping.fullAddress ||
        shipping.address ||
        shipping.street ||
        [shipping.address, shipping.apartment].filter(Boolean).join(', ')
      )?.trim();

      const city = (shipping.city || '')?.trim();
      const state = (shipping.state || '')?.trim();
      const pincode = (shipping.pincode || shipping.postalCode || shipping.pin || '')?.trim();

      // Skip invalid or incomplete addresses
      if (!street || !city || !pincode) continue;

      const dedupeKey = `${street}|${city}|${state}|${pincode}`.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      uniqueAddresses.push({
        id: order.id,
        user_id: currentUserId,
        userId: currentUserId,
        fullName:
          shipping.fullName ||
          [shipping.firstName, shipping.lastName].filter(Boolean).join(' ').trim() ||
          `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() ||
          'Customer',
        mobile: shipping.mobile || shipping.phone || req.user.mobile || '',
        email: shipping.email || req.user.email || '',
        fullAddress: street,
        address: street,
        city,
        state,
        pincode,
        gstNumber: shipping.gstNumber ? String(shipping.gstNumber).trim().toUpperCase() : null,
        createdAt: order.createdAt,
      });
    }

    // Handles empty state cleanly (returns [] with 200 OK)
    return sendSuccess(res, uniqueAddresses, 'User addresses retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single address record by ID.
 * Strictly enforces that the address record belongs to req.user.id to prevent IDOR.
 */
export const getUserAddressById = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'Authentication required to access saved addresses.', 401);
    }

    const { id } = req.params;
    const currentUserId = req.user.id;

    // IDOR Protection: Query strictly matching both order ID and current user's userId
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: currentUserId,
      },
      select: {
        id: true,
        userId: true,
        shippingAddress: true,
        createdAt: true,
      },
    });

    if (!order) {
      return sendError(res, 'Address record not found or access denied.', 404);
    }

    let shipping = order.shippingAddress;
    if (typeof shipping === 'string') {
      try {
        shipping = JSON.parse(shipping);
      } catch (_) {
        shipping = {};
      }
    } else if (!shipping || typeof shipping !== 'object') {
      shipping = {};
    }

    const street = (shipping.fullAddress || shipping.address || '')?.trim();
    const city = (shipping.city || '')?.trim();
    const state = (shipping.state || '')?.trim();
    const pincode = (shipping.pincode || shipping.postalCode || shipping.pin || '')?.trim();

    return sendSuccess(res, {
      id: order.id,
      user_id: currentUserId,
      userId: currentUserId,
      fullName:
        shipping.fullName ||
        `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() ||
        'Customer',
      mobile: shipping.mobile || shipping.phone || req.user.mobile || '',
      email: shipping.email || req.user.email || '',
      fullAddress: street,
      address: street,
      city,
      state,
      pincode,
      gstNumber: shipping.gstNumber ? String(shipping.gstNumber).trim().toUpperCase() : null,
      createdAt: order.createdAt,
    }, 'Address record retrieved successfully.');
  } catch (error) {
    next(error);
  }
};
