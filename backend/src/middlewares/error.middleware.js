import { logger } from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - Error:`, err.message || err);

  // Prisma database unreachable / connection failure
  if (err.code === 'P1001' || err.message?.includes("Can't reach database server")) {
    return sendError(
      res,
      'Cannot connect to the database. Please provide your real Neon DB PostgreSQL connection string in backend/.env under DATABASE_URL.',
      503
    );
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const target = err.meta?.target ? ` (${err.meta.target.join(', ')})` : '';
    return sendError(res, `A record with this value already exists${target}.`, 409);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return sendError(res, 'The requested resource was not found.', 404);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return sendError(res, `Upload error: ${err.message}`, 400);
  }

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const message = err.message || 'An unexpected server error occurred.';

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
