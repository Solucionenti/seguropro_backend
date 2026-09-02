// entrypoint of the railway cron service. it is deliberately standalone: the scheduler
// only needs a url and the job secret, never the full env of the api (db, resend, storage)

const JOB_PATHS = [
  '/api/v1/jobs/notificar-polizas-por-vencer',
  '/api/v1/jobs/notificar-hitos',
] as const

const TIMEOUT_MS = 5 * 60 * 1000

const baseUrl = (process.env.JOBS_API_URL ?? process.env.API_URL ?? '').replace(/\/+$/, '')
const jobSecret = process.env.JOB_SECRET ?? ''

function fail(message: string): never {
  console.error(`[jobs] ${message}`)
  process.exit(1)
}

if (!baseUrl) fail('JOBS_API_URL (or API_URL) is required')
if (jobSecret.length < 32) fail('JOB_SECRET is required and must be at least 32 characters')

async function runJob(path: string): Promise<boolean> {
  const startedAt = Date.now()

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'x-job-secret': jobSecret },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const body = await response.text()
    const elapsed = Date.now() - startedAt

    if (!response.ok) {
      console.error(`[jobs] ${path} failed with ${response.status} in ${elapsed}ms: ${body}`)
      return false
    }

    console.log(`[jobs] ${path} ok in ${elapsed}ms: ${body}`)
    return true
  } catch (error) {
    console.error(`[jobs] ${path} threw:`, error)
    return false
  }
}

// sequential on purpose: both jobs send email and hit the same api instance
const results: boolean[] = []
for (const path of JOB_PATHS) {
  results.push(await runJob(path))
}

// the cron container must exit, otherwise railway skips the next scheduled run
process.exit(results.every(Boolean) ? 0 : 1)
