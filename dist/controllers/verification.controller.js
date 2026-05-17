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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.resetPassword =
  exports.forgotPassword =
  exports.verifyEmail =
  exports.sendOtp =
    void 0;
const errors_1 = require('../utils/errors');
const response_1 = require('../utils/response');
const verificationService = __importStar(
  require('../services/verification.service')
);
const prisma_1 = __importDefault(require('../config/prisma'));
exports.sendOtp = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const dbUser = await prisma_1.default.user.findUnique({
    where: { id: user.userId },
  });
  if (!dbUser) throw new errors_1.AppError('User not found', 404);
  if (dbUser.isVerified)
    throw new errors_1.AppError('Email already verified', 400);
  await verificationService.sendEmailVerificationOtp(user.userId, dbUser.email);
  (0, response_1.sendSuccess)(res, 'OTP sent to your email');
});
exports.verifyEmail = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const { otp } = req.body;
  if (!otp) throw new errors_1.AppError('OTP is required', 400);
  await verificationService.verifyEmailOtp(user.userId, otp);
  (0, response_1.sendSuccess)(res, 'Email verified successfully');
});
exports.forgotPassword = (0, errors_1.asyncHandler)(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new errors_1.AppError('Email is required', 400);
  await verificationService.sendPasswordResetOtp(email);
  (0, response_1.sendSuccess)(
    res,
    'If an account exists, a reset OTP has been sent'
  );
});
exports.resetPassword = (0, errors_1.asyncHandler)(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    throw new errors_1.AppError('email, otp and newPassword are required', 400);
  if (newPassword.length < 8)
    throw new errors_1.AppError('Password must be at least 8 characters', 400);
  await verificationService.resetPassword(email, otp, newPassword);
  (0, response_1.sendSuccess)(
    res,
    'Password reset successfully. Please login.'
  );
});
//# sourceMappingURL=verification.controller.js.map
