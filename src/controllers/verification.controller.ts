import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import * as verificationService from '../services/verification.service';
import prisma from '../config/prisma';

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) throw new AppError('User not found', 404);
  if (dbUser.isVerified) throw new AppError('Email already verified', 400);

  await verificationService.sendEmailVerificationOtp(user.userId, dbUser.email);
  sendSuccess(res, 'OTP sent to your email');
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const { otp } = req.body;
  if (!otp) throw new AppError('OTP is required', 400);

  await verificationService.verifyEmailOtp(user.userId, otp);
  sendSuccess(res, 'Email verified successfully');
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400);

    await verificationService.sendPasswordResetOtp(email);

    sendSuccess(res, 'If an account exists, a reset OTP has been sent');
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      throw new AppError('email, otp and newPassword are required', 400);
    if (newPassword.length < 8)
      throw new AppError('Password must be at least 8 characters', 400);

    await verificationService.resetPassword(email, otp, newPassword);
    sendSuccess(res, 'Password reset successfully. Please login.');
  }
);
