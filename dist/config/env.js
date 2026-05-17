'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.env = void 0;
const zod_1 = require('zod');
const envSchema = zod_1.z.object({
  NODE_ENV: zod_1.z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: zod_1.z.string().default('5000'),
  CLIENT_URL: zod_1.z.string().url(),
  DATABASE_URL: zod_1.z.string(),
  REDIS_URL: zod_1.z.string(),
  ACCESS_TOKEN_SECRET: zod_1.z.string().min(32),
  REFRESH_TOKEN_SECRET: zod_1.z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: zod_1.z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('7d'),
  IMAGEKIT_PUBLIC_KEY: zod_1.z.string(),
  IMAGEKIT_PRIVATE_KEY: zod_1.z.string(),
  IMAGEKIT_URL_ENDPOINT: zod_1.z.string().url(),
  GEMINI_API_KEY: zod_1.z.string(),
  SMTP_HOST: zod_1.z.string(),
  SMTP_PORT: zod_1.z.string().default('587'),
  SMTP_USER: zod_1.z.string().email(),
  SMTP_PASS: zod_1.z.string(),
  SMTP_FROM: zod_1.z.string(),
  RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000'),
  RATE_LIMIT_MAX: zod_1.z.string().default('100'),
  VOYAGE_API_KEY: zod_1.z.string(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map
