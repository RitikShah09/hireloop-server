import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import {
  buildResumeFromScratch,
  buildResumeFromUpload,
} from '../services/ai.service';
import prisma from '../config/prisma';
import { log } from 'node:console';
import { PDFParse } from 'pdf-parse';

export const buildFromScratch = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      email,
      phone,
      location,
      targetRole,
      yearsOfExperience,
      skills,
      education,
      previousRoles,
    } = req.body;

    if (!name || !email || !targetRole || !skills) {
      throw new AppError(
        'name, email, targetRole and skills are required',
        400
      );
    }

    const resumeData = await buildResumeFromScratch({
      name,
      email,
      phone,
      location,
      targetRole,
      yearsOfExperience: yearsOfExperience || '0',
      skills,
      education: education || '',
      previousRoles,
    });

    sendSuccess(res, 'Resume generated successfully', resumeData, 201);
  }
);

export const buildFromUpload = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) throw new AppError('PDF file is required', 400);

    const { targetRole } = req.body;

    let parsedText = '';
    try {
      const parser = new PDFParse({
        data: req.file.buffer,
      });
      parsedText = (await parser.getText()).text.trim();
      await parser.destroy();
    } catch (error) {
      log('Error parsing PDF:', error);
      throw new AppError(
        'Failed to parse PDF. Please ensure it is a valid PDF file.',
        400
      );
    }

    if (!parsedText.trim())
      throw new AppError('PDF appears to be empty or unreadable', 400);

    const resumeData = await buildResumeFromUpload(parsedText, targetRole);
    sendSuccess(res, 'Resume enhanced successfully', resumeData, 201);
  }
);

export const buildFromExistingResume = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate) throw new AppError('Candidate profile not found', 404);

    const resume = await prisma.resume.findFirst({
      where: { id: req.params.resumeId as string, candidateId: candidate.id },
    });
    if (!resume) throw new AppError('Resume not found', 404);
    if (!resume.parsedText)
      throw new AppError('Resume has no parseable text', 400);

    const { targetRole } = req.body;
    const resumeData = await buildResumeFromUpload(
      resume.parsedText,
      targetRole
    );
    sendSuccess(res, 'Resume enhanced from existing', resumeData, 201);
  }
);

export const enhanceSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { section, currentValue, prompt } = req.body;
    if (!section || !prompt)
      throw new AppError('section and prompt are required', 400);

    const { enhanceResumeSection } = await import('../services/ai.service');
    const enhanced = await enhanceResumeSection(
      section,
      currentValue || '',
      prompt
    );
    sendSuccess(res, 'Section enhanced', { enhanced });
  }
);
