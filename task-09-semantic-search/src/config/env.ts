import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('true')
  .transform((value) => value === 'true');

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3009),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://internship:internship@localhost:5439/task09'),
  TEST_DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://internship:internship@localhost:5449/task09_test'),
  REDIS_URL: z.string().url().default('redis://localhost:6389'),
  EMBEDDING_MODEL: z.string().min(1).default('Xenova/all-MiniLM-L6-v2'),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(384),
  MODEL_CACHE_DIR: z.string().min(1).default('.cache/models'),
  ALLOW_REMOTE_MODELS: booleanFromString,
  SEARCH_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  EMBEDDING_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(60000),
  EMBEDDING_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2)
});

const parsed = environmentSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid environment configuration:\n${issues.join('\n')}`);
}

export const config = parsed.data;
export type AppConfig = typeof config;

export function databaseUrlForEnvironment(): string {
  return config.NODE_ENV === 'test' ? config.TEST_DATABASE_URL : config.DATABASE_URL;
}
