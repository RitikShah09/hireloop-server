import { z } from 'zod';
export declare const createApplicationSchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        jobId: z.ZodString;
        resumeId: z.ZodString;
        coverLetter: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const updateApplicationStatusSchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        status: z.ZodEnum<{
          SHORTLISTED: 'SHORTLISTED';
          REJECTED: 'REJECTED';
          HIRED: 'HIRED';
        }>;
      },
      z.core.$strip
    >;
    params: z.ZodObject<
      {
        id: z.ZodString;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export type CreateApplicationInput = z.infer<
  typeof createApplicationSchema
>['body'];
//# sourceMappingURL=application.validator.d.ts.map
