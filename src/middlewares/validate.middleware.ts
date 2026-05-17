import { ZodSchema, ZodError, ZodIssue, z } from 'zod';

export const formatZodErrors = (
  issues: ZodIssue[]
): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  issues.forEach((issue) => {
    const field = issue.path.slice(1).join('.') || '_root';
    if (!errors[field]) errors[field] = [];
    errors[field].push(issue.message);
  });
  return errors;
};

export const parseRequest = <T extends ZodSchema>(
  schema: T,
  req: { body?: unknown; query?: unknown; params?: unknown }
): z.infer<T> =>
  schema.parse({
    body: req.body,
    query: req.query,
    params: req.params,
  }) as z.infer<T>;

export { ZodError };
