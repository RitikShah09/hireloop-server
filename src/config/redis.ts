import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));

export const RedisKeys = {
  accessTokenBlacklist: (jti: string) => `blacklist:access:${jti}`,
  refreshTokenBlacklist: (token: string) => `blacklist:refresh:${token}`,
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:sessions:${userId}`,
  rateLimitIp: (ip: string) => `ratelimit:ip:${ip}`,
  rateLimitUser: (userId: string) => `ratelimit:user:${userId}`,

  jobCache: (jobId: string) => `cache:job:${jobId}`,
  jobSlugCache: (slug: string) => `cache:job:slug:${slug}`,
  jobListCache: (params: string) => `cache:jobs:list:${params}`,
  companyJobsCache: (companyId: string, params: string) =>
    `cache:jobs:mine:${companyId}:${params}`,

  candidateRanking: (jobId: string) => `cache:ranking:${jobId}`,
  applicationStats: (userId: string) => `cache:appstats:${userId}`,

  candidateData: (candidateId: string, type: string) =>
    `cache:candidate:${candidateId}:${type}`,
  suggestedJobs: (candidateId: string) => `cache:suggested:${candidateId}`,
  resumesCache: (candidateId: string) => `cache:resumes:${candidateId}`,

  candidateProfile: (userId: string) => `cache:profile:candidate:${userId}`,
  companyProfile: (userId: string) => `cache:profile:company:${userId}`,
  publicCompany: (companyId: string) => `cache:company:public:${companyId}`,

  interviewsCache: (userId: string) => `cache:interviews:${userId}`,

  analyticsCache: (companyId: string) => `cache:analytics:${companyId}`,

  searchCache: (type: string, params: string) =>
    `cache:search:${type}:${params}`,
};

export const REDIS_TTL = {
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

export const delByPattern = async (pattern: string): Promise<void> => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
};
