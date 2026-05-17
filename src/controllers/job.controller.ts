import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { getPaginationParams, buildPaginationMeta } from '../utils/response';
import { generateSlug } from '../utils/slug';
import prisma from '../config/prisma';
import { redis, RedisKeys, REDIS_TTL, delByPattern } from '../config/redis';
import { JobStatus } from '@prisma/client';
import { parseRequest } from '../middlewares/validate.middleware';
import {
  createJobSchema,
  updateJobSchema,
  jobQuerySchema,
} from '../validators/job.validator';

const paramKey = (obj: Record<string, unknown>): string =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
    )
  );

const invalidateJobCaches = async (
  companyId: string,
  jobId?: string,
  slug?: string
) => {
  await Promise.all([
    delByPattern('cache:jobs:list:*'),
    delByPattern(`cache:jobs:mine:${companyId}:*`),
    jobId ? redis.del(RedisKeys.jobCache(jobId)) : Promise.resolve(),
    slug ? redis.del(RedisKeys.jobSlugCache(slug)) : Promise.resolve(),
  ]);
};

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const { body } = parseRequest(createJobSchema, req);
  const user = (req as AuthenticatedRequest).user;
  const company = await prisma.company.findUnique({
    where: { userId: user.userId },
  });
  if (!company) throw new AppError('Company profile not found', 404);

  const job = await prisma.job.create({
    data: {
      ...body,
      companyId: company.id,
      shareableSlug: generateSlug(body.title),
    },
  });

  await invalidateJobCaches(company.id);
  sendSuccess(res, 'Job created', job, 201);
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const { body, params } = parseRequest(updateJobSchema, req);
  const user = (req as AuthenticatedRequest).user;
  const company = await prisma.company.findUnique({
    where: { userId: user.userId },
  });
  if (!company) throw new AppError('Company not found', 404);

  const job = await prisma.job.findFirst({
    where: { id: params.id, companyId: company.id },
  });
  if (!job) throw new AppError('Job not found', 404);

  const updated = await prisma.job.update({
    where: { id: params.id },
    data: { ...body },
  });

  await invalidateJobCaches(company.id, params.id, job.shareableSlug);
  sendSuccess(res, 'Job updated', updated);
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const company = await prisma.company.findUnique({
    where: { userId: user.userId },
  });
  if (!company) throw new AppError('Company not found', 404);

  const job = await prisma.job.findFirst({
    where: { id: req.params.id as string, companyId: company.id },
  });
  if (!job) throw new AppError('Job not found', 404);

  await prisma.job.delete({ where: { id: req.params.id as string } });
  await invalidateJobCaches(
    company.id,
    req.params.id as string,
    job.shareableSlug
  );
  sendSuccess(res, 'Job deleted');
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = RedisKeys.jobCache(req.params.id as string);
  const cached = await redis.get(cacheKey);
  if (cached) {
    sendSuccess(res, 'Job fetched', JSON.parse(cached));
    return;
  }

  const job = await prisma.job.findUnique({
    where: { id: req.params.id as string },
    include: {
      company: {
        select: { name: true, logoUrl: true, location: true, industry: true },
      },
    },
  });
  if (!job) throw new AppError('Job not found', 404);

  await redis.set(cacheKey, JSON.stringify(job), 'EX', REDIS_TTL.JOB_CACHE);
  sendSuccess(res, 'Job fetched', job);
});

export const getJobBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const cacheKey = RedisKeys.jobSlugCache(slug);
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Job fetched', JSON.parse(cached));
      return;
    }

    const job = await prisma.job.findUnique({
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
      throw new AppError('Job not found or not active', 404);

    await redis.set(cacheKey, JSON.stringify(job), 'EX', REDIS_TTL.JOB_CACHE);
    sendSuccess(res, 'Job fetched', job);
  }
);

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const {
    query: { page: pageStr, limit: limitStr, search, skills, isRemote, status },
  } = parseRequest(jobQuerySchema, req);
  const { page, limit, skip } = getPaginationParams({
    page: pageStr,
    limit: limitStr,
  });

  const cacheKey = RedisKeys.jobListCache(
    paramKey({ page, limit, search, skills, isRemote, status })
  );
  const cached = await redis.get(cacheKey);
  if (cached) {
    const { jobs, total } = JSON.parse(cached);
    sendSuccess(
      res,
      'Jobs fetched',
      jobs,
      200,
      buildPaginationMeta(total, page, limit)
    );
    return;
  }

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (skills)
    where.skills = { hasSome: skills.split(',').map((s) => s.trim()) };
  if (isRemote !== undefined) where.isRemote = isRemote === 'true';
  if (status) where.status = status as JobStatus;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { name: true, logoUrl: true, location: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  await redis.set(
    cacheKey,
    JSON.stringify({ jobs, total }),
    'EX',
    REDIS_TTL.JOB_LIST
  );
  sendSuccess(
    res,
    'Jobs fetched',
    jobs,
    200,
    buildPaginationMeta(total, page, limit)
  );
});

export const getCompanyJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string }
    );

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    });
    if (!company) throw new AppError('Company not found', 404);

    const cacheKey = RedisKeys.companyJobsCache(
      company.id,
      paramKey({ page, limit })
    );
    const cached = await redis.get(cacheKey);
    if (cached) {
      const { jobs, total } = JSON.parse(cached);
      sendSuccess(
        res,
        'Company jobs fetched',
        jobs,
        200,
        buildPaginationMeta(total, page, limit)
      );
      return;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { companyId: company.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { applications: true } } },
      }),
      prisma.job.count({ where: { companyId: company.id } }),
    ]);

    await redis.set(
      cacheKey,
      JSON.stringify({ jobs, total }),
      'EX',
      REDIS_TTL.JOB_LIST
    );
    sendSuccess(
      res,
      'Company jobs fetched',
      jobs,
      200,
      buildPaginationMeta(total, page, limit)
    );
  }
);
