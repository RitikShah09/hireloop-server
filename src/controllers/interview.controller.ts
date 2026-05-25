import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { getPaginationParams, buildPaginationMeta } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/prisma';
import { logger } from '../config/logger';
import { redis, RedisKeys, REDIS_TTL } from '../config/redis';
import * as notificationService from '../services/notification.service';
import { sendInterviewEmail } from '../services/email.service';

export const scheduleInterview = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    });
    if (!company) throw new AppError('Company not found', 404);

    const {
      applicationId,
      scheduledAt,
      durationMins = 60,
      mode = 'video',
      meetLink,
      notes,
    } = req.body;
    if (!applicationId || !scheduledAt)
      throw new AppError('applicationId and scheduledAt are required', 400);

    const application = await prisma.application.findFirst({
      where: { id: applicationId, job: { companyId: company.id } },
      include: {
        job: true,
        candidate: { include: { user: { select: { email: true } } } },
      },
    });
    if (!application) throw new AppError('Application not found', 404);

    const interview = await prisma.interview.create({
      data: {
        applicationId,
        scheduledAt: new Date(scheduledAt),
        durationMins,
        mode,
        meetLink,
        notes,
        status: 'PENDING',
      },
    });

    await Promise.all([
      redis.del(RedisKeys.interviewsCache(user.userId)),
      redis.del(RedisKeys.interviewsCache(application.candidate.userId)),
    ]);

    const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`;
    const dateStr = new Date(scheduledAt).toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });

    await sendInterviewEmail({
      to: application.candidate.user.email,
      candidateName,
      jobTitle: application.job.title,
      companyName: company.name,
      scheduledAt: new Date(scheduledAt),
      durationMins,
      mode,
      meetLink,
      notes,
      status: 'scheduled',
    });

    notificationService
      .createNotification(
        application.candidate.userId,
        '📅 Interview Scheduled',
        `${company.name} has scheduled an interview for ${application.job.title} on ${dateStr} IST (${durationMins} min, ${mode.replace('_', ' ')}).`,
        'INTERVIEW',
        { interviewId: interview.id, applicationId, jobId: application.jobId }
      )
      .catch((e) =>
        logger.error('createNotification (interview scheduled) failed:', e)
      );

    sendSuccess(
      res,
      'Interview scheduled and candidate notified',
      interview,
      201
    );
  }
);

export const getInterviews = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string }
    );

    const cacheKey = page === 1 ? RedisKeys.interviewsCache(user.userId) : null;
    if (cacheKey) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const { interviews, total } = JSON.parse(cached);
        sendSuccess(
          res,
          'Interviews fetched',
          interviews,
          200,
          buildPaginationMeta(total, page, limit)
        );
        return;
      }
    }

    if (user.role === 'COMPANY') {
      const company = await prisma.company.findUnique({
        where: { userId: user.userId },
      });
      if (!company) throw new AppError('Company not found', 404);

      const where = { application: { job: { companyId: company.id } } };
      const [interviews, total] = await Promise.all([
        prisma.interview.findMany({
          where,
          skip,
          take: limit,
          orderBy: { scheduledAt: 'asc' },
          include: {
            application: {
              include: {
                job: { select: { title: true } },
                candidate: {
                  select: { firstName: true, lastName: true, avatarUrl: true },
                },
              },
            },
          },
        }),
        prisma.interview.count({ where }),
      ]);

      if (cacheKey) {
        await redis.set(
          cacheKey,
          JSON.stringify({ interviews, total }),
          'EX',
          REDIS_TTL.INTERVIEWS
        );
      }
      sendSuccess(
        res,
        'Interviews fetched',
        interviews,
        200,
        buildPaginationMeta(total, page, limit)
      );
      return;
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate) throw new AppError('Candidate not found', 404);

    const where = { application: { candidateId: candidate.id } };
    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          application: {
            include: {
              job: {
                include: { company: { select: { name: true, logoUrl: true } } },
              },
            },
          },
        },
      }),
      prisma.interview.count({ where }),
    ]);

    if (cacheKey) {
      await redis.set(
        cacheKey,
        JSON.stringify({ interviews, total }),
        'EX',
        REDIS_TTL.INTERVIEWS
      );
    }
    sendSuccess(
      res,
      'Interviews fetched',
      interviews,
      200,
      buildPaginationMeta(total, page, limit)
    );
  }
);

export const updateInterview = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    });
    if (!company) throw new AppError('Company not found', 404);

    const interview = await prisma.interview.findFirst({
      where: {
        id: req.params.id as string,
        application: { job: { companyId: company.id } },
      },
      include: {
        application: {
          include: {
            job: true,
            candidate: { include: { user: { select: { email: true } } } },
          },
        },
      },
    });
    if (!interview) throw new AppError('Interview not found', 404);

    const { scheduledAt, durationMins, mode, meetLink, notes, status } =
      req.body;

    const updated = await prisma.interview.update({
      where: { id: req.params.id as string },
      data: {
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(durationMins && { durationMins }),
        ...(mode && { mode }),
        ...(meetLink !== undefined && { meetLink }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
    });

    await Promise.all([
      redis.del(RedisKeys.interviewsCache(user.userId)),
      redis.del(
        RedisKeys.interviewsCache(interview.application.candidate.userId)
      ),
    ]);

    const isCancelled = status === 'CANCELLED';
    const isRescheduled = !isCancelled && !!scheduledAt;

    if (isCancelled || isRescheduled) {
      const interviewStatus = isCancelled ? 'cancelled' : 'rescheduled';
      const candidateName = `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`;
      const newDate = scheduledAt
        ? new Date(scheduledAt)
        : interview.scheduledAt;
      const dateStr = newDate.toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      });

      await sendInterviewEmail({
        to: interview.application.candidate.user.email,
        candidateName,
        jobTitle: interview.application.job.title,
        companyName: company.name,
        scheduledAt: newDate,
        durationMins: durationMins || interview.durationMins,
        mode: mode || interview.mode,
        meetLink: meetLink || interview.meetLink || undefined,
        notes: notes || interview.notes || undefined,
        status: interviewStatus,
      });

      const notifTitle = isCancelled
        ? '❌ Interview Cancelled'
        : '📅 Interview Rescheduled';
      const notifBody = isCancelled
        ? `Your interview for ${interview.application.job.title} at ${company.name} has been cancelled.`
        : `Your interview for ${interview.application.job.title} at ${company.name} has been rescheduled to ${dateStr} IST.`;

      notificationService
        .createNotification(
          interview.application.candidate.userId,
          notifTitle,
          notifBody,
          'INTERVIEW',
          { interviewId: interview.id, applicationId: interview.applicationId }
        )
        .catch((e) =>
          logger.error('createNotification (interview update) failed:', e)
        );
    }

    sendSuccess(res, 'Interview updated', updated);
  }
);

export const respondToInterview = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate) throw new AppError('Candidate not found', 404);

    const { status } = req.body;
    if (!['ACCEPTED', 'REJECTED'].includes(status))
      throw new AppError('Status must be ACCEPTED or REJECTED', 400);

    const interview = await prisma.interview.findFirst({
      where: {
        id: req.params.id as string,
        application: { candidateId: candidate.id },
      },
      include: {
        application: {
          include: {
            job: {
              include: { company: { select: { userId: true, name: true } } },
            },
          },
        },
      },
    });
    if (!interview) throw new AppError('Interview not found', 404);

    const updated = await prisma.interview.update({
      where: { id: req.params.id as string },
      data: { status },
    });

    await Promise.all([
      redis.del(RedisKeys.interviewsCache(user.userId)),
      redis.del(
        RedisKeys.interviewsCache(interview.application.job.company.userId)
      ),
    ]);

    const candidateName = `${candidate.firstName} ${candidate.lastName}`;
    const jobTitle = interview.application.job.title;
    const companyUserId = interview.application.job.company.userId;
    const companyName = interview.application.job.company.name;

    notificationService
      .createNotification(
        companyUserId,
        status === 'ACCEPTED'
          ? '✅ Interview Accepted'
          : '❌ Interview Declined',
        status === 'ACCEPTED'
          ? `${candidateName} has accepted the interview invitation for ${jobTitle}.`
          : `${candidateName} has declined the interview invitation for ${jobTitle}.`,
        'INTERVIEW',
        { interviewId: interview.id, applicationId: interview.applicationId }
      )
      .catch((e) =>
        logger.error('createNotification (interview respond) failed:', e)
      );

    sendSuccess(res, `Interview ${status.toLowerCase()}`, updated);
  }
);
