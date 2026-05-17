'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.prisma = void 0;
const client_1 = require('@prisma/client');
const adapter_pg_1 = require('@prisma/adapter-pg');
const logger_1 = require('./logger');
const adapter = new adapter_pg_1.PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const globalForPrisma = globalThis;
exports.prisma =
  globalForPrisma.prisma ||
  new client_1.PrismaClient({
    adapter,
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });
exports.prisma.$on('error', (e) => logger_1.logger.error(e));
exports.prisma.$on('warn', (e) => logger_1.logger.warn(e));
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = exports.prisma;
}
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map
