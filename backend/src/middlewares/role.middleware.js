import { sendError } from '../utils/apiResponse.js';

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized. Please sign in.', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Access denied. You do not have permission to perform this action.', 403);
    }
    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
