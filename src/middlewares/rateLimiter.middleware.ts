import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { redis } from '../config/redis';
import { sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

const ipRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'ratelimit:ip',
  points: 100,
  duration: 60 * 15,
  blockDuration: 60,
});

const userRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'ratelimit:user',
  points: 200,
  duration: 60 * 15,
  blockDuration: 60,
});

const authRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'ratelimit:auth',
  points: 10,
  duration: 60 * 15,
  blockDuration: 60 * 5,
});

const aiRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'ratelimit:ai',
  points: 20,
  duration: 60 * 60,
  blockDuration: 60 * 10,
});

const getIp = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  'unknown';

export const ipLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ipRateLimiter.consume(getIp(req));
    next();
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      res.set('Retry-After', String(Math.ceil(err.msBeforeNext / 1000)));
      sendError(res, 'Too many requests from this IP', 429);
      return;
    }
    next(err);
  }
};

export const userLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const key = user ? user.userId : getIp(req);
  try {
    await userRateLimiter.consume(key);
    next();
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      res.set('Retry-After', String(Math.ceil(err.msBeforeNext / 1000)));
      sendError(res, 'Too many requests', 429);
      return;
    }
    next(err);
  }
};

export const authLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authRateLimiter.consume(getIp(req));
    next();
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      res.set('Retry-After', String(Math.ceil(err.msBeforeNext / 1000)));
      sendError(res, 'Too many auth attempts. Please try again later.', 429);
      return;
    }
    next(err);
  }
};

export const aiLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    next();
    return;
  }
  try {
    await aiRateLimiter.consume(user.userId);
    next();
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      res.set('Retry-After', String(Math.ceil(err.msBeforeNext / 1000)));
      sendError(res, 'AI request limit reached. Try again later.', 429);
      return;
    }
    next(err);
  }
};
