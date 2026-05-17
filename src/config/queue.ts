import { Queue, QueueEvents } from 'bullmq';
import { env } from './env';
import { logger } from './logger';

const parseRedisUrl = (url: string) => {
  try {
    const u = new URL(url);
    return {
      host: u.hostname || '127.0.0.1',
      port: parseInt(u.port || '6379'),
      password: u.password || undefined,
      tls: u.protocol === 'rediss:' ? {} : undefined,
    };
  } catch {
    return { host: '127.0.0.1', port: 6379 };
  }
};

export const connection = parseRedisUrl(env.REDIS_URL);

export const screeningQueue = new Queue('ai-screening', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 3000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export const embeddingQueue = new Queue('embedding', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

export interface ScreeningJobData {
  applicationId: string;
  resumeId: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string[];
  jobSkills: string[];
  candidateFirstName: string;
  candidateLastName: string;
  candidateUserId: string;
  companyEmail: string;
  companyName: string;
  companyUserId: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  applicationId: string;
  type: string;
}

export interface EmbeddingJobData {
  resumeId: string;
  text: string;
}

const screeningEvents = new QueueEvents('ai-screening', { connection });
screeningEvents.on('completed', ({ jobId }) =>
  logger.info(`Screening job ${jobId} completed`)
);
screeningEvents.on('failed', ({ jobId, failedReason }) =>
  logger.error(`Screening job ${jobId} failed: ${failedReason}`)
);

const emailEvents = new QueueEvents('email', { connection });
emailEvents.on('failed', ({ jobId, failedReason }) =>
  logger.error(`Email job ${jobId} failed: ${failedReason}`)
);

export const addScreeningJob = async (data: ScreeningJobData) =>
  screeningQueue.add('screen-resume', data, {
    jobId: `screening-${data.applicationId}`,
  });

export const addEmailJob = async (data: EmailJobData) =>
  emailQueue.add('send-email', data);

export const addEmbeddingJob = async (data: EmbeddingJobData) =>
  embeddingQueue.add('generate-embedding', data, {
    jobId: `embedding-${data.resumeId}`,
  });
