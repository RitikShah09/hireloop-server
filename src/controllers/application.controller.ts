import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { getPaginationParams, buildPaginationMeta } from '../utils/response';
import prisma from '../config/prisma';
import { redis, RedisKeys, REDIS_TTL } from '../config/redis';
import * as aiService from '../services/ai.service';
import * as emailService from '../services/email.service';
import * as ragService from '../services/rag.service';
import * as notificationService from '../services/notification.service';
import { addScreeningJob, addEmailJob } from '../config/queue';
import { logger } from '../config/logger';
import { parseRequest } from '../middlewares/validate.middleware';
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
} from '../validators/application.validator';
import { ApplicationStatus } from '@prisma/client';

export const applyToJob = asyncHandler(async (req: Request, res: Response) => {
  const {
    body: { jobId, resumeId, coverLetter },
  } = parseRequest(createApplicationSchema, req);
  const user = (req as AuthenticatedRequest).user;
  const candidate = await prisma.candidate.findUnique({
    where: { userId: user.userId },
    include: { user: { select: { email: true } } },
  });
  if (!candidate) throw new AppError('Candidate profile not found', 404);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: { include: { user: { select: { email: true } } } } },
  });
  if (!job || job.status !== 'ACTIVE')
    throw new AppError('Job is not accepting applications', 400);

  const existing = await prisma.application.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: candidate.id } },
  });
  if (existing) throw new AppError('Already applied to this job', 409);

  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, candidateId: candidate.id },
  });
  if (!resume) throw new AppError('Resume not found', 404);

  const application = await prisma.application.create({
    data: {
      jobId,
      candidateId: candidate.id,
      resumeId,
      coverLetter,
      status: 'PENDING',
    },
  });

  await addScreeningJob({
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
    .createNotification(
      candidate.userId,
      'Application Submitted',
      `Your application for ${job.title} at ${job.company.name} is under review. AI screening will begin shortly.`,
      'APPLICATION',
      { applicationId: application.id, jobId: job.id }
    )
    .catch((e) => logger.error('createNotification failed:', e));

  notificationService
    .createNotification(
      job.company.userId,
      'New Application Received',
      `${candidateName} has applied for ${job.title}. AI screening is in progress.`,
      'APPLICATION',
      { applicationId: application.id, jobId: job.id }
    )
    .catch((e) => logger.error('createNotification failed:', e));

  emailService
    .sendApplicationReceivedEmail({
      candidateEmail: candidate.user.email,
      candidateName,
      jobTitle: job.title,
      companyName: job.company.name,
      applicationId: application.id,
    })
    .catch((e) => logger.error('sendApplicationReceivedEmail failed:', e));

  emailService
    .sendNewApplicationAlertEmail({
      companyEmail: job.company.user.email,
      companyName: job.company.name,
      candidateName,
      jobTitle: job.title,
      applicationId: application.id,
      appliedAt: application.createdAt.toISOString(),
    })
    .catch((e) => logger.error('sendNewApplicationAlertEmail failed:', e));

  await Promise.all([
    redis.del(RedisKeys.applicationStats(user.userId)),
    redis.del(RedisKeys.applicationStats(job.company.userId)),
  ]);

  sendSuccess(res, 'Application submitted', { id: application.id }, 201);
});

export const getApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string }
    );

    if (user.role === 'CANDIDATE') {
      const candidate = await prisma.candidate.findUnique({
        where: { userId: user.userId },
      });
      if (!candidate) throw new AppError('Candidate not found', 404);

      const [apps, total] = await Promise.all([
        prisma.application.findMany({
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
        prisma.application.count({ where: { candidateId: candidate.id } }),
      ]);

      sendSuccess(
        res,
        'Applications fetched',
        apps,
        200,
        buildPaginationMeta(total, page, limit)
      );
      return;
    }

    const { jobId, status } = req.query as { jobId?: string; status?: string };
    if (!jobId) throw new AppError('jobId is required', 400);

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    });
    if (!company) throw new AppError('Company not found', 404);

    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId: company.id },
    });
    if (!job) throw new AppError('Job not found', 404);

    if (page === 1 && !status) {
      const cached = await redis.get(RedisKeys.candidateRanking(jobId));
      if (cached) {
        sendSuccess(
          res,
          'Applications fetched (cached)',
          JSON.parse(cached),
          200,
          buildPaginationMeta(0, page, limit)
        );
        return;
      }
    }

    const where = {
      jobId,
      ...(status ? { status: status as ApplicationStatus } : {}),
    };

    const [apps, total] = await Promise.all([
      prisma.application.findMany({
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
      prisma.application.count({ where }),
    ]);

    if (page === 1 && !status) {
      await redis.set(
        RedisKeys.candidateRanking(jobId),
        JSON.stringify(apps),
        'EX',
        REDIS_TTL.RANKING_CACHE
      );
    }

    sendSuccess(
      res,
      'Applications fetched',
      apps,
      200,
      buildPaginationMeta(total, page, limit)
    );
  }
);

export const updateApplicationStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      body: { status },
      params,
    } = parseRequest(updateApplicationStatusSchema, req);
    const user = (req as AuthenticatedRequest).user;
    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    });
    if (!company) throw new AppError('Company not found', 404);

    const application = await prisma.application.findFirst({
      where: { id: params.id, job: { companyId: company.id } },
      include: {
        candidate: { include: { user: { select: { email: true } } } },
        job: true,
      },
    });
    if (!application) throw new AppError('Application not found', 404);
    const updated = await prisma.application.update({
      where: { id: params.id },
      data: { status },
    });

    await Promise.all([
      redis.del(RedisKeys.candidateRanking(application.jobId)),
      redis.del(RedisKeys.applicationStats(user.userId)),
      redis.del(RedisKeys.applicationStats(application.candidate.userId)),
    ]);

    const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`;
    const candidateEmail = application.candidate.user.email;
    const candidateUserId = application.candidate.userId;

    if (status === 'SHORTLISTED' || status === 'REJECTED') {
      const emailType = status === 'SHORTLISTED' ? 'shortlisted' : 'rejected';
      const { subject, body } = await aiService.generatePersonalizedEmail(
        emailType,
        candidateName,
        application.job.title,
        company.name,
        application.aiSummary || undefined
      );

      await addEmailJob({
        to: candidateEmail,
        subject,
        body,
        applicationId: application.id,
        type: emailType,
      });
    }

    const notifMap: Record<string, { title: string; body: string }> = {
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
        .createNotification(
          candidateUserId,
          notif.title,
          notif.body,
          'APPLICATION',
          { applicationId: application.id, jobId: application.jobId, status }
        )
        .catch((e) => logger.error('createNotification failed:', e));
    }

    sendSuccess(res, 'Status updated', updated);
  }
);

export const chatWithPool = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    });
    if (!company) throw new AppError('Company not found', 404);

    const { jobId, query } = req.body;
    if (!jobId || !query)
      throw new AppError('jobId and query are required', 400);

    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId: company.id },
    });
    if (!job) throw new AppError('Job not found', 404);

    const answer = await ragService.ragCandidateQuery(query, jobId);
    sendSuccess(res, 'AI response', { answer, jobId, query });
  }
);

export const semanticSearch = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    });
    if (!company) throw new AppError('Company not found', 404);

    const { jobId } = req.params;
    const job = await prisma.job.findFirst({
      where: { id: jobId as string, companyId: company.id },
    });
    if (!job) throw new AppError('Job not found', 404);

    const results = await ragService.semanticCandidateSearch(
      job.description,
      job.skills,
      jobId as string
    );

    const enriched = await Promise.all(
      results.map(async (r) => {
        const candidate = await prisma.candidate.findUnique({
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
      })
    );

    sendSuccess(res, 'Semantic search results', enriched);
  }
);

export const getApplicationStats = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;

    const cacheKey = RedisKeys.applicationStats(user.userId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Stats fetched', JSON.parse(cached));
      return;
    }

    if (user.role === 'COMPANY') {
      const company = await prisma.company.findUnique({
        where: { userId: user.userId },
      });
      if (!company) throw new AppError('Company not found', 404);

      const where = { job: { companyId: company.id } };
      const [total, pending, screening, shortlisted, rejected, hired] =
        await Promise.all([
          prisma.application.count({ where }),
          prisma.application.count({ where: { ...where, status: 'PENDING' } }),
          prisma.application.count({
            where: { ...where, status: 'SCREENING' },
          }),
          prisma.application.count({
            where: { ...where, status: 'SHORTLISTED' },
          }),
          prisma.application.count({ where: { ...where, status: 'REJECTED' } }),
          prisma.application.count({ where: { ...where, status: 'HIRED' } }),
        ]);

      const result = {
        total,
        pending,
        screening,
        shortlisted,
        rejected,
        hired,
      };
      await redis.set(
        cacheKey,
        JSON.stringify(result),
        'EX',
        REDIS_TTL.APP_STATS
      );
      sendSuccess(res, 'Stats fetched', result);
      return;
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate) throw new AppError('Candidate not found', 404);

    const where = { candidateId: candidate.id };
    const [total, pending, shortlisted, rejected, hired] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.count({ where: { ...where, status: 'PENDING' } }),
      prisma.application.count({ where: { ...where, status: 'SHORTLISTED' } }),
      prisma.application.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.application.count({ where: { ...where, status: 'HIRED' } }),
    ]);

    const result = { total, pending, shortlisted, rejected, hired };
    await redis.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      REDIS_TTL.APP_STATS
    );
    sendSuccess(res, 'Stats fetched', result);
  }
);

export const aiJobSearch = asyncHandler(async (req: Request, res: Response) => {
  const { query, jobs } = req.body;
  if (!query || !Array.isArray(jobs))
    throw new AppError('query and jobs are required', 400);

  const { aiJobSearch: searchFn } = await import('../services/ai.service');
  const results = await searchFn(query, jobs);
  sendSuccess(res, 'AI search results', results);
});
