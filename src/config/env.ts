import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  PASSWORD_RESET_EXPIRATION: z.string().default('15m'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),
  APP_URL: z.string().url('APP_URL must be a valid URL').default('http://localhost:5173'),
  PAGINATION_DEFAULT_PAGE_SIZE: z.coerce.number().int().min(1).default(20),
  PAGINATION_MAX_PAGE_SIZE: z.coerce.number().int().min(1).default(100),
  API_URL: z.string().url('API_URL must be a valid URL').default('http://localhost:3000'),
  STORAGE_DRIVER: z.enum(['local']).default('local'),
  STORAGE_LOCAL_DIR: z.string().min(1).default('./storage'),
  STORAGE_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(30).default(900),
  STORAGE_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }

  return parsed.data
}

export const envConfig = loadEnv()
