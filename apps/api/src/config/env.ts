import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173,http://localhost:19006'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/nirikshan_db'),
  USE_MEMORY_DB: z.string().transform((val) => val === 'true').default('false'),
  JWT_ACCESS_SECRET: z.string().default('nirikshan_dev_access_secret_super_secure_key_2026_xyz!'),
  JWT_REFRESH_SECRET: z.string().default('nirikshan_dev_refresh_secret_super_secure_key_2026_abc@'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  REDIS_URL: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'r2', 'minio', 'azure']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./uploads'),
  AI_SERVICE_URL: z.string().default('http://127.0.0.1:8000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
