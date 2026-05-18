"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        email: zod_1.z.string().email('Invalid email'),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must contain an uppercase letter')
            .regex(/[0-9]/, 'Must contain a number')
            .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
        role: zod_1.z.enum(['COMPANY', 'CANDIDATE'], {
            message: 'Role is required',
        }),
        firstName: zod_1.z.string().optional(),
        lastName: zod_1.z.string().optional(),
        companyName: zod_1.z.string().optional(),
    })
        .refine((d) => d.role !== 'CANDIDATE' ||
        (d.firstName && d.firstName.trim().length > 0), {
        message: 'First name is required',
        path: ['firstName'],
    })
        .refine((d) => d.role !== 'CANDIDATE' || (d.lastName && d.lastName.trim().length > 0), {
        message: 'Last name is required',
        path: ['lastName'],
    })
        .refine((d) => d.role !== 'COMPANY' ||
        (d.companyName && d.companyName.trim().length > 0), {
        message: 'Company name is required',
        path: ['companyName'],
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().optional(),
    }),
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must contain an uppercase letter')
            .regex(/[0-9]/, 'Must contain a number')
            .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
    }),
});
//# sourceMappingURL=auth.validator.js.map