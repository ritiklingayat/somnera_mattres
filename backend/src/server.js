import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import prisma from './config/prisma.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`================================================`);
  logger.info(`Somnera Mattress API Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
  logger.info(`================================================`);
});

// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Closing HTTP server and database connections...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Prisma database disconnected.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
