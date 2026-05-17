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
  exports.sendPasswordResetOtp =
  exports.verifyEmailOtp =
  exports.sendEmailVerificationOtp =
    void 0;
const prisma_1 = __importDefault(require('../config/prisma'));
const mailer_1 = require('../config/mailer');
const env_1 = require('../config/env');
const errors_1 = require('../utils/errors');
const logger_1 = require('../config/logger');
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const OTP_EXPIRY_MINUTES = 15;
const otpEmailHtml = (opts) => {
  const B = {
    primary: '#1a6ef5',
    primaryDark: '#1259d4',
    primaryLight: '#eff6ff',
    bg: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    textSubtle: '#94a3b8',
  };
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HireLoop</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { margin:0;padding:0;width:100% !important;background-color:${B.bg}; }
    @media only screen and (max-width:480px) {
      .email-container { width:100% !important;border-radius:0 !important; }
      .otp-block { padding:20px !important; }
      .otp-digits { font-size:28px !important;letter-spacing:8px !important; }
      .body-cell { padding:28px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${B.bg};font-family:'Inter',Arial,Helvetica,sans-serif;">

  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${B.bg};padding:40px 16px;">
    <tr>
      <td align="center">

        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="480"
          style="max-width:480px;border-radius:14px;overflow:hidden;border:1px solid ${B.border};box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header with gradient -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,${B.primary} 0%,${B.primaryDark} 100%);padding:28px 32px 32px;">
              <h1 style="margin:0 0 4px;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;font-family:'Inter',Arial,sans-serif;">
                Hire<span style="opacity:0.7;">Loop</span>
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.75);font-size:13px;font-family:'Inter',Arial,sans-serif;">AI-Powered Hiring Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="body-cell" style="background:${B.surface};padding:36px 40px;text-align:center;">

              <h2 style="margin:0 0 10px;color:${B.text};font-size:22px;font-weight:700;font-family:'Inter',Arial,sans-serif;">${opts.title}</h2>
              <p style="margin:0 0 28px;color:${B.textMuted};font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${opts.subtitle}</p>

              <!-- OTP block -->
              <div class="otp-block" style="background:${B.primaryLight};border:2px solid ${B.primary};border-radius:12px;padding:28px 32px;margin:0 auto 28px;display:inline-block;min-width:200px;">
                <p style="margin:0 0 6px;color:${B.primary};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:'Inter',Arial,sans-serif;">One-Time Code</p>
                <p class="otp-digits" style="margin:0;color:${B.primaryDark};font-size:36px;font-weight:800;letter-spacing:10px;font-family:'Inter',Arial,monospace;">${opts.otp}</p>
              </div>

              <p style="margin:0 0 8px;color:${B.textMuted};font-size:14px;font-family:'Inter',Arial,sans-serif;">
                This code expires in <strong style="color:${B.text};">${OTP_EXPIRY_MINUTES} minutes</strong>.
              </p>
              <p style="margin:0;color:${B.textSubtle};font-size:12px;font-family:'Inter',Arial,sans-serif;">Never share this code with anyone.</p>

            </td>
          </tr>

          <!-- Footer note -->
          <tr>
            <td style="background:${B.bg};padding:18px 40px;border-top:1px solid ${B.border};">
              <p style="margin:0;color:${B.textSubtle};font-size:12px;line-height:1.6;text-align:center;font-family:'Inter',Arial,sans-serif;">
                ${opts.footerNote}<br/>
                &copy; ${new Date().getFullYear()} HireLoop. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};
const sendEmailVerificationOtp = async (userId, email) => {
  await prisma_1.default.otpVerification.updateMany({
    where: { userId, type: 'email_verify', used: false },
    data: { used: true },
  });
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await prisma_1.default.otpVerification.create({
    data: { userId, otp, type: 'email_verify', expiresAt },
  });
  const html = otpEmailHtml({
    title: 'Verify your email',
    subtitle:
      'Enter this one-time code in HireLoop to verify your email address.',
    otp,
    footerNote:
      "If you didn't create a HireLoop account, you can safely ignore this email.",
    previewText: `Your HireLoop verification code is ${otp}`,
  });
  try {
    await mailer_1.transporter.sendMail({
      from: env_1.env.SMTP_FROM,
      to: email,
      subject: 'Verify your HireLoop email',
      html,
    });
    logger_1.logger.info(`Verification OTP sent to ${email}`);
  } catch (err) {
    logger_1.logger.error('OTP email send failed:', err);
    throw new errors_1.AppError(
      'Failed to send verification email. Please try again.',
      500
    );
  }
};
exports.sendEmailVerificationOtp = sendEmailVerificationOtp;
const verifyEmailOtp = async (userId, otp) => {
  const record = await prisma_1.default.otpVerification.findFirst({
    where: { userId, otp, type: 'email_verify', used: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new errors_1.AppError('Invalid OTP', 400);
  if (record.expiresAt < new Date())
    throw new errors_1.AppError(
      'OTP has expired. Please request a new one.',
      400
    );
  await prisma_1.default.$transaction([
    prisma_1.default.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    }),
    prisma_1.default.user.update({
      where: { id: userId },
      data: { isVerified: true },
    }),
  ]);
};
exports.verifyEmailOtp = verifyEmailOtp;
const sendPasswordResetOtp = async (email) => {
  const user = await prisma_1.default.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma_1.default.otpVerification.updateMany({
    where: { userId: user.id, type: 'password_reset', used: false },
    data: { used: true },
  });
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await prisma_1.default.otpVerification.create({
    data: { userId: user.id, otp, type: 'password_reset', expiresAt },
  });
  const html = otpEmailHtml({
    title: 'Reset your password',
    subtitle: 'Use this one-time code to reset your HireLoop password.',
    otp,
    footerNote:
      "If you didn't request a password reset, you can safely ignore this email.",
    previewText: `Your HireLoop password reset code is ${otp}`,
  });
  await mailer_1.transporter.sendMail({
    from: env_1.env.SMTP_FROM,
    to: email,
    subject: 'Reset your HireLoop password',
    html,
  });
};
exports.sendPasswordResetOtp = sendPasswordResetOtp;
const resetPassword = async (email, otp, newPassword) => {
  const user = await prisma_1.default.user.findUnique({ where: { email } });
  if (!user) throw new errors_1.AppError('Invalid request', 400);
  const record = await prisma_1.default.otpVerification.findFirst({
    where: { userId: user.id, otp, type: 'password_reset', used: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new errors_1.AppError('Invalid OTP', 400);
  if (record.expiresAt < new Date())
    throw new errors_1.AppError('OTP expired', 400);
  const bcrypt = await Promise.resolve().then(() =>
    __importStar(require('bcryptjs'))
  );
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma_1.default.$transaction([
    prisma_1.default.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    }),
    prisma_1.default.user.update({
      where: { id: user.id },
      data: { password: hashed },
    }),
  ]);
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=verification.service.js.map
