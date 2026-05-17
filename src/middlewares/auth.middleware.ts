import { Request, Response, NextFunction } from 'express';
import {
  verifyAccessToken,
  isAccessTokenBlacklisted,
  isSessionActive,
} from '../utils/token';
import { sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      sendError(res, 'Access token required', 401);
      return;
    }

    const payload = verifyAccessToken(token);

    const blacklisted = await isAccessTokenBlacklisted(payload.jti);
    if (blacklisted) {
      sendError(res, 'Token has been revoked', 401);
      return;
    }

    const sessionActive = await isSessionActive(payload.sessionId);
    if (!sessionActive) {
      sendError(res, 'Session expired or logged out', 401);
      return;
    }

    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    sendError(res, 'Invalid or expired access token', 401);
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
};
