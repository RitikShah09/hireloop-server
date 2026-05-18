"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSessionActive = exports.invalidateAllSessions = exports.invalidateSession = exports.storeSession = exports.isRefreshTokenBlacklisted = exports.isAccessTokenBlacklisted = exports.blacklistRefreshToken = exports.blacklistAccessToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const redis_1 = require("../config/redis");
const generateTokens = (payload) => {
    const jti = (0, uuid_1.v4)();
    const accessToken = jsonwebtoken_1.default.sign({ ...payload, jti }, env_1.env.ACCESS_TOKEN_SECRET, {
        expiresIn: env_1.env.ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ ...payload, jti: (0, uuid_1.v4)() }, env_1.env.REFRESH_TOKEN_SECRET, { expiresIn: env_1.env.REFRESH_TOKEN_EXPIRES_IN });
    return { accessToken, refreshToken, jti };
};
exports.generateTokens = generateTokens;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.ACCESS_TOKEN_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.REFRESH_TOKEN_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
const blacklistAccessToken = async (jti) => {
    await redis_1.redis.set(redis_1.RedisKeys.accessTokenBlacklist(jti), '1', 'EX', redis_1.REDIS_TTL.ACCESS_TOKEN);
};
exports.blacklistAccessToken = blacklistAccessToken;
const blacklistRefreshToken = async (token) => {
    await redis_1.redis.set(redis_1.RedisKeys.refreshTokenBlacklist(token), '1', 'EX', redis_1.REDIS_TTL.REFRESH_TOKEN);
};
exports.blacklistRefreshToken = blacklistRefreshToken;
const isAccessTokenBlacklisted = async (jti) => {
    const result = await redis_1.redis.get(redis_1.RedisKeys.accessTokenBlacklist(jti));
    return result === '1';
};
exports.isAccessTokenBlacklisted = isAccessTokenBlacklisted;
const isRefreshTokenBlacklisted = async (token) => {
    const result = await redis_1.redis.get(redis_1.RedisKeys.refreshTokenBlacklist(token));
    return result === '1';
};
exports.isRefreshTokenBlacklisted = isRefreshTokenBlacklisted;
const storeSession = async (sessionId, userId, meta) => {
    await redis_1.redis.set(redis_1.RedisKeys.session(sessionId), JSON.stringify({ userId, ...meta, createdAt: Date.now() }), 'EX', redis_1.REDIS_TTL.SESSION);
    await redis_1.redis.sadd(redis_1.RedisKeys.userSessions(userId), sessionId);
    await redis_1.redis.expire(redis_1.RedisKeys.userSessions(userId), redis_1.REDIS_TTL.SESSION);
};
exports.storeSession = storeSession;
const invalidateSession = async (sessionId, userId) => {
    await redis_1.redis.del(redis_1.RedisKeys.session(sessionId));
    await redis_1.redis.srem(redis_1.RedisKeys.userSessions(userId), sessionId);
};
exports.invalidateSession = invalidateSession;
const invalidateAllSessions = async (userId) => {
    const sessions = await redis_1.redis.smembers(redis_1.RedisKeys.userSessions(userId));
    if (sessions.length) {
        await redis_1.redis.del(...sessions.map(redis_1.RedisKeys.session));
    }
    await redis_1.redis.del(redis_1.RedisKeys.userSessions(userId));
};
exports.invalidateAllSessions = invalidateAllSessions;
const isSessionActive = async (sessionId) => {
    const session = await redis_1.redis.get(redis_1.RedisKeys.session(sessionId));
    return session !== null;
};
exports.isSessionActive = isSessionActive;
//# sourceMappingURL=token.js.map