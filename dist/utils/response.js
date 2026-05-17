'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.buildPaginationMeta =
  exports.getPaginationParams =
  exports.sendError =
  exports.sendSuccess =
    void 0;
const sendSuccess = (res, message, data, statusCode = 200, meta) => {
  const response = { success: true, message, data, meta };
  return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 400, errors) => {
  const response = { success: false, message, errors };
  return res.status(statusCode).json(response);
};
exports.sendError = sendError;
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '10')));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
exports.getPaginationParams = getPaginationParams;
const buildPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
exports.buildPaginationMeta = buildPaginationMeta;
//# sourceMappingURL=response.js.map
