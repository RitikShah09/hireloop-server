"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatusSchema = exports.createApplicationSchema = void 0;
const zod_1 = require("zod");
exports.createApplicationSchema = zod_1.z.object({
    body: zod_1.z.object({
        jobId: zod_1.z.string().uuid('Invalid job ID'),
        resumeId: zod_1.z.string().uuid('Invalid resume ID'),
        coverLetter: zod_1.z.string().max(2000).optional(),
    }),
});
exports.updateApplicationStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['SHORTLISTED', 'REJECTED', 'HIRED']),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
});
//# sourceMappingURL=application.validator.js.map