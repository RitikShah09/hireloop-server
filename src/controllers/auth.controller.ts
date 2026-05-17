import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import * as authService from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { env } from '../config/env';
import { parseRequest } from '../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { body } = parseRequest(registerSchema, req);
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

  sendSuccess(res, 'Registration successful', { user: result.user }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { body } = parseRequest(loginSchema, req);
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

  sendSuccess(res, 'Login successful', { user: result.user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
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

  sendSuccess(res, 'Token refreshed', { user: tokens.user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
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

  sendSuccess(
    res,
    logoutAll ? 'Logged out from all devices' : 'Logged out successfully'
  );
});

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const sessions = await authService.getUserSessions(user.userId);
  sendSuccess(res, 'Sessions fetched', sessions);
});

export const revokeSession = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { sessionId } = req.params;
    await authService.revokeSession(user.userId, sessionId as string);
    sendSuccess(res, 'Session revoked');
  }
);

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const profile = await authService.getUserProfile(user.userId);
  sendSuccess(res, 'User info', profile);
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const {
      body: { currentPassword, newPassword },
    } = parseRequest(changePasswordSchema, req);
    await authService.changePassword(user.userId, currentPassword, newPassword);
    sendSuccess(res, 'Password changed successfully');
  }
);
