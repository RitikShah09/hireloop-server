import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { getPaginationParams, buildPaginationMeta } from '../utils/response';
import prisma from '../config/prisma';
import { redis, RedisKeys, REDIS_TTL } from '../config/redis';

const paramKey = (obj: Record<string, unknown>): string =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
    )
  );

export const searchCandidates = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string }
    );
    const { search, skills, location } = req.query as Record<string, string>;

    const cacheKey = RedisKeys.searchCache(
      'candidates',
      paramKey({ page, limit, search, skills, location })
    );
    const cached = await redis.get(cacheKey);
    if (cached) {
      const { candidates, total } = JSON.parse(cached);
      sendSuccess(
        res,
        'Candidates fetched',
        candidates,
        200,
        buildPaginationMeta(total, page, limit)
      );
      return;
    }

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (skills)
      where.skills = { hasSome: skills.split(',').map((s) => s.trim()) };
    if (location) where.location = { contains: location, mode: 'insensitive' };

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
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
      prisma.candidate.count({ where }),
    ]);

    await redis.set(
      cacheKey,
      JSON.stringify({ candidates, total }),
      'EX',
      REDIS_TTL.SEARCH
    );
    sendSuccess(
      res,
      'Candidates fetched',
      candidates,
      200,
      buildPaginationMeta(total, page, limit)
    );
  }
);

export const getCandidateById = asyncHandler(
  async (req: Request, res: Response) => {
    const candidate = await prisma.candidate.findUnique({
      where: { id: req.params.id as string },
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
    if (!candidate) throw new AppError('Candidate not found', 404);
    sendSuccess(res, 'Candidate fetched', candidate);
  }
);

export const searchCompanies = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string }
    );
    const { search, industry, location } = req.query as Record<string, string>;

    const cacheKey = RedisKeys.searchCache(
      'companies',
      paramKey({ page, limit, search, industry, location })
    );
    const cached = await redis.get(cacheKey);
    if (cached) {
      const { companies, total } = JSON.parse(cached);
      sendSuccess(
        res,
        'Companies fetched',
        companies,
        200,
        buildPaginationMeta(total, page, limit)
      );
      return;
    }

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (industry) where.industry = { contains: industry, mode: 'insensitive' };
    if (location) where.location = { contains: location, mode: 'insensitive' };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
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
      prisma.company.count({ where }),
    ]);

    await redis.set(
      cacheKey,
      JSON.stringify({ companies, total }),
      'EX',
      REDIS_TTL.SEARCH
    );
    sendSuccess(
      res,
      'Companies fetched',
      companies,
      200,
      buildPaginationMeta(total, page, limit)
    );
  }
);

export const getCompanyById = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string }
    );
    const companyId = req.params.id as string;

    const company = await prisma.company.findUnique({
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
    if (!company) throw new AppError('Company not found', 404);

    const [jobs, totalJobs] = await Promise.all([
      prisma.job.findMany({
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
      prisma.job.count({ where: { companyId, status: 'ACTIVE' } }),
    ]);

    sendSuccess(res, 'Company fetched', {
      company,
      jobs,
      jobsMeta: buildPaginationMeta(totalJobs, page, limit),
    });
  }
);
