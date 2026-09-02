import { defineRailway, github, postgres, preserve, service } from 'railway/iac'

// verified against `git remote -v`
const REPO = 'Solucionenti/seguropro_backend'

// CONFIRM these against the real project before the first `railway config apply`: a name that
// does not match an existing resource makes IaC CREATE one instead of adopting it.
// `railway config pull` prints the actual names.
const PROJECT_FALLBACK = 'profound-balance'
const DB_SERVICE = 'Postgres'
const API_SERVICE = 'segur-api'
const JOBS_SERVICE = 'segur-jobs'
const FRONT_SERVICE = 'seguropro_front'

// which git branch each railway environment deploys, and which one re-seeds on every deploy.
// an environment absent from this map is a mistake rather than a default: quietly falling back
// to main would ship stale code to a live environment
const BRANCH_BY_ENVIRONMENT: Record<string, string> = {
  production: 'main',
  dev: 'dev',
}
const SEEDED_ENVIRONMENTS = ['dev']

const WATCH_PATTERNS = [
  'src/**',
  'scripts/**',
  'prisma/**',
  'package.json',
  'bun.lock',
  'railpack.json',
  '.railway/**',
]

// railway resolves ${{ ... }} inside a variable value on its own side. a typed reference like
// db.env.DATABASE_URL is an object, not a string, so it cannot be concatenated with a prefix —
// any url built around one goes through this instead
function railwayVar(expression: string): string {
  return `\${{${expression}}}`
}

export default defineRailway((ctx, project) => {
  // main is production, dev is qa/demo. see RAILWAY.md
  const environment = ctx.environment ?? ctx.environmentName
  const branch = environment ? BRANCH_BY_ENVIRONMENT[environment] : undefined

  if (!environment || !branch) {
    throw new Error(
      `Railway environment ${environment ?? '<unknown>'} is not mapped in BRANCH_BY_ENVIRONMENT. ` +
        `Add it there before applying, so the branch is chosen deliberately instead of defaulting. ` +
        `Known: ${Object.keys(BRANCH_BY_ENVIRONMENT).join(', ')}`,
    )
  }

  const isProduction = environment === 'production'
  const seedOnDeploy = SEEDED_ENVIRONMENTS.includes(environment)

  const db = postgres(DB_SERVICE)

  const api = service(API_SERVICE, {
    // checkSuites is "Wait for CI": hold the deploy until the github actions run passes
    source: github(REPO, { branch, checkSuites: true }),
    build: {
      builder: 'RAILPACK',
      watchPatterns: WATCH_PATTERNS,
    },
    deploy: {
      startCommand: 'bun run src/index.ts',
      preDeployCommand: ['bun run scripts/deploy-prepare.ts'],
      healthcheckPath: '/api/v1/health',
      healthcheckTimeout: 60,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 10,
      numReplicas: 1,
      // qa cuts over immediately; production drains gracefully because it serves real traffic
      overlapSeconds: isProduction ? 20 : 0,
      drainingSeconds: isProduction ? 15 : 0,
    },
    env: {
      NODE_ENV: isProduction ? 'production' : 'development',
      DATABASE_URL: db.env.DATABASE_URL,
      API_URL: `https://${railwayVar('RAILWAY_PUBLIC_DOMAIN')}`,
      APP_URL: `https://${railwayVar(`${FRONT_SERVICE}.RAILWAY_PUBLIC_DOMAIN`)}`,
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
      PAGINATION_DEFAULT_PAGE_SIZE: '20',
      PAGINATION_MAX_PAGE_SIZE: '100',
      HITO_AVISO_DIAS: '3,1',
      SEED_ON_DEPLOY: seedOnDeploy ? 'true' : 'false',
      // files live in cloudflare r2, so there is no volume and no local storage dir.
      // env.ts refuses to boot if the driver is s3 and any credential is missing
      STORAGE_DRIVER: 's3',
      S3_REGION: 'auto',
      // a project-level shared variable, so api and jobs cannot drift apart. the value stays
      // on railway; only the intent to use it is in code
      JOB_SECRET: ctx.shared.JOB_SECRET,
      // secrets and credentials are never committed. preserve() adopts whatever the service
      // already has and leaves it unmanaged, so an apply neither prints nor overwrites them
      JWT_SECRET: preserve(),
      RESEND_API_KEY: preserve(),
      EMAIL_FROM: preserve(),
      S3_BUCKET: preserve(),
      S3_ENDPOINT: preserve(),
      S3_ACCESS_KEY_ID: preserve(),
      S3_SECRET_ACCESS_KEY: preserve(),
    },
  })

  const jobs = service(JOBS_SERVICE, {
    source: github(REPO, { branch, checkSuites: true }),
    build: {
      builder: 'RAILPACK',
      watchPatterns: WATCH_PATTERNS,
    },
    deploy: {
      startCommand: 'bun run scripts/run-scheduled-jobs.ts',
      // daily 13:00 UTC. railway cron is UTC only and never finer than 5 minutes
      cronSchedule: '0 13 * * *',
      // a cron container must exit and stay exited
      restartPolicyType: 'NEVER',
      numReplicas: 1,
    },
    env: {
      JOBS_API_URL: `https://${railwayVar(`${API_SERVICE}.RAILWAY_PUBLIC_DOMAIN`)}`,
      // prisma generate reads this at build time, even though the cron never queries
      DATABASE_URL: db.env.DATABASE_URL,
      // same shared variable as the api: a mismatch here means every job call answers 401
      JOB_SECRET: ctx.shared.JOB_SECRET,
    },
  })

  return project(ctx.projectName ?? PROJECT_FALLBACK, {
    resources: [db, api, jobs],
  })
})
