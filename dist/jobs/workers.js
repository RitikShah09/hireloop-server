'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.closeWorkers =
  exports.embeddingWorker =
  exports.emailWorker =
  exports.screeningWorker =
    void 0;
const bullmq_1 = require('bullmq');
const queue_1 = require('../config/queue');
const logger_1 = require('../config/logger');
const prisma_1 = __importDefault(require('../config/prisma'));
const aiService = __importStar(require('../services/ai.service'));
const emailService = __importStar(require('../services/email.service'));
const ragService = __importStar(require('../services/rag.service'));
const notificationService = __importStar(
  require('../services/notification.service')
);
const redis_1 = require('../config/redis');
const pdf_parse_1 = require('pdf-parse');
exports.screeningWorker = new bullmq_1.Worker(
  'ai-screening',
  async (job) => {
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
    logger_1.logger.info(
      `[Queue] Screening job started: application ${applicationId}`
    );
    const resume = await prisma_1.default.resume.findUnique({
      where: { id: resumeId },
    });
    if (!resume) {
      logger_1.logger.warn(`[Queue] Resume ${resumeId} not found`);
      return { applicationId, score: 0 };
    }
    let resumeText = resume.parsedText;
    if (!resumeText && resume.fileUrl) {
      logger_1.logger.info(
        `[Queue] parsedText missing for resume ${resumeId} — attempting re-extraction from URL`
      );
      try {
        const response = await fetch(resume.fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const parser = new pdf_parse_1.PDFParse({
          data: buffer,
        });
        const resumeText = (await parser.getText()).text.trim();
        await parser.destroy();
        if (resumeText) {
          logger_1.logger.info(
            `[Queue] Re-extraction succeeded: ${resumeText.length} chars`
          );
          await prisma_1.default.resume.update({
            where: { id: resumeId },
            data: { parsedText: resumeText },
          });
        }
      } catch (e) {
        logger_1.logger.warn(
          `[Queue] Re-extraction failed for resume ${resumeId}:`,
          e
        );
      }
    }
    if (!resumeText) {
      logger_1.logger.warn(
        `[Queue] Resume ${resumeId} has no parsed text — marking as screened with low score`
      );
      await prisma_1.default.application.update({
        where: { id: applicationId },
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
    logger_1.logger.info(
      `[Queue] Sending resume to Gemini for screening — ${resumeText.length} chars`
    );
    const result = await aiService.screenResume(
      resumeText,
      jobTitle,
      jobDescription,
      jobRequirements,
      jobSkills
    );
    logger_1.logger.info(
      `[Queue] Gemini returned score: ${result.score} for application ${applicationId}`
    );
    await job.updateProgress(60);
    await prisma_1.default.application.update({
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
    await redis_1.redis.del(redis_1.RedisKeys.candidateRanking(jobId));
    if (!resume.embedding) {
      ragService
        .storeResumeEmbedding(resumeId, resumeText)
        .catch((e) => logger_1.logger.error('Embedding storage failed:', e));
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
      .catch((e) =>
        logger_1.logger.error('sendScreeningCompleteEmail failed:', e)
      );
    notificationService
      .createNotification(
        candidateUserId,
        'Application Screened',
        `Your application for ${jobTitle} has been reviewed by our AI system. You scored ${result.score}/100 (${scoreLabel} match). The company will review your profile shortly.`,
        'APPLICATION',
        { applicationId, jobId, score: result.score }
      )
      .catch((e) =>
        logger_1.logger.error('createNotification (candidate) failed:', e)
      );
    notificationService
      .createNotification(
        companyUserId,
        'AI Screening Complete',
        `${candidateName} has been screened for ${jobTitle} — AI score: ${result.score}/100 (${scoreLabel} match).`,
        'APPLICATION',
        { applicationId, jobId, score: result.score }
      )
      .catch((e) =>
        logger_1.logger.error('createNotification (company) failed:', e)
      );
    await job.updateProgress(100);
    logger_1.logger.info(
      `[Queue] Screening complete: application ${applicationId}, score: ${result.score}`
    );
    return { applicationId, score: result.score };
  },
  {
    connection: queue_1.connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 },
  }
);
exports.emailWorker = new bullmq_1.Worker(
  'email',
  async (job) => {
    const { to, subject, body, applicationId, type } = job.data;
    logger_1.logger.info(`[Queue] Sending email [${type}] to ${to}`);
    await emailService.sendApplicationEmail(
      to,
      subject,
      body,
      applicationId,
      type
    );
  },
  { connection: queue_1.connection, concurrency: 5 }
);
exports.embeddingWorker = new bullmq_1.Worker(
  'embedding',
  async (job) => {
    const { resumeId, text } = job.data;
    logger_1.logger.info(`[Queue] Generating embedding for resume ${resumeId}`);
    await ragService.storeResumeEmbedding(resumeId, text);
  },
  {
    connection: queue_1.connection,
    concurrency: 2,
    limiter: { max: 20, duration: 60000 },
  }
);
exports.screeningWorker.on('failed', (job, err) =>
  logger_1.logger.error(`[Queue] Screening failed [${job?.id}]: ${err.message}`)
);
exports.emailWorker.on('failed', (job, err) =>
  logger_1.logger.error(`[Queue] Email failed [${job?.id}]: ${err.message}`)
);
exports.embeddingWorker.on('failed', (job, err) =>
  logger_1.logger.error(`[Queue] Embedding failed [${job?.id}]: ${err.message}`)
);
const closeWorkers = async () => {
  await Promise.all([
    exports.screeningWorker.close(),
    exports.emailWorker.close(),
    exports.embeddingWorker.close(),
  ]);
  logger_1.logger.info('All BullMQ workers closed');
};
exports.closeWorkers = closeWorkers;
//# sourceMappingURL=workers.js.map
