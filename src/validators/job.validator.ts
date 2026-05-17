import { z } from 'zod';

const jobBodyObject = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z
    .array(z.string())
    .min(1, 'At least one requirement is needed'),
  skills: z.array(z.string()).min(1, 'At least one skill is needed'),
  location: z.string().optional(),
  isRemote: z.boolean().default(false),
  salaryMin: z.number().positive('Min salary must be positive').optional(),
  salaryMax: z.number().positive('Max salary must be positive').optional(),
  currency: z.string().default('INR'),
  experienceMin: z.number().min(0, 'Cannot be negative').optional(),
  experienceMax: z.number().min(0, 'Cannot be negative').optional(),
  closingDate: z.coerce.date().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
});

const jobBodySchema = jobBodyObject
  .refine((d) => !d.salaryMin || !d.salaryMax || d.salaryMin <= d.salaryMax, {
    message: 'Min salary cannot exceed max salary',
    path: ['salaryMax'],
  })
  .refine(
    (d) =>
      !d.experienceMin ||
      !d.experienceMax ||
      d.experienceMin <= d.experienceMax,
    {
      message: 'Min experience cannot exceed max experience',
      path: ['experienceMax'],
    }
  )
  .refine((d) => !d.closingDate || d.closingDate > new Date(), {
    message: 'Closing date must be in the future',
    path: ['closingDate'],
  });

export const createJobSchema = z.object({ body: jobBodySchema });

export const updateJobSchema = z.object({
  body: jobBodyObject.partial(),
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
