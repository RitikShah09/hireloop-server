import { z } from 'zod';
export declare const createJobSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        requirements: z.ZodArray<z.ZodString>;
        skills: z.ZodArray<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        isRemote: z.ZodDefault<z.ZodBoolean>;
        salaryMin: z.ZodOptional<z.ZodNumber>;
        salaryMax: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodString>;
        experienceMin: z.ZodOptional<z.ZodNumber>;
        experienceMax: z.ZodOptional<z.ZodNumber>;
        closingDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        status: z.ZodOptional<z.ZodEnum<{
            DRAFT: "DRAFT";
            ACTIVE: "ACTIVE";
            CLOSED: "CLOSED";
            ARCHIVED: "ARCHIVED";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateJobSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        requirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
        skills: z.ZodOptional<z.ZodArray<z.ZodString>>;
        location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        isRemote: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        salaryMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        salaryMax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
        experienceMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        experienceMax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        closingDate: z.ZodOptional<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
        status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
            DRAFT: "DRAFT";
            ACTIVE: "ACTIVE";
            CLOSED: "CLOSED";
            ARCHIVED: "ARCHIVED";
        }>>>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const jobQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        skills: z.ZodOptional<z.ZodString>;
        isRemote: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            DRAFT: "DRAFT";
            ACTIVE: "ACTIVE";
            CLOSED: "CLOSED";
            ARCHIVED: "ARCHIVED";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateJobInput = z.infer<typeof createJobSchema>['body'];
export type UpdateJobInput = z.infer<typeof updateJobSchema>['body'];
//# sourceMappingURL=job.validator.d.ts.map