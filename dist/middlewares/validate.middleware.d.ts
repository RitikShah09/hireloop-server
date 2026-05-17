import { ZodSchema, ZodError, ZodIssue, z } from 'zod';
export declare const formatZodErrors: (issues: ZodIssue[]) => Record<string, string[]>;
export declare const parseRequest: <T extends ZodSchema>(schema: T, req: {
    body?: unknown;
    query?: unknown;
    params?: unknown;
}) => z.infer<T>;
export { ZodError };
//# sourceMappingURL=validate.middleware.d.ts.map