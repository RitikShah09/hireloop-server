"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQuerySchema = exports.updateJobSchema = exports.createJobSchema = void 0;
const zod_1 = require("zod");
exports.createJobSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(100),
        description: zod_1.z
            .string()
            .min(50, 'Description must be at least 50 characters'),
        requirements: zod_1.z
            .array(zod_1.z.string())
            .min(1, 'At least one requirement is needed'),
        skills: zod_1.z.array(zod_1.z.string()).min(1, 'At least one skill is needed'),
        location: zod_1.z.string().optional(),
        isRemote: zod_1.z.boolean().default(false),
        salaryMin: zod_1.z.number().positive().optional(),
        salaryMax: zod_1.z.number().positive().optional(),
        currency: zod_1.z.string().default('INR'),
        experienceMin: zod_1.z.number().min(0).optional(),
        experienceMax: zod_1.z.number().min(0).optional(),
        closingDate: zod_1.z.string().datetime().optional(),
    }),
});
exports.updateJobSchema = zod_1.z.object({
    body: exports.createJobSchema.shape.body.partial(),
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