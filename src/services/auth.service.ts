import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import {
  generateTokens,
  verifyRefreshToken,
  blacklistAccessToken,
  blacklistRefreshToken,
  isRefreshTokenBlacklisted,
  storeSession,
  invalidateSession,
  invalidateAllSessions,
  isSessionActive,
} from '../utils/token';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { Role } from '@prisma/client';

export const registerUser = async (
  input: RegisterInput,
  meta: { userAgent?: string; ipAddress?: string }
) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new AppError('Email already in use', 409);

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        role: input.role as Role,
        isVerified: true,
      },
    });

    if (input.role === 'CANDIDATE') {
      await tx.candidate.create({
        data: {
          userId: newUser.id,
          firstName: input.firstName || '',
          lastName: input.lastName || '',
        },
      });
    } else if (input.role === 'COMPANY') {
      await tx.company.create({
        data: { userId: newUser.id, name: input.companyName || '' },
      });
    }

    return newUser;
  });

  const sessionId = uuidv4();
  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    role: user.role,
    sessionId,
  });

  await storeSession(sessionId, user.id, meta);

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        sessionId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (
  input: LoginInput,
  meta: { userAgent?: string; ipAddress?: string }
) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError('Invalid credentials', 401);
  if (user.isBlocked) throw new AppError('Account has been blocked', 403);

  const isValid = await bcrypt.compare(input.password, user.password);
  if (!isValid) throw new AppError('Invalid credentials', 401);

  const sessionId = uuidv4();
  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    role: user.role,
    sessionId,
  });

  await storeSession(sessionId, user.id, meta);

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        sessionId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const blacklisted = await isRefreshTokenBlacklisted(refreshToken);
  if (blacklisted) throw new AppError('Refresh token revoked', 401);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const active = await isSessionActive(payload.sessionId);
  if (!active) throw new AppError('Session expired', 401);

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (!stored) throw new AppError('Refresh token not found', 401);

  await blacklistRefreshToken(refreshToken);
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    userId: payload.userId,
    role: payload.role,
    sessionId: payload.sessionId,
  });

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: payload.userId,
      sessionId: payload.sessionId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true },
  });

  return { accessToken, refreshToken: newRefreshToken, user };
};

export const logoutUser = async (
  userId: string,
  sessionId: string,
  jti: string,
  refreshToken?: string,
  logoutAll = false
) => {
  await blacklistAccessToken(jti);

  if (logoutAll) {
    await invalidateAllSessions(userId);
    await prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });
    await prisma.refreshToken.deleteMany({ where: { userId } });
  } else {
    await invalidateSession(sessionId, userId);
    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
    if (refreshToken) {
      await blacklistRefreshToken(refreshToken);
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
  }
};

export const getUserSessions = async (userId: string) => {
  return prisma.session.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
    },
  });
};

export const revokeSession = async (userId: string, sessionId: string) => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new AppError('Session not found', 404);

  await invalidateSession(sessionId, userId);
  await prisma.$transaction([
    prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    }),
    prisma.refreshToken.deleteMany({ where: { sessionId } }),
  ]);
};

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
      candidate: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      company: { select: { id: true, name: true, logoUrl: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new AppError('Current password is incorrect', 400);

  if (currentPassword === newPassword) {
    throw new AppError('New password must differ from current password', 400);
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
};
