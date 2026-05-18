"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyJobs = exports.listJobs = exports.getJobBySlug = exports.getJob = exports.deleteJob = exports.updateJob = exports.createJob = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const response_2 = require("../utils/response");
const slug_1 = require("../utils/slug");
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = require("../config/redis");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const job_validator_1 = require("../validators/job.validator");
const paramKey = (obj) => JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))));
const invalidateJobCaches = async (companyId, jobId, slug) => {
    await Promise.all([
        (0, redis_1.delByPattern)('cache:jobs:list:*'),
        (0, redis_1.delByPattern)(`cache:jobs:mine:${companyId}:*`),
        jobId ? redis_1.redis.del(redis_1.RedisKeys.jobCache(jobId)) : Promise.resolve(),
        slug ? redis_1.redis.del(redis_1.RedisKeys.jobSlugCache(slug)) : Promise.resolve(),
    ]);
};
exports.createJob = (0, errors_1.asyncHandler)(async (req, res) => {
    const { body } = (0, validate_middleware_1.parseRequest)(job_validator_1.createJobSchema, req);
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company profile not found', 404);
    const job = await prisma_1.default.job.create({
        data: {
            ...body,
            companyId: company.id,
            shareableSlug: (0, slug_1.generateSlug)(body.title),
        },
    });
    await invalidateJobCaches(company.id);
    (0, response_1.sendSuccess)(res, 'Job created', job, 201);
});
exports.updateJob = (0, errors_1.asyncHandler)(async (req, res) => {
    const { body, params } = (0, validate_middleware_1.parseRequest)(job_validator_1.updateJobSchema, req);
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const job = await prisma_1.default.job.findFirst({
        where: { id: params.id, companyId: company.id },
    });
    if (!job)
        throw new errors_1.AppError('Job not found', 404);
    const updated = await prisma_1.default.job.update({
        where: { id: params.id },
        data: { ...body },
    });
    await invalidateJobCaches(company.id, params.id, job.shareableSlug);
    (0, response_1.sendSuccess)(res, 'Job updated', updated);
});
exports.deleteJob = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const job = await prisma_1.default.job.findFirst({
        where: { id: req.params.id, companyId: company.id },
    });
    if (!job)
        throw new errors_1.AppError('Job not found', 404);
    await prisma_1.default.job.delete({ where: { id: req.params.id } });
    await invalidateJobCaches(company.id, req.params.id, job.shareableSlug);
    (0, response_1.sendSuccess)(res, 'Job deleted');
});
exports.getJob = (0, errors_1.asyncHandler)(async (req, res) => {
    const cacheKey = redis_1.RedisKeys.jobCache(req.params.id);
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Job fetched', JSON.parse(cached));
        return;
    }
    const job = await prisma_1.default.job.findUnique({
        where: { id: req.params.id },
        include: {
            company: {
                select: { name: true, logoUrl: true, location: true, industry: true },
            },
        },
    });
    if (!job)
        throw new errors_1.AppError('Job not found', 404);
    await redis_1.redis.set(cacheKey, JSON.stringify(job), 'EX', redis_1.REDIS_TTL.JOB_CACHE);
    (0, response_1.sendSuccess)(res, 'Job fetched', job);
});
exports.getJobBySlug = (0, errors_1.asyncHandler)(async (req, res) => {
    const slug = req.params.slug;
    const cacheKey = redis_1.RedisKeys.jobSlugCache(slug);
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Job fetched', JSON.parse(cached));
        return;
    }
    const job = await prisma_1.default.job.findUnique({
        where: { shareableSlug: slug },
        include: {
            company: {
                select: {
                    name: true,
                    logoUrl: true,
                    location: true,
                    industry: true,
                    website: true,
                },
            },
        },
    });
    if (!job || job.status !== 'ACTIVE')
        throw new errors_1.AppError('Job not found or not active', 404);
    await redis_1.redis.set(cacheKey, JSON.stringify(job), 'EX', redis_1.REDIS_TTL.JOB_CACHE);
    (0, response_1.sendSuccess)(res, 'Job fetched', job);
});
exports.listJobs = (0, errors_1.asyncHandler)(async (req, res) => {
    const { query: { page: pageStr, limit: limitStr, search, skills, isRemote, status }, } = (0, validate_middleware_1.parseRequest)(job_validator_1.jobQuerySchema, req);
    const { page, limit, skip } = (0, response_2.getPaginationParams)({
        page: pageStr,
        limit: limitStr,
    });
    const cacheKey = redis_1.RedisKeys.jobListCache(paramKey({ page, limit, search, skills, isRemote, status }));
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        const { jobs, total } = JSON.parse(cached);
        (0, response_1.sendSuccess)(res, 'Jobs fetched', jobs, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
        return;
    }
    const where = {};
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (skills)
        where.skills = { hasSome: skills.split(',').map((s) => s.trim()) };
    if (isRemote !== undefined)
        where.isRemote = isRemote === 'true';
    if (status)
        where.status = status;
    const [jobs, total] = await Promise.all([
        prisma_1.default.job.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                company: { select: { name: true, logoUrl: true, location: true } },
            },
        }),
        prisma_1.default.job.count({ where }),
    ]);
    await redis_1.redis.set(cacheKey, JSON.stringify({ jobs, total }), 'EX', redis_1.REDIS_TTL.JOB_LIST);
    (0, response_1.sendSuccess)(res, 'Jobs fetched', jobs, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
});
exports.getCompanyJobs = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const { page, limit, skip } = (0, response_2.getPaginationParams)(req.query);
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const cacheKey = redis_1.RedisKeys.companyJobsCache(company.id, paramKey({ page, limit }));
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        const { jobs, total } = JSON.parse(cached);
        (0, response_1.sendSuccess)(res, 'Company jobs fetched', jobs, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
        return;
    }
    const [jobs, total] = await Promise.all([
        prisma_1.default.job.findMany({
            where: { companyId: company.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { applications: true } } },
        }),
        prisma_1.default.job.count({ where: { companyId: company.id } }),
    ]);
    await redis_1.redis.set(cacheKey, JSON.stringify({ jobs, total }), 'EX', redis_1.REDIS_TTL.JOB_LIST);
    (0, response_1.sendSuccess)(res, 'Company jobs fetched', jobs, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
});
//# sourceMappingURL=job.controller.js.map