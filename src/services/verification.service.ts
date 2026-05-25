import prisma from '../config/prisma';
import { sendMail } from '../config/mailer';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';
import { otpEmailTemplate } from './email.service';

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRY_MINUTES = 15;

export const sendEmailVerificationOtp = async (
  userId: string,
  email: string
): Promise<void> => {
  await prisma.otpVerification.updateMany({
    where: { userId, type: 'email_verify', used: false },
    data: { used: true },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({
    data: { userId, otp, type: 'email_verify', expiresAt },
  });

  const html = otpEmailTemplate({
    title: 'Verify your email',
    subtitle:
      'Enter this one-time code in HireLoop to verify your email address.',
    otp,
    footerNote:
      "If you didn't create a HireLoop account, you can safely ignore this email.",
    previewText: `Your HireLoop verification code is ${otp}`,
  });

  try {
    await sendMail({
      from: env.GMAIL_FROM,
      to: email,
      subject: 'Verify your HireLoop email',
      html,
    });
    logger.info(`Verification OTP sent to ${email}`);
  } catch (err) {
    logger.error('OTP email send failed:', err);
    throw new AppError(
      'Failed to send verification email. Please try again.',
      500
    );
  }
};

export const verifyEmailOtp = async (
  userId: string,
  otp: string
): Promise<void> => {
  const record = await prisma.otpVerification.findFirst({
    where: { userId, otp, type: 'email_verify', used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) throw new AppError('Invalid OTP', 400);
  if (record.expiresAt < new Date())
    throw new AppError('OTP has expired. Please request a new one.', 400);

  await prisma.$transaction([
    prisma.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    }),
    prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
  ]);
};

export const sendPasswordResetOtp = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await prisma.otpVerification.updateMany({
    where: { userId: user.id, type: 'password_reset', used: false },
    data: { used: true },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({
    data: { userId: user.id, otp, type: 'password_reset', expiresAt },
  });

  const html = otpEmailTemplate({
    title: 'Reset your password',
    subtitle: 'Use this one-time code to reset your HireLoop password.',
    otp,
    footerNote:
      "If you didn't request a password reset, you can safely ignore this email.",
    previewText: `Your HireLoop password reset code is ${otp}`,
  });

  await sendMail({
    from: env.GMAIL_FROM,
    to: email,
    subject: 'Reset your HireLoop password',
    html,
  });
};

export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid request', 400);

  const record = await prisma.otpVerification.findFirst({
    where: { userId: user.id, otp, type: 'password_reset', used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) throw new AppError('Invalid OTP', 400);
  if (record.expiresAt < new Date()) throw new AppError('OTP expired', 400);

  const bcrypt = await import('bcryptjs');
  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    }),
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
  ]);
};
