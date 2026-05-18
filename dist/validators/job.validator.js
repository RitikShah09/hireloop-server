"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQuerySchema = exports.updateJobSchema = exports.createJobSchema = void 0;
const zod_1 = require("zod");
const jobBodyObject = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: zod_1.z.string().min(50, 'Description must be at least 50 characters'),
    requirements: zod_1.z
        .array(zod_1.z.string())
        .min(1, 'At least one requirement is needed'),
    skills: zod_1.z.array(zod_1.z.string()).min(1, 'At least one skill is needed'),
    location: zod_1.z.string().optional(),
    isRemote: zod_1.z.boolean().default(false),
    salaryMin: zod_1.z.number().positive('Min salary must be positive').optional(),
    salaryMax: zod_1.z.number().positive('Max salary must be positive').optional(),
    currency: zod_1.z.string().default('INR'),
    experienceMin: zod_1.z.number().min(0, 'Cannot be negative').optional(),
    experienceMax: zod_1.z.number().min(0, 'Cannot be negative').optional(),
    closingDate: zod_1.z.coerce.date().optional(),
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
});
const jobBodySchema = jobBodyObject
    .refine((d) => !d.salaryMin || !d.salaryMax || d.salaryMin <= d.salaryMax, {
    message: 'Min salary cannot exceed max salary',
    path: ['salaryMax'],
})
    .refine((d) => !d.experienceMin ||
    !d.experienceMax ||
    d.experienceMin <= d.experienceMax, {
    message: 'Min experience cannot exceed max experience',
    path: ['experienceMax'],
})
    .refine((d) => !d.closingDate || d.closingDate > new Date(), {
    message: 'Closing date must be in the future',
    path: ['closingDate'],
});
exports.createJobSchema = zod_1.z.object({ body: jobBodySchema });
exports.updateJobSchema = zod_1.z.object({
    body: jobBodyObject.partial(),
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
});
exports.jobQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        skills: zod_1.z.string().optional(),
        isRemote: zod_1.z.string().optional(),
        status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
    }),
});
//# sourceMappingURL=job.validator.js.map