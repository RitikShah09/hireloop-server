import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/prisma';
import { redis, RedisKeys, REDIS_TTL } from '../config/redis';

export const getCompanyAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    });
    if (!company) throw new AppError('Company not found', 404);

    const cacheKey = RedisKeys.analyticsCache(company.id);
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Analytics fetched', JSON.parse(cached));
      return;
    }

    const companyId = company.id;

    const [
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApps,
      screeningApps,
      shortlistedApps,
      rejectedApps,
      hiredApps,
    ] = await Promise.all([
      prisma.job.count({ where: { companyId } }),
      prisma.job.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.application.count({ where: { job: { companyId } } }),
      prisma.application.count({
        where: { job: { companyId }, status: 'PENDING' },
      }),
      prisma.application.count({
        where: { job: { companyId }, status: 'SCREENING' },
      }),
      prisma.application.count({
        where: { job: { companyId }, status: 'SHORTLISTED' },
      }),
      prisma.application.count({
        where: { job: { companyId }, status: 'REJECTED' },
      }),
      prisma.application.count({
        where: { job: { companyId }, status: 'HIRED' },
      }),
    ]);

    const jobsWithCounts = await prisma.job.findMany({
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
    const recentApps = await prisma.application.findMany({
      where: { job: { companyId }, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dateMap: Record<string, number> = {};
    recentApps.forEach((app) => {
      const date = app.createdAt.toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + 1;
    });

    const last14Days: { date: string; applications: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
      last14Days.push({ date: label, applications: dateMap[dateStr] || 0 });
    }

    const avgScorePerJob = await prisma.job.findMany({
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
        ? Math.round(
            j.applications.reduce((sum, a) => sum + (a.aiScore || 0), 0) /
              j.applications.length
          )
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

    const jobSkills = await prisma.job.findMany({
      where: { companyId },
      select: { skills: true },
    });
    const skillCount: Record<string, number> = {};
    jobSkills.forEach((j) =>
      j.skills.forEach((s) => {
        skillCount[s] = (skillCount[s] || 0) + 1;
      })
    );
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

    await redis.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      REDIS_TTL.ANALYTICS
    );
    sendSuccess(res, 'Analytics fetched', result);
  }
);
