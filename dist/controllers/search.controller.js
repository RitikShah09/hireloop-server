"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyById = exports.searchCompanies = exports.getCandidateById = exports.searchCandidates = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const response_2 = require("../utils/response");
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = require("../config/redis");
const paramKey = (obj) => JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))));
exports.searchCandidates = (0, errors_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, response_2.getPaginationParams)(req.query);
    const { search, skills, location } = req.query;
    const cacheKey = redis_1.RedisKeys.searchCache('candidates', paramKey({ page, limit, search, skills, location }));
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        const { candidates, total } = JSON.parse(cached);
        (0, response_1.sendSuccess)(res, 'Candidates fetched', candidates, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
        return;
    }
    const where = {};
    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { bio: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (skills)
        where.skills = { hasSome: skills.split(',').map((s) => s.trim()) };
    if (location)
        where.location = { contains: location, mode: 'insensitive' };
    const [candidates, total] = await Promise.all([
        prisma_1.default.candidate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                location: true,
                bio: true,
                avatarUrl: true,
                skills: true,
                linkedinUrl: true,
                githubUrl: true,
                portfolioUrl: true,
                createdAt: true,
                _count: { select: { applications: true } },
            },
        }),
        prisma_1.default.candidate.count({ where }),
    ]);
    await redis_1.redis.set(cacheKey, JSON.stringify({ candidates, total }), 'EX', redis_1.REDIS_TTL.SEARCH);
    (0, response_1.sendSuccess)(res, 'Candidates fetched', candidates, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
});
exports.getCandidateById = (0, errors_1.asyncHandler)(async (req, res) => {
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { id: req.params.id },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            location: true,
            bio: true,
            avatarUrl: true,
            skills: true,
            linkedinUrl: true,
            githubUrl: true,
            portfolioUrl: true,
            createdAt: true,
            user: { select: { email: true, createdAt: true } },
            resumes: {
                where: { isDefault: true },
                select: { fileName: true, fileUrl: true, createdAt: true },
                take: 1,
            },
            _count: { select: { applications: true } },
        },
    });
    if (!candidate)
        throw new errors_1.AppError('Candidate not found', 404);
    (0, response_1.sendSuccess)(res, 'Candidate fetched', candidate);
});
exports.searchCompanies = (0, errors_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, response_2.getPaginationParams)(req.query);
    const { search, industry, location } = req.query;
    const cacheKey = redis_1.RedisKeys.searchCache('companies', paramKey({ page, limit, search, industry, location }));
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        const { companies, total } = JSON.parse(cached);
        (0, response_1.sendSuccess)(res, 'Companies fetched', companies, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
        return;
    }
    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (industry)
        where.industry = { contains: industry, mode: 'insensitive' };
    if (location)
        where.location = { contains: location, mode: 'insensitive' };
    const [companies, total] = await Promise.all([
        prisma_1.default.company.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                description: true,
                logoUrl: true,
                industry: true,
                size: true,
                location: true,
                website: true,
                createdAt: true,
                _count: { select: { jobs: { where: { status: 'ACTIVE' } } } },
            },
        }),
        prisma_1.default.company.count({ where }),
    ]);
    await redis_1.redis.set(cacheKey, JSON.stringify({ companies, total }), 'EX', redis_1.REDIS_TTL.SEARCH);
    (0, response_1.sendSuccess)(res, 'Companies fetched', companies, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
});
exports.getCompanyById = (0, errors_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, response_2.getPaginationParams)(req.query);
    const companyId = req.params.id;
    const company = await prisma_1.default.company.findUnique({
        where: { id: companyId },
        select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            industry: true,
            size: true,
            location: true,
            website: true,
            createdAt: true,
        },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const [jobs, totalJobs] = await Promise.all([
        prisma_1.default.job.findMany({
            where: { companyId, status: 'ACTIVE' },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                location: true,
                isRemote: true,
                salaryMin: true,
                salaryMax: true,
                currency: true,
                skills: true,
                experienceMin: true,
                experienceMax: true,
                shareableSlug: true,
                closingDate: true,
                createdAt: true,
            },
        }),
        prisma_1.default.job.count({ where: { companyId, status: 'ACTIVE' } }),
    ]);
    (0, response_1.sendSuccess)(res, 'Company fetched', {
        company,
        jobs,
        jobsMeta: (0, response_2.buildPaginationMeta)(totalJobs, page, limit),
    });
});
//# sourceMappingURL=search.controller.js.map