"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiJobSearch = exports.getApplicationStats = exports.semanticSearch = exports.chatWithPool = exports.updateApplicationStatus = exports.getApplications = exports.applyToJob = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const response_2 = require("../utils/response");
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = require("../config/redis");
const aiService = __importStar(require("../services/ai.service"));
const emailService = __importStar(require("../services/email.service"));
const ragService = __importStar(require("../services/rag.service"));
const notificationService = __importStar(require("../services/notification.service"));
const queue_1 = require("../config/queue");
const logger_1 = require("../config/logger");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const application_validator_1 = require("../validators/application.validator");
exports.applyToJob = (0, errors_1.asyncHandler)(async (req, res) => {
    const { body: { jobId, resumeId, coverLetter }, } = (0, validate_middleware_1.parseRequest)(application_validator_1.createApplicationSchema, req);
    const user = req.user;
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { userId: user.userId },
        include: { user: { select: { email: true } } },
    });
    if (!candidate)
        throw new errors_1.AppError('Candidate profile not found', 404);
    const job = await prisma_1.default.job.findUnique({
        where: { id: jobId },
        include: { company: { include: { user: { select: { email: true } } } } },
    });
    if (!job || job.status !== 'ACTIVE')
        throw new errors_1.AppError('Job is not accepting applications', 400);
    const existing = await prisma_1.default.application.findUnique({
        where: { jobId_candidateId: { jobId, candidateId: candidate.id } },
    });
    if (existing)
        throw new errors_1.AppError('Already applied to this job', 409);
    const resume = await prisma_1.default.resume.findFirst({
        where: { id: resumeId, candidateId: candidate.id },
    });
    if (!resume)
        throw new errors_1.AppError('Resume not found', 404);
    const application = await prisma_1.default.application.create({
        data: {
            jobId,
            candidateId: candidate.id,
            resumeId,
            coverLetter,
            status: 'PENDING',
        },
    });
    await (0, queue_1.addScreeningJob)({
        applicationId: application.id,
        resumeId,
        jobId: job.id,
        jobTitle: job.title,
        jobDescription: job.description,
        jobRequirements: job.requirements,
        jobSkills: job.skills,
        candidateFirstName: candidate.firstName,
        candidateLastName: candidate.lastName,
        candidateUserId: candidate.userId,
        companyEmail: job.company.user.email,
        companyName: job.company.name,
        companyUserId: job.company.userId,
    });
    const candidateName = `${candidate.firstName} ${candidate.lastName}`;
    notificationService
        .createNotification(candidate.userId, 'Application Submitted', `Your application for ${job.title} at ${job.company.name} is under review. AI screening will begin shortly.`, 'APPLICATION', { applicationId: application.id, jobId: job.id })
        .catch((e) => logger_1.logger.error('createNotification failed:', e));
    notificationService
        .createNotification(job.company.userId, 'New Application Received', `${candidateName} has applied for ${job.title}. AI screening is in progress.`, 'APPLICATION', { applicationId: application.id, jobId: job.id })
        .catch((e) => logger_1.logger.error('createNotification failed:', e));
    emailService
        .sendApplicationReceivedEmail({
        candidateEmail: candidate.user.email,
        candidateName,
        jobTitle: job.title,
        companyName: job.company.name,
        applicationId: application.id,
    })
        .catch((e) => logger_1.logger.error('sendApplicationReceivedEmail failed:', e));
    emailService
        .sendNewApplicationAlertEmail({
        companyEmail: job.company.user.email,
        companyName: job.company.name,
        candidateName,
        jobTitle: job.title,
        applicationId: application.id,
        appliedAt: application.createdAt.toISOString(),
    })
        .catch((e) => logger_1.logger.error('sendNewApplicationAlertEmail failed:', e));
    await Promise.all([
        redis_1.redis.del(redis_1.RedisKeys.applicationStats(user.userId)),
        redis_1.redis.del(redis_1.RedisKeys.applicationStats(job.company.userId)),
    ]);
    (0, response_1.sendSuccess)(res, 'Application submitted', { id: application.id }, 201);
});
exports.getApplications = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const { page, limit, skip } = (0, response_2.getPaginationParams)(req.query);
    if (user.role === 'CANDIDATE') {
        const candidate = await prisma_1.default.candidate.findUnique({
            where: { userId: user.userId },
        });
        if (!candidate)
            throw new errors_1.AppError('Candidate not found', 404);
        const [apps, total] = await Promise.all([
            prisma_1.default.application.findMany({
                where: { candidateId: candidate.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    job: {
                        include: {
                            company: {
                                select: { name: true, logoUrl: true, location: true },
                            },
                        },
                    },
                },
            }),
            prisma_1.default.application.count({ where: { candidateId: candidate.id } }),
        ]);
        (0, response_1.sendSuccess)(res, 'Applications fetched', apps, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
        return;
    }
    const { jobId, status } = req.query;
    if (!jobId)
        throw new errors_1.AppError('jobId is required', 400);
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const job = await prisma_1.default.job.findFirst({
        where: { id: jobId, companyId: company.id },
    });
    if (!job)
        throw new errors_1.AppError('Job not found', 404);
    if (page === 1 && !status) {
        const cached = await redis_1.redis.get(redis_1.RedisKeys.candidateRanking(jobId));
        if (cached) {
            (0, response_1.sendSuccess)(res, 'Applications fetched (cached)', JSON.parse(cached), 200, (0, response_2.buildPaginationMeta)(0, page, limit));
            return;
        }
    }
    const where = {
        jobId,
        ...(status ? { status: status } : {}),
    };
    const [apps, total] = await Promise.all([
        prisma_1.default.application.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ aiScore: 'desc' }, { createdAt: 'asc' }],
            include: {
                candidate: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        skills: true,
                        linkedinUrl: true,
                        location: true,
                    },
                },
                resume: { select: { id: true, fileName: true, fileUrl: true } },
            },
        }),
        prisma_1.default.application.count({ where }),
    ]);
    if (page === 1 && !status) {
        await redis_1.redis.set(redis_1.RedisKeys.candidateRanking(jobId), JSON.stringify(apps), 'EX', redis_1.REDIS_TTL.RANKING_CACHE);
    }
    (0, response_1.sendSuccess)(res, 'Applications fetched', apps, 200, (0, response_2.buildPaginationMeta)(total, page, limit));
});
exports.updateApplicationStatus = (0, errors_1.asyncHandler)(async (req, res) => {
    const { body: { status }, params, } = (0, validate_middleware_1.parseRequest)(application_validator_1.updateApplicationStatusSchema, req);
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const application = await prisma_1.default.application.findFirst({
        where: { id: params.id, job: { companyId: company.id } },
        include: {
            candidate: { include: { user: { select: { email: true } } } },
            job: true,
        },
    });
    if (!application)
        throw new errors_1.AppError('Application not found', 404);
    const updated = await prisma_1.default.application.update({
        where: { id: params.id },
        data: { status },
    });
    await Promise.all([
        redis_1.redis.del(redis_1.RedisKeys.candidateRanking(application.jobId)),
        redis_1.redis.del(redis_1.RedisKeys.applicationStats(user.userId)),
        redis_1.redis.del(redis_1.RedisKeys.applicationStats(application.candidate.userId)),
    ]);
    const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`;
    const candidateEmail = application.candidate.user.email;
    const candidateUserId = application.candidate.userId;
    if (status === 'SHORTLISTED' || status === 'REJECTED') {
        const emailType = status === 'SHORTLISTED' ? 'shortlisted' : 'rejected';
        const { subject, body } = await aiService.generatePersonalizedEmail(emailType, candidateName, application.job.title, company.name, application.aiSummary || undefined);
        await (0, queue_1.addEmailJob)({
            to: candidateEmail,
            subject,
            body,
            applicationId: application.id,
            type: emailType,
        });
    }
    const notifMap = {
        SHORTLISTED: {
            title: "🎉 You've been shortlisted!",
            body: `Congratulations! Your application for ${application.job.title} at ${company.name} has been shortlisted.`,
        },
        REJECTED: {
            title: 'Application Update',
            body: `We're sorry to inform you that your application for ${application.job.title} at ${company.name} was not successful this time.`,
        },
        HIRED: {
            title: "🎉 You're Hired!",
            body: `Congratulations! ${company.name} has selected you for the ${application.job.title} position. They will be in touch soon.`,
        },
        SCREENING: {
            title: 'Application Under Review',
            body: `Your application for ${application.job.title} at ${company.name} is being screened by our AI system.`,
        },
    };
    const notif = notifMap[status];
    if (notif) {
        notificationService
            .createNotification(candidateUserId, notif.title, notif.body, 'APPLICATION', { applicationId: application.id, jobId: application.jobId, status })
            .catch((e) => logger_1.logger.error('createNotification failed:', e));
    }
    (0, response_1.sendSuccess)(res, 'Status updated', updated);
});
exports.chatWithPool = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const { jobId, query } = req.body;
    if (!jobId || !query)
        throw new errors_1.AppError('jobId and query are required', 400);
    const job = await prisma_1.default.job.findFirst({
        where: { id: jobId, companyId: company.id },
    });
    if (!job)
        throw new errors_1.AppError('Job not found', 404);
    const answer = await ragService.ragCandidateQuery(query, jobId);
    (0, response_1.sendSuccess)(res, 'AI response', { answer, jobId, query });
});
exports.semanticSearch = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const { jobId } = req.params;
    const job = await prisma_1.default.job.findFirst({
        where: { id: jobId, companyId: company.id },
    });
    if (!job)
        throw new errors_1.AppError('Job not found', 404);
    const results = await ragService.semanticCandidateSearch(job.description, job.skills, jobId);
    const enriched = await Promise.all(results.map(async (r) => {
        const candidate = await prisma_1.default.candidate.findUnique({
            where: { id: r.candidateId },
            select: {
                firstName: true,
                lastName: true,
                skills: true,
                avatarUrl: true,
                location: true,
            },
        });
        return { ...r, candidate };
    }));
    (0, response_1.sendSuccess)(res, 'Semantic search results', enriched);
});
exports.getApplicationStats = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const cacheKey = redis_1.RedisKeys.applicationStats(user.userId);
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Stats fetched', JSON.parse(cached));
        return;
    }
    if (user.role === 'COMPANY') {
        const company = await prisma_1.default.company.findUnique({
            where: { userId: user.userId },
        });
        if (!company)
            throw new errors_1.AppError('Company not found', 404);
        const where = { job: { companyId: company.id } };
        const [total, pending, screening, shortlisted, rejected, hired] = await Promise.all([
            prisma_1.default.application.count({ where }),
            prisma_1.default.application.count({ where: { ...where, status: 'PENDING' } }),
            prisma_1.default.application.count({
                where: { ...where, status: 'SCREENING' },
            }),
            prisma_1.default.application.count({
                where: { ...where, status: 'SHORTLISTED' },
            }),
            prisma_1.default.application.count({ where: { ...where, status: 'REJECTED' } }),
            prisma_1.default.application.count({ where: { ...where, status: 'HIRED' } }),
        ]);
        const result = {
            total,
            pending,
            screening,
            shortlisted,
            rejected,
            hired,
        };
        await redis_1.redis.set(cacheKey, JSON.stringify(result), 'EX', redis_1.REDIS_TTL.APP_STATS);
        (0, response_1.sendSuccess)(res, 'Stats fetched', result);
        return;
    }
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { userId: user.userId },
    });
    if (!candidate)
        throw new errors_1.AppError('Candidate not found', 404);
    const where = { candidateId: candidate.id };
    const [total, pending, shortlisted, rejected, hired] = await Promise.all([
        prisma_1.default.application.count({ where }),
        prisma_1.default.application.count({ where: { ...where, status: 'PENDING' } }),
        prisma_1.default.application.count({ where: { ...where, status: 'SHORTLISTED' } }),
        prisma_1.default.application.count({ where: { ...where, status: 'REJECTED' } }),
        prisma_1.default.application.count({ where: { ...where, status: 'HIRED' } }),
    ]);
    const result = { total, pending, shortlisted, rejected, hired };
    await redis_1.redis.set(cacheKey, JSON.stringify(result), 'EX', redis_1.REDIS_TTL.APP_STATS);
    (0, response_1.sendSuccess)(res, 'Stats fetched', result);
});
exports.aiJobSearch = (0, errors_1.asyncHandler)(async (req, res) => {
    const { query, jobs } = req.body;
    if (!query || !Array.isArray(jobs))
        throw new errors_1.AppError('query and jobs are required', 400);
    const { aiJobSearch: searchFn } = await Promise.resolve().then(() => __importStar(require('../services/ai.service')));
    const results = await searchFn(query, jobs);
    (0, response_1.sendSuccess)(res, 'AI search results', results);
});
//# sourceMappingURL=application.controller.js.map