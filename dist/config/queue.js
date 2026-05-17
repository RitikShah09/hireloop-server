'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.addEmbeddingJob =
  exports.addEmailJob =
  exports.addScreeningJob =
  exports.embeddingQueue =
  exports.emailQueue =
  exports.screeningQueue =
  exports.connection =
    void 0;
const bullmq_1 = require('bullmq');
const env_1 = require('./env');
const logger_1 = require('./logger');
const parseRedisUrl = (url) => {
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
exports.connection = parseRedisUrl(env_1.env.REDIS_URL);
exports.screeningQueue = new bullmq_1.Queue('ai-screening', {
  connection: exports.connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});
exports.emailQueue = new bullmq_1.Queue('email', {
  connection: exports.connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 3000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});
exports.embeddingQueue = new bullmq_1.Queue('embedding', {
  connection: exports.connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});
const screeningEvents = new bullmq_1.QueueEvents('ai-screening', {
  connection: exports.connection,
});
screeningEvents.on('completed', ({ jobId }) =>
  logger_1.logger.info(`Screening job ${jobId} completed`)
);
screeningEvents.on('failed', ({ jobId, failedReason }) =>
  logger_1.logger.error(`Screening job ${jobId} failed: ${failedReason}`)
);
const emailEvents = new bullmq_1.QueueEvents('email', {
  connection: exports.connection,
});
emailEvents.on('failed', ({ jobId, failedReason }) =>
  logger_1.logger.error(`Email job ${jobId} failed: ${failedReason}`)
);
const addScreeningJob = async (data) =>
  exports.screeningQueue.add('screen-resume', data, {
    jobId: `screening-${data.applicationId}`,
  });
exports.addScreeningJob = addScreeningJob;
const addEmailJob = async (data) => exports.emailQueue.add('send-email', data);
exports.addEmailJob = addEmailJob;
const addEmbeddingJob = async (data) =>
  exports.embeddingQueue.add('generate-embedding', data, {
    jobId: `embedding-${data.resumeId}`,
  });
exports.addEmbeddingJob = addEmbeddingJob;
//# sourceMappingURL=queue.js.map
