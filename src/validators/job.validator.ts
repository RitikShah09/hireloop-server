import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z
      .string()
      .min(50, 'Description must be at least 50 characters'),
    requirements: z
      .array(z.string())
      .min(1, 'At least one requirement is needed'),
    skills: z.array(z.string()).min(1, 'At least one skill is needed'),
    location: z.string().optional(),
    isRemote: z.boolean().default(false),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    currency: z.string().default('INR'),
    experienceMin: z.number().min(0).optional(),
    experienceMax: z.number().min(0).optional(),
    closingDate: z.string().datetime().optional(),
  }),
});

export const updateJobSchema = z.object({
  body: createJobSchema.shape.body.partial(),
  params: z.object({ id: z.string().uuid() }),
});

export const jobQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    skills: z.string().optional(),
    isRemote: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  }),
});

export type CreateJobInput = z.infer<typeof createJobSchema>['body'];
export type UpdateJobInput = z.infer<typeof updateJobSchema>['body'];
