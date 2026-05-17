"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLimiter = exports.authLimiter = exports.userLimiter = exports.ipLimiter = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const redis_1 = require("../config/redis");
const response_1 = require("../utils/response");
const ipRateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redis_1.redis,
    keyPrefix: 'ratelimit:ip',
    points: 100,
    duration: 60 * 15,
    blockDuration: 60,
});
const userRateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redis_1.redis,
    keyPrefix: 'ratelimit:user',
    points: 200,
    duration: 60 * 15,
    blockDuration: 60,
});
const authRateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redis_1.redis,
    keyPrefix: 'ratelimit:auth',
    points: 10,
    duration: 60 * 15,
    blockDuration: 60 * 5,
});
const aiRateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redis_1.redis,
    keyPrefix: 'ratelimit:ai',
    points: 20,
    duration: 60 * 60,
    blockDuration: 60 * 10,
});
const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';
const ipLimiter = async (req, res, next) => {
    try {
        await ipRateLimiter.consume(getIp(req));
        next();
    }
    catch (err) {
        if (err instanceof rate_limiter_flexible_1.RateLimiterRes) {
            res.set('Retry-After', String(Math.ceil(err.msBeforeNext / 1000)));
            (0, response_1.sendError)(res, 'Too many requests from this IP', 429);
            return;
        }
        next(err);
    }
};
exports.ipLimiter = ipLimiter;
const userLimiter = async (req, res, next) => {
    const user = req.user;
    const key = user ? user.userId : getIp(req);
    try {
        await userRateLimiter.consume(key);
        next();
    }
    catch (err) {
        if (err instanceof rate_limiter_flexible_1.RateLimiterRes) {
            res.set('Retry-After', String(Math.ceil(err.msBeforeNext / 1000)));
            (0, response_1.sendError)(res, 'Too many requests', 429);
            return;
        }
        next(err);
    }
};
exports.userLimiter = userLimiter;
const authLimiter = async (req, res, next) => {
    try {
        await authRateLimiter.consume(getIp(req));
        next();
    }
    catch (err) {
        if (err instanceof rate_limiter_flexible_1.RateLimiterRes) {
            res.set('Retry-After', String(Math.ceil(err.msBeforeNext / 1000)));
            (0, response_1.sendError)(res, 'Too many auth attempts. Please try again later.', 429);
            return;
        }
        next(err);
    }
};
exports.authLimiter = authLimiter;
const aiLimiter = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        next();
        return;
    }
    try {
        await aiRateLimiter.consume(user.userId);
        next();
    }
    catch (err) {
        if (err instanceof rate_limiter_flexible_1.RateLimiterRes) {
            res.set('Retry-After', String(Math.ceil(err.msBeforeNext / 1000)));
            (0, response_1.sendError)(res, 'AI request limit reached. Try again later.', 429);
            return;
        }
        next(err);
    }
};
exports.aiLimiter = aiLimiter;
//# sourceMappingURL=rateLimiter.middleware.js.map