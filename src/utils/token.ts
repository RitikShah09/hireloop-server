import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { redis, RedisKeys, REDIS_TTL } from '../config/redis';
import { JwtPayload } from '../types';
import { Role } from '@prisma/client';

export const generateTokens = (payload: {
  userId: string;
  role: Role;
  sessionId: string;
}) => {
  const jti = uuidv4();

  const accessToken = jwt.sign({ ...payload, jti }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(
    { ...payload, jti: uuidv4() },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken, jti };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
};

export const blacklistAccessToken = async (jti: string): Promise<void> => {
  await redis.set(
    RedisKeys.accessTokenBlacklist(jti),
    '1',
    'EX',
    REDIS_TTL.ACCESS_TOKEN
  );
};

export const blacklistRefreshToken = async (token: string): Promise<void> => {
  await redis.set(
    RedisKeys.refreshTokenBlacklist(token),
    '1',
    'EX',
    REDIS_TTL.REFRESH_TOKEN
  );
};

export const isAccessTokenBlacklisted = async (
  jti: string
): Promise<boolean> => {
  const result = await redis.get(RedisKeys.accessTokenBlacklist(jti));
  return result === '1';
};

export const isRefreshTokenBlacklisted = async (
  token: string
): Promise<boolean> => {
  const result = await redis.get(RedisKeys.refreshTokenBlacklist(token));
  return result === '1';
};

export const storeSession = async (
  sessionId: string,
  userId: string,
  meta: { userAgent?: string; ipAddress?: string }
): Promise<void> => {
  await redis.set(
    RedisKeys.session(sessionId),
    JSON.stringify({ userId, ...meta, createdAt: Date.now() }),
    'EX',
    REDIS_TTL.SESSION
  );
  await redis.sadd(RedisKeys.userSessions(userId), sessionId);
  await redis.expire(RedisKeys.userSessions(userId), REDIS_TTL.SESSION);
};

export const invalidateSession = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  await redis.del(RedisKeys.session(sessionId));
  await redis.srem(RedisKeys.userSessions(userId), sessionId);
};

export const invalidateAllSessions = async (userId: string): Promise<void> => {
  const sessions = await redis.smembers(RedisKeys.userSessions(userId));
  if (sessions.length) {
    await redis.del(...sessions.map(RedisKeys.session));
  }
  await redis.del(RedisKeys.userSessions(userId));
};

export const isSessionActive = async (sessionId: string): Promise<boolean> => {
  const session = await redis.get(RedisKeys.session(sessionId));
  return session !== null;
};
