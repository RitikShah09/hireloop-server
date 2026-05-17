import { Worker, Job } from 'bullmq';
import { connection } from '../config/queue';
import { logger } from '../config/logger';
import {
  ScreeningJobData,
  EmailJobData,
  EmbeddingJobData,
} from '../config/queue';
import prisma from '../config/prisma';
import * as aiService from '../services/ai.service';
import * as emailService from '../services/email.service';
import * as ragService from '../services/rag.service';
import * as notificationService from '../services/notification.service';
import { RedisKeys, redis } from '../config/redis';
import { PDFParse } from 'pdf-parse';

export const screeningWorker = new Worker<ScreeningJobData>(
  'ai-screening',
  async (job: Job<ScreeningJobData>) => {
    const {
      applicationId,
      resumeId,
      jobId,
      jobTitle,
      jobDescription,
      jobRequirements,
      jobSkills,
      candidateFirstName,
      candidateLastName,
      companyEmail,
      candidateUserId,
      companyUserId,
    } = job.data;

    logger.info(`[Queue] Screening job started: application ${applicationId}`);

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) {
      logger.warn(`[Queue] Resume ${resumeId} not found`);
      return { applicationId, score: 0 };
    }

    let resumeText = resume.parsedText;

    if (!resumeText && resume.fileUrl) {
      logger.info(
        `[Queue] parsedText missing for resume ${resumeId} — attempting re-extraction from URL`
      );
      try {
        const response = await fetch(resume.fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const parser = new PDFParse({
          data: buffer,
        });
        const resumeText = (await parser.getText()).text.trim();
        await parser.destroy();

        if (resumeText) {
          logger.info(
            `[Queue] Re-extraction succeeded: ${resumeText.length} chars`
          );

          await prisma.resume.update({
            where: { id: resumeId as string },
            data: { parsedText: resumeText },
          });
        }
      } catch (e) {
        logger.warn(`[Queue] Re-extraction failed for resume ${resumeId}:`, e);
      }
    }

    if (!resumeText) {
      logger.warn(
        `[Queue] Resume ${resumeId} has no parsed text — marking as screened with low score`
      );
      await prisma.application.update({
        where: { id: applicationId as string },
        data: {
          aiScore: 0,
          aiSummary:
            'Resume text could not be extracted from PDF. Please re-upload a text-based PDF.',
          status: 'SCREENING',
          screenedAt: new Date(),
        },
      });
      return { applicationId, score: 0 };
    }

    await job.updateProgress(10);

    logger.info(
      `[Queue] Sending resume to Gemini for screening — ${resumeText.length} chars`
    );

    const result = await aiService.screenResume(
      resumeText,
      jobTitle,
      jobDescription,
      jobRequirements,
      jobSkills
    );

    logger.info(
      `[Queue] Gemini returned score: ${result.score} for application ${applicationId}`
    );

    await job.updateProgress(60);

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        aiScore: result.score,
        aiSummary: result.summary,
        aiStrengths: result.strengths,
        aiWeaknesses: result.weaknesses,
        status: 'SCREENING',
        screenedAt: new Date(),
      },
    });

    await job.updateProgress(75);

    await redis.del(RedisKeys.candidateRanking(jobId));

    if (!(resume as Record<string, unknown>).embedding) {
      ragService
        .storeResumeEmbedding(resumeId as string, resumeText)
        .catch((e) => logger.error('Embedding storage failed:', e));
    }

    await job.updateProgress(90);

    const candidateName = `${candidateFirstName} ${candidateLastName}`;
    const scoreLabel =
      result.score >= 75 ? 'strong' : result.score >= 50 ? 'moderate' : 'low';

    emailService
      .sendScreeningCompleteEmail({
        companyEmail,
        candidateName,
        jobTitle,
        aiScore: result.score,
        aiSummary: result.summary,
        applicationId,
      })
      .catch((e) => logger.error('sendScreeningCompleteEmail failed:', e));

    notificationService
      .createNotification(
        candidateUserId,
        'Application Screened',
        `Your application for ${jobTitle} has been reviewed by our AI system. You scored ${result.score}/100 (${scoreLabel} match). The company will review your profile shortly.`,
        'APPLICATION',
        { applicationId, jobId, score: result.score }
      )
      .catch((e) => logger.error('createNotification (candidate) failed:', e));

    notificationService
      .createNotification(
        companyUserId,
        'AI Screening Complete',
        `${candidateName} has been screened for ${jobTitle} — AI score: ${result.score}/100 (${scoreLabel} match).`,
        'APPLICATION',
        { applicationId, jobId, score: result.score }
      )
      .catch((e) => logger.error('createNotification (company) failed:', e));

    await job.updateProgress(100);
    logger.info(
      `[Queue] Screening complete: application ${applicationId}, score: ${result.score}`
    );
    return { applicationId, score: result.score };
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 },
  }
);

export const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job: Job<EmailJobData>) => {
    const { to, subject, body, applicationId, type } = job.data;
    logger.info(`[Queue] Sending email [${type}] to ${to}`);
    await emailService.sendApplicationEmail(
      to,
      subject,
      body,
      applicationId,
      type
    );
  },
  { connection, concurrency: 5 }
);

export const embeddingWorker = new Worker<EmbeddingJobData>(
  'embedding',
  async (job: Job<EmbeddingJobData>) => {
    const { resumeId, text } = job.data;
    logger.info(`[Queue] Generating embedding for resume ${resumeId}`);
    await ragService.storeResumeEmbedding(resumeId, text);
  },
  {
    connection,
    concurrency: 2,
    limiter: { max: 20, duration: 60000 },
  }
);

screeningWorker.on('failed', (job, err) =>
  logger.error(`[Queue] Screening failed [${job?.id}]: ${err.message}`)
);
emailWorker.on('failed', (job, err) =>
  logger.error(`[Queue] Email failed [${job?.id}]: ${err.message}`)
);
embeddingWorker.on('failed', (job, err) =>
  logger.error(`[Queue] Embedding failed [${job?.id}]: ${err.message}`)
);

export const closeWorkers = async () => {
  await Promise.all([
    screeningWorker.close(),
    emailWorker.close(),
    embeddingWorker.close(),
  ]);
  logger.info('All BullMQ workers closed');
};
