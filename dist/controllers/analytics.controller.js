"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyAnalytics = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = require("../config/redis");
exports.getCompanyAnalytics = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const cacheKey = redis_1.RedisKeys.analyticsCache(company.id);
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Analytics fetched', JSON.parse(cached));
        return;
    }
    const companyId = company.id;
    const [totalJobs, activeJobs, totalApplications, pendingApps, screeningApps, shortlistedApps, rejectedApps, hiredApps,] = await Promise.all([
        prisma_1.default.job.count({ where: { companyId } }),
        prisma_1.default.job.count({ where: { companyId, status: 'ACTIVE' } }),
        prisma_1.default.application.count({ where: { job: { companyId } } }),
        prisma_1.default.application.count({
            where: { job: { companyId }, status: 'PENDING' },
        }),
        prisma_1.default.application.count({
            where: { job: { companyId }, status: 'SCREENING' },
        }),
        prisma_1.default.application.count({
            where: { job: { companyId }, status: 'SHORTLISTED' },
        }),
        prisma_1.default.application.count({
            where: { job: { companyId }, status: 'REJECTED' },
        }),
        prisma_1.default.application.count({
            where: { job: { companyId }, status: 'HIRED' },
        }),
    ]);
    const jobsWithCounts = await prisma_1.default.job.findMany({
        where: { companyId },
        select: {
            title: true,
            _count: { select: { applications: true } },
            status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 7,
    });
    const applicationsByJob = jobsWithCounts.map((j) => ({
        name: j.title.length > 20 ? j.title.slice(0, 20) + '...' : j.title,
        applications: j._count.applications,
        status: j.status,
    }));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentApps = await prisma_1.default.application.findMany({
        where: { job: { companyId }, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
    });
    const dateMap = {};
    recentApps.forEach((app) => {
        const date = app.createdAt.toISOString().split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
    });
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        });
        last14Days.push({ date: label, applications: dateMap[dateStr] || 0 });
    }
    const avgScorePerJob = await prisma_1.default.job.findMany({
        where: { companyId, applications: { some: { aiScore: { not: null } } } },
        select: {
            title: true,
            applications: {
                where: { aiScore: { not: null } },
                select: { aiScore: true },
            },
        },
        take: 6,
    });
    const aiScoreByJob = avgScorePerJob.map((j) => ({
        name: j.title.length > 18 ? j.title.slice(0, 18) + '...' : j.title,
        avgScore: j.applications.length
            ? Math.round(j.applications.reduce((sum, a) => sum + (a.aiScore || 0), 0) /
                j.applications.length)
            : 0,
    }));
    const funnel = [
        { stage: 'Applied', count: totalApplications, fill: '#3b82f6' },
        {
            stage: 'Screened',
            count: screeningApps + shortlistedApps + rejectedApps + hiredApps,
            fill: '#2563eb',
        },
        {
            stage: 'Shortlisted',
            count: shortlistedApps + hiredApps,
            fill: '#22c55e',
        },
        { stage: 'Hired', count: hiredApps, fill: '#16a34a' },
    ];
    const jobSkills = await prisma_1.default.job.findMany({
        where: { companyId },
        select: { skills: true },
    });
    const skillCount = {};
    jobSkills.forEach((j) => j.skills.forEach((s) => {
        skillCount[s] = (skillCount[s] || 0) + 1;
    }));
    const topSkills = Object.entries(skillCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([skill, count]) => ({ skill, count }));
    const result = {
        overview: {
            totalJobs,
            activeJobs,
            totalApplications,
            pendingApps,
            screeningApps,
            shortlistedApps,
            rejectedApps,
            hiredApps,
            hireRate: totalApplications
                ? Math.round((hiredApps / totalApplications) * 100)
                : 0,
        },
        applicationsByJob,
        applicationsOverTime: last14Days,
        aiScoreByJob,
        funnel,
        topSkills,
    };
    await redis_1.redis.set(cacheKey, JSON.stringify(result), 'EX', redis_1.REDIS_TTL.ANALYTICS);
    (0, response_1.sendSuccess)(res, 'Analytics fetched', result);
});
//# sourceMappingURL=analytics.controller.js.map