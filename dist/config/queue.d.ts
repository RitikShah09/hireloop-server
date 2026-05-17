import { Queue } from 'bullmq';
export declare const connection:
  | {
      host: string;
      port: number;
      password: string | undefined;
      tls: {} | undefined;
    }
  | {
      host: string;
      port: number;
      password?: undefined;
      tls?: undefined;
    };
export declare const screeningQueue: Queue<any, any, string, any, any, string>;
export declare const emailQueue: Queue<any, any, string, any, any, string>;
export declare const embeddingQueue: Queue<any, any, string, any, any, string>;
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
export declare const addScreeningJob: (
  data: ScreeningJobData
) => Promise<import('bullmq').Job<any, any, string>>;
export declare const addEmailJob: (
  data: EmailJobData
) => Promise<import('bullmq').Job<any, any, string>>;
export declare const addEmbeddingJob: (
  data: EmbeddingJobData
) => Promise<import('bullmq').Job<any, any, string>>;
//# sourceMappingURL=queue.d.ts.map
