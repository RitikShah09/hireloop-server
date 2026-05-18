import { Worker } from 'bullmq';
import { ScreeningJobData, EmailJobData, EmbeddingJobData } from '../config/queue';
export declare const screeningWorker: Worker<ScreeningJobData, any, string>;
export declare const emailWorker: Worker<EmailJobData, any, string>;
export declare const embeddingWorker: Worker<EmbeddingJobData, any, string>;
export declare const closeWorkers: () => Promise<void>;
//# sourceMappingURL=workers.d.ts.map