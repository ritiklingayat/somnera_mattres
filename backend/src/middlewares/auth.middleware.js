import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import { sendError } from '../utils/apiResponse.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token required. Please sign in.', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Your session has expired. Please sign in again.', 401);
      }
      return sendError(res, 'Invalid authentication token.', 401);
    }

    // Retrieve user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'User account no longer exists.', 401);
    }

    if (user.status === 'BLOCKED') {
      return sendError(res, 'Your account has been suspended. Please contact customer support.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return next(error);
  }
};

// Optional auth: populates req.user if token is present, but doesn't reject if absent
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true },
        });
        if (user && user.status !== 'BLOCKED') {
          req.user = user;
        }
      } catch {
        // Token invalid, proceed as guest
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
