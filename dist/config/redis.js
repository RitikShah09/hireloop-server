"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delByPattern = exports.REDIS_TTL = exports.RedisKeys = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("./logger");
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
});
exports.redis.on('connect', () => logger_1.logger.info('Redis connected'));
exports.redis.on('error', (err) => logger_1.logger.error('Redis error:', err));
exports.RedisKeys = {
    accessTokenBlacklist: (jti) => `blacklist:access:${jti}`,
    refreshTokenBlacklist: (token) => `blacklist:refresh:${token}`,
    session: (sessionId) => `session:${sessionId}`,
    userSessions: (userId) => `user:sessions:${userId}`,
    rateLimitIp: (ip) => `ratelimit:ip:${ip}`,
    rateLimitUser: (userId) => `ratelimit:user:${userId}`,
    jobCache: (jobId) => `cache:job:${jobId}`,
    jobSlugCache: (slug) => `cache:job:slug:${slug}`,
    jobListCache: (params) => `cache:jobs:list:${params}`,
    companyJobsCache: (companyId, params) => `cache:jobs:mine:${companyId}:${params}`,
    candidateRanking: (jobId) => `cache:ranking:${jobId}`,
    applicationStats: (userId) => `cache:appstats:${userId}`,
    candidateData: (candidateId, type) => `cache:candidate:${candidateId}:${type}`,
    suggestedJobs: (candidateId) => `cache:suggested:${candidateId}`,
    resumesCache: (candidateId) => `cache:resumes:${candidateId}`,
    candidateProfile: (userId) => `cache:profile:candidate:${userId}`,
    companyProfile: (userId) => `cache:profile:company:${userId}`,
    publicCompany: (companyId) => `cache:company:public:${companyId}`,
    interviewsCache: (userId) => `cache:interviews:${userId}`,
    analyticsCache: (companyId) => `cache:analytics:${companyId}`,
    searchCache: (type, params) => `cache:search:${type}:${params}`,
};
exports.REDIS_TTL = {
    ACCESS_TOKEN: 60 * 15,
    REFRESH_TOKEN: 60 * 60 * 24 * 7,
    SESSION: 60 * 60 * 24 * 7,
    JOB_CACHE: 60 * 5,
    JOB_LIST: 60 * 2,
    RANKING_CACHE: 60 * 10,
    CANDIDATE_DATA: 60 * 10,
    SUGGESTED_JOBS: 60 * 15,
    RESUMES: 60 * 10,
    PROFILE: 60 * 5,
    PUBLIC_PROFILE: 60 * 15,
    INTERVIEWS: 60 * 2,
    APP_STATS: 60 * 5,
    ANALYTICS: 60 * 5,
    SEARCH: 60 * 2,
};
const delByPattern = async (pattern) => {
    const keys = await exports.redis.keys(pattern);
    if (keys.length > 0)
        await exports.redis.del(...keys);
};
exports.delByPattern = delByPattern;
//# sourceMappingURL=redis.js.map