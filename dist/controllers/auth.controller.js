'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.changePassword =
  exports.me =
  exports.revokeSession =
  exports.getSessions =
  exports.logout =
  exports.refresh =
  exports.login =
  exports.register =
    void 0;
const errors_1 = require('../utils/errors');
const response_1 = require('../utils/response');
const authService = __importStar(require('../services/auth.service'));
const env_1 = require('../config/env');
const validate_middleware_1 = require('../middlewares/validate.middleware');
const auth_validator_1 = require('../validators/auth.validator');
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env_1.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};
const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';
exports.register = (0, errors_1.asyncHandler)(async (req, res) => {
  const { body } = (0, validate_middleware_1.parseRequest)(
    auth_validator_1.registerSchema,
    req
  );
  const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  const result = await authService.registerUser(body, meta);
  res.cookie(ACCESS_COOKIE, result.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  (0, response_1.sendSuccess)(
    res,
    'Registration successful',
    { user: result.user },
    201
  );
});
exports.login = (0, errors_1.asyncHandler)(async (req, res) => {
  const { body } = (0, validate_middleware_1.parseRequest)(
    auth_validator_1.loginSchema,
    req
  );
  const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  const result = await authService.loginUser(body, meta);
  res.cookie(ACCESS_COOKIE, result.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  (0, response_1.sendSuccess)(res, 'Login successful', { user: result.user });
});
exports.refresh = (0, errors_1.asyncHandler)(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE] || req.body.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ success: false, message: 'Refresh token required' });
    return;
  }
  const tokens = await authService.refreshAccessToken(refreshToken);
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  (0, response_1.sendSuccess)(res, 'Token refreshed', { user: tokens.user });
});
exports.logout = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const { logoutAll } = req.body;
  const refreshToken = req.cookies[REFRESH_COOKIE];
  await authService.logoutUser(
    user.userId,
    user.sessionId,
    user.jti,
    refreshToken,
    logoutAll === true
  );
  res.clearCookie(ACCESS_COOKIE, COOKIE_OPTIONS);
  res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
  (0, response_1.sendSuccess)(
    res,
    logoutAll ? 'Logged out from all devices' : 'Logged out successfully'
  );
});
exports.getSessions = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const sessions = await authService.getUserSessions(user.userId);
  (0, response_1.sendSuccess)(res, 'Sessions fetched', sessions);
});
exports.revokeSession = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const { sessionId } = req.params;
  await authService.revokeSession(user.userId, sessionId);
  (0, response_1.sendSuccess)(res, 'Session revoked');
});
exports.me = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const profile = await authService.getUserProfile(user.userId);
  (0, response_1.sendSuccess)(res, 'User info', profile);
});
exports.changePassword = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const {
    body: { currentPassword, newPassword },
  } = (0, validate_middleware_1.parseRequest)(
    auth_validator_1.changePasswordSchema,
    req
  );
  await authService.changePassword(user.userId, currentPassword, newPassword);
  (0, response_1.sendSuccess)(res, 'Password changed successfully');
});
//# sourceMappingURL=auth.controller.js.map
