'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
require('dotenv/config');
const app_1 = __importDefault(require('./app'));
const env_1 = require('./config/env');
const logger_1 = require('./config/logger');
const prisma_1 = __importDefault(require('./config/prisma'));
const redis_1 = require('./config/redis');
const workers_1 = require('./jobs/workers');
require('./jobs/workers');
const PORT = parseInt(env_1.env.PORT, 10);
const startServer = async () => {
  try {
    await prisma_1.default.$connect();
    logger_1.logger.info('Database connected');
    await redis_1.redis.ping();
    logger_1.logger.info('Redis connected');
    logger_1.logger.info(
      'BullMQ workers started (screening, email, embedding)'
    );
    app_1.default.listen(PORT, () => {
      logger_1.logger.info(
        `Server running on port ${PORT} in ${env_1.env.NODE_ENV} mode`
      );
    });
  } catch (err) {
    logger_1.logger.error('Failed to start server:', err);
    process.exit(1);
  }
};
const gracefulShutdown = async (signal) => {
  logger_1.logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await (0, workers_1.closeWorkers)();
    await prisma_1.default.$disconnect();
    redis_1.redis.disconnect();
    process.exit(0);
  } catch (err) {
    logger_1.logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger_1.logger.error('Unhandled rejection:', err);
  process.exit(1);
});
startServer();
//# sourceMappingURL=server.js.map
