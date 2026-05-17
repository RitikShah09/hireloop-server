import { z } from 'zod';

export const createApplicationSchema = z.object({
  body: z.object({
    jobId: z.string().uuid('Invalid job ID'),
    resumeId: z.string().uuid('Invalid resume ID'),
    coverLetter: z.string().max(2000).optional(),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: z.enum(['SHORTLISTED', 'REJECTED', 'HIRED']),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export type CreateApplicationInput = z.infer<
  typeof createApplicationSchema
>['body'];
