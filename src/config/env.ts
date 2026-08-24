import { z } from 'zod'

function blankAsUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === '' ? undefined : value), schema.optional())
}

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
  // the job endpoints are reachable without a jwt, so this secret IS their authorization
  JOB_SECRET: z.string().min(32, 'JOB_SECRET must be at least 32 characters'),
  // dias de anticipacion para avisar de hitos proximos; vencidos y hoy siempre avisan
  HITO_AVISO_DIAS: z
    .string()
    .default('3,1')
    .transform((valor) =>
      valor
        .split(',')
        .map((dia) => Number.parseInt(dia.trim(), 10))
        .filter((dia) => Number.isInteger(dia) && dia > 0),
    ),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().min(1).default('./storage'),
  STORAGE_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(30).default(900),
  STORAGE_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),
  // a var left blank in .env arrives as '' and must read as absent, not as invalid
  S3_BUCKET: blankAsUndefined(z.string()),
  S3_ENDPOINT: blankAsUndefined(z.string().url('S3_ENDPOINT must be a valid URL')),
  S3_ACCESS_KEY_ID: blankAsUndefined(z.string()),
  S3_SECRET_ACCESS_KEY: blankAsUndefined(z.string()),
  S3_REGION: z.string().default('auto'),
})

// the s3 vars stay optional so the local driver needs no credentials, but picking
// the s3 driver without them must fail at boot, not on the first upload
const S3_REQUIRED_VARS = [
  'S3_BUCKET',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const

const envSchemaWithStorageCheck = envSchema.superRefine((env, ctx) => {
  if (env.STORAGE_DRIVER !== 's3') return

  for (const key of S3_REQUIRED_VARS) {
    if (!env[key]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required when STORAGE_DRIVER is "s3"`,
      })
    }
  }
})

export type Env = z.infer<typeof envSchemaWithStorageCheck>

function loadEnv(): Env {
  const parsed = envSchemaWithStorageCheck.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }

  return parsed.data
}

export const envConfig = loadEnv()
