import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/prisma';
import { logger } from '../config/logger';
import * as imagekitService from '../services/imagekit.service';
import { redis, RedisKeys, REDIS_TTL } from '../config/redis';
import { PDFParse } from 'pdf-parse';
import { storeResumeEmbedding } from '../services/rag.service';

export const uploadResume = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate) throw new AppError('Candidate profile not found', 404);
    if (!req.file) throw new AppError('Resume file is required', 400);

    let parsedText: string = (req.body?.parsedText as string) || '';

    if (!parsedText) {
      try {
        const parser = new PDFParse({ data: req.file.buffer });
        parsedText = (await parser.getText()).text;
        await parser.destroy();
        if (!parsedText)
          logger.warn(
            'PDF parsed but text is empty — may be a scanned/image PDF'
          );
        else
          logger.info(
            `PDF parsed successfully: ${parsedText.length} characters extracted`
          );
      } catch (parseErr) {
        logger.error('PDF parsing failed:', parseErr);
      }
    } else {
      logger.info(
        `Using client-provided parsed text: ${parsedText.length} characters`
      );
    }

    const { url, fileId } = await imagekitService.uploadResume(
      req.file.buffer,
      req.file.originalname,
      candidate.id
    );

    const resume = await prisma.resume.create({
      data: {
        candidateId: candidate.id,
        fileName: req.file.originalname,
        fileUrl: url,
        fileId,
        parsedText,
      },
    });

    await redis.del(RedisKeys.resumesCache(candidate.id));

    if (parsedText) {
      storeResumeEmbedding(resume.id, parsedText).catch((err) =>
        logger.error(`Failed to store embedding for resume ${resume.id}:`, err)
      );
    }

    sendSuccess(res, 'Resume uploaded', resume, 201);
  }
);

export const getResumes = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const candidate = await prisma.candidate.findUnique({
    where: { userId: user.userId },
  });
  if (!candidate) throw new AppError('Candidate profile not found', 404);

  const cacheKey = RedisKeys.resumesCache(candidate.id);
  const cached = await redis.get(cacheKey);
  if (cached) {
    sendSuccess(res, 'Resumes fetched', JSON.parse(cached));
    return;
  }

  const resumes = await prisma.resume.findMany({
    where: { candidateId: candidate.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      isDefault: true,
      createdAt: true,
    },
  });

  await redis.set(cacheKey, JSON.stringify(resumes), 'EX', REDIS_TTL.RESUMES);
  sendSuccess(res, 'Resumes fetched', resumes);
});

export const deleteResume = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate) throw new AppError('Candidate not found', 404);

    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id as string, candidateId: candidate.id },
    });
    if (!resume) throw new AppError('Resume not found', 404);

    await imagekitService.deleteFile(resume.fileId);
    await prisma.resume.delete({ where: { id: req.params.id as string } });
    await redis.del(RedisKeys.resumesCache(candidate.id));
    sendSuccess(res, 'Resume deleted');
  }
);

export const setDefaultResume = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate) throw new AppError('Candidate not found', 404);

    await prisma.$transaction([
      prisma.resume.updateMany({
        where: { candidateId: candidate.id },
        data: { isDefault: false },
      }),
      prisma.resume.update({
        where: { id: req.params.id as string },
        data: { isDefault: true },
      }),
    ]);

    await redis.del(RedisKeys.resumesCache(candidate.id));
    sendSuccess(res, 'Default resume updated');
  }
);
