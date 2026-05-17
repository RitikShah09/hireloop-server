'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.notFound = exports.errorHandler = void 0;
const errors_1 = require('../utils/errors');
const zod_1 = require('zod');
const response_1 = require('../utils/response');
const validate_middleware_1 = require('./validate.middleware');
const logger_1 = require('../config/logger');
const env_1 = require('../config/env');
const errorHandler = (err, req, res, _next) => {
  logger_1.logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  if (err instanceof errors_1.AppError) {
    (0, response_1.sendError)(res, err.message, err.statusCode);
    return;
  }
  if (err instanceof zod_1.ZodError) {
    (0, response_1.sendError)(
      res,
      'Validation failed',
      422,
      (0, validate_middleware_1.formatZodErrors)(err.issues)
    );
    return;
  }
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err;
    if (prismaErr.code === 'P2002') {
      (0, response_1.sendError)(
        res,
        'A record with this value already exists',
        409
      );
      return;
    }
    if (prismaErr.code === 'P2025') {
      (0, response_1.sendError)(res, 'Record not found', 404);
      return;
    }
  }
  const message =
    env_1.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message;
  (0, response_1.sendError)(res, message, 500);
};
exports.errorHandler = errorHandler;
const notFound = (req, res) => {
  (0, response_1.sendError)(
    res,
    `Route ${req.method} ${req.url} not found`,
    404
  );
};
exports.notFound = notFound;
//# sourceMappingURL=error.middleware.js.map
