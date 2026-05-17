import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/prisma';
import * as imagekitService from '../services/imagekit.service';
import { redis, RedisKeys, REDIS_TTL } from '../config/redis';

export const getCandidateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;

    const cacheKey = RedisKeys.candidateProfile(user.userId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Profile fetched', JSON.parse(cached));
      return;
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
      include: { user: { select: { email: true } } },
    });
    if (!candidate) throw new AppError('Profile not found', 404);

    await redis.set(
      cacheKey,
      JSON.stringify(candidate),
      'EX',
      REDIS_TTL.PROFILE
    );
    sendSuccess(res, 'Profile fetched', candidate);
  }
);

export const updateCandidateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const {
      firstName,
      lastName,
      phone,
      location,
      bio,
      skills,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
    } = req.body;

    const candidate = await prisma.candidate.update({
      where: { userId: user.userId },
      data: {
        firstName,
        lastName,
        phone,
        location,
        bio,
        skills,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
      },
    });

    await redis.del(RedisKeys.candidateProfile(user.userId));

    await redis.del(RedisKeys.suggestedJobs(candidate.id));
    sendSuccess(res, 'Profile updated', candidate);
  }
);

export const uploadCandidateAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!req.file) throw new AppError('Image is required', 400);

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate) throw new AppError('Profile not found', 404);

    if (candidate.avatarFileId) {
      await imagekitService.deleteFile(candidate.avatarFileId);
    }

    const { url, fileId } = await imagekitService.uploadCandidateAvatar(
      req.file.buffer,
      req.file.originalname,
      candidate.id
    );

    const updated = await prisma.candidate.update({
      where: { userId: user.userId },
      data: { avatarUrl: url, avatarFileId: fileId },
    });

    await redis.del(RedisKeys.candidateProfile(user.userId));
    sendSuccess(res, 'Avatar updated', { avatarUrl: updated.avatarUrl });
  }
);

export const getCompanyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;

    const cacheKey = RedisKeys.companyProfile(user.userId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Company profile fetched', JSON.parse(cached));
      return;
    }

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
      include: { user: { select: { email: true } } },
    });
    if (!company) throw new AppError('Company profile not found', 404);

    await redis.set(cacheKey, JSON.stringify(company), 'EX', REDIS_TTL.PROFILE);
    sendSuccess(res, 'Company profile fetched', company);
  }
);

export const updateCompanyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { name, description, website, industry, size, location } = req.body;

    const company = await prisma.company.update({
      where: { userId: user.userId },
      data: { name, description, website, industry, size, location },
    });

    await Promise.all([
      redis.del(RedisKeys.companyProfile(user.userId)),
      redis.del(RedisKeys.publicCompany(company.id)),
    ]);
    sendSuccess(res, 'Company profile updated', company);
  }
);

export const uploadCompanyLogo = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!req.file) throw new AppError('Image is required', 400);

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    });
    if (!company) throw new AppError('Company not found', 404);

    if (company.logoFileId) {
      await imagekitService.deleteFile(company.logoFileId);
    }

    const { url, fileId } = await imagekitService.uploadCompanyLogo(
      req.file.buffer,
      req.file.originalname,
      company.id
    );

    const updated = await prisma.company.update({
      where: { userId: user.userId },
      data: { logoUrl: url, logoFileId: fileId },
    });

    await Promise.all([
      redis.del(RedisKeys.companyProfile(user.userId)),
      redis.del(RedisKeys.publicCompany(company.id)),
    ]);
    sendSuccess(res, 'Logo updated', { logoUrl: updated.logoUrl });
  }
);

export const getPublicCompanyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const companyId = req.params.id as string;

    const cacheKey = RedisKeys.publicCompany(companyId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      sendSuccess(res, 'Company fetched', JSON.parse(cached));
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        logoUrl: true,
        industry: true,
        size: true,
        location: true,
        jobs: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            location: true,
            isRemote: true,
            shareableSlug: true,
            createdAt: true,
          },
          take: 10,
        },
      },
    });
    if (!company) throw new AppError('Company not found', 404);

    await redis.set(
      cacheKey,
      JSON.stringify(company),
      'EX',
      REDIS_TTL.PUBLIC_PROFILE
    );
    sendSuccess(res, 'Company fetched', company);
  }
);
