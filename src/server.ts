import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import prisma from './config/prisma';
import { redis } from './config/redis';
import { closeWorkers } from './jobs/workers';
import './jobs/workers';

const PORT = parseInt(env.PORT, 10);

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await redis.ping();
    logger.info('Redis connected');

    logger.info('BullMQ workers started (screening, email, embedding)');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await closeWorkers();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  process.exit(1);
});

startServer();
