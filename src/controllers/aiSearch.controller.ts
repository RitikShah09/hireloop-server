import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { aiJobSearch } from '../services/ai.service';
import prisma from '../config/prisma';

export const aiSearchJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      throw new AppError('Query must be at least 3 characters', 400);
    }

    const jobs = await prisma.job.findMany({
      where: { status: 'ACTIVE' },
      include: { company: { select: { name: true } } },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const jobsForAI = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description.slice(0, 300),
      skills: j.skills,
      location: j.location || undefined,
      isRemote: j.isRemote,
      company: j.company?.name,
    }));

    if (jobsForAI.length === 0) {
      sendSuccess(res, 'No active jobs found', {
        matches: [],
        suggestion: 'Check back later for new opportunities.',
      });
      return;
    }

    const result = await aiJobSearch(query, jobsForAI);

    const matchIds = result.matches.map((m) => m.id);
    const matchedJobs = await prisma.job.findMany({
      where: { id: { in: matchIds } },
      include: {
        company: { select: { name: true, logoUrl: true, location: true } },
      },
    });

    const enriched = result.matches.map((m) => ({
      ...m,
      job: matchedJobs.find((j) => j.id === m.id),
    }));

    sendSuccess(res, 'AI search complete', {
      matches: enriched,
      suggestion: result.suggestion,
    });
  }
);
