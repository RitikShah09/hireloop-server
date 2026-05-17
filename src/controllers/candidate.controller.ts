import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import * as candidateService from '../services/candidate.service';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import { redis, RedisKeys, REDIS_TTL } from '../config/redis';

const getCandidateId = async (userId: string) => {
  const candidate = await prisma.candidate.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!candidate) throw new AppError('Candidate profile not found', 404);
  return candidate.id;
};

export const getFullProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    const profile = await candidateService.getCandidateFullProfile(candidateId);
    sendSuccess(res, 'Profile fetched', profile);
  }
);

export const getCertifications = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);

    const cacheKey = RedisKeys.candidateData(candidateId, 'certifications');
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Certifications fetched', JSON.parse(cached));
      return;
    }

    const certs = await candidateService.getCertifications(candidateId);
    await redis.set(
      cacheKey,
      JSON.stringify(certs),
      'EX',
      REDIS_TTL.CANDIDATE_DATA
    );
    sendSuccess(res, 'Certifications fetched', certs);
  }
);

export const addCertification = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    const cert = await candidateService.addCertification(candidateId, req.body);
    await redis.del(RedisKeys.candidateData(candidateId, 'certifications'));
    sendSuccess(res, 'Certification added', cert, 201);
  }
);

export const updateCertification = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    const cert = await candidateService.updateCertification(
      candidateId,
      req.params.id as string,
      req.body
    );
    await redis.del(RedisKeys.candidateData(candidateId, 'certifications'));
    sendSuccess(res, 'Certification updated', cert);
  }
);

export const deleteCertification = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    await candidateService.deleteCertification(
      candidateId,
      req.params.id as string
    );
    await redis.del(RedisKeys.candidateData(candidateId, 'certifications'));
    sendSuccess(res, 'Certification deleted');
  }
);

export const getWorkExperiences = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);

    const cacheKey = RedisKeys.candidateData(candidateId, 'experience');
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Work experiences fetched', JSON.parse(cached));
      return;
    }

    const experiences = await candidateService.getWorkExperiences(candidateId);
    await redis.set(
      cacheKey,
      JSON.stringify(experiences),
      'EX',
      REDIS_TTL.CANDIDATE_DATA
    );
    sendSuccess(res, 'Work experiences fetched', experiences);
  }
);

export const addWorkExperience = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    const exp = await candidateService.addWorkExperience(candidateId, req.body);
    await redis.del(RedisKeys.candidateData(candidateId, 'experience'));
    sendSuccess(res, 'Work experience added', exp, 201);
  }
);

export const updateWorkExperience = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    const exp = await candidateService.updateWorkExperience(
      candidateId,
      req.params.id as string,
      req.body
    );
    await redis.del(RedisKeys.candidateData(candidateId, 'experience'));
    sendSuccess(res, 'Work experience updated', exp);
  }
);

export const deleteWorkExperience = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    await candidateService.deleteWorkExperience(
      candidateId,
      req.params.id as string
    );
    await redis.del(RedisKeys.candidateData(candidateId, 'experience'));
    sendSuccess(res, 'Work experience deleted');
  }
);

export const getEducations = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);

    const cacheKey = RedisKeys.candidateData(candidateId, 'education');
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Education records fetched', JSON.parse(cached));
      return;
    }

    const educations = await candidateService.getEducations(candidateId);
    await redis.set(
      cacheKey,
      JSON.stringify(educations),
      'EX',
      REDIS_TTL.CANDIDATE_DATA
    );
    sendSuccess(res, 'Education records fetched', educations);
  }
);

export const addEducation = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    const edu = await candidateService.addEducation(candidateId, req.body);
    await redis.del(RedisKeys.candidateData(candidateId, 'education'));
    sendSuccess(res, 'Education added', edu, 201);
  }
);

export const updateEducation = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    const edu = await candidateService.updateEducation(
      candidateId,
      req.params.id as string,
      req.body
    );
    await redis.del(RedisKeys.candidateData(candidateId, 'education'));
    sendSuccess(res, 'Education updated', edu);
  }
);

export const deleteEducation = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    await candidateService.deleteEducation(
      candidateId,
      req.params.id as string
    );
    await redis.del(RedisKeys.candidateData(candidateId, 'education'));
    sendSuccess(res, 'Education deleted');
  }
);

export const getMilestones = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);

    const cacheKey = RedisKeys.candidateData(candidateId, 'milestones');
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Milestones fetched', JSON.parse(cached));
      return;
    }

    const milestones = await candidateService.getMilestones(candidateId);
    await redis.set(
      cacheKey,
      JSON.stringify(milestones),
      'EX',
      REDIS_TTL.CANDIDATE_DATA
    );
    sendSuccess(res, 'Milestones fetched', milestones);
  }
);

export const addMilestone = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    const milestone = await candidateService.addMilestone(
      candidateId,
      req.body
    );
    await redis.del(RedisKeys.candidateData(candidateId, 'milestones'));
    sendSuccess(res, 'Milestone added', milestone, 201);
  }
);

export const updateMilestone = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    const milestone = await candidateService.updateMilestone(
      candidateId,
      req.params.id as string,
      req.body
    );
    await redis.del(RedisKeys.candidateData(candidateId, 'milestones'));
    sendSuccess(res, 'Milestone updated', milestone);
  }
);

export const deleteMilestone = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);
    await candidateService.deleteMilestone(
      candidateId,
      req.params.id as string
    );
    await redis.del(RedisKeys.candidateData(candidateId, 'milestones'));
    sendSuccess(res, 'Milestone deleted');
  }
);

export const getSuggestedJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidateId = await getCandidateId(user.userId);

    const cacheKey = RedisKeys.suggestedJobs(candidateId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Suggested jobs fetched', JSON.parse(cached));
      return;
    }

    const jobs = await candidateService.getSuggestedJobs(candidateId);
    await redis.set(
      cacheKey,
      JSON.stringify(jobs),
      'EX',
      REDIS_TTL.SUGGESTED_JOBS
    );
    sendSuccess(res, 'Suggested jobs fetched', jobs);
  }
);
