// railway pre-deploy entrypoint: migrations always, seed only when the environment asks.
// it runs in a throwaway container before the new version takes traffic, so a non-zero exit
// aborts the deploy and leaves the previous version serving

async function run(label: string, cmd: string[]): Promise<void> {
  console.log(`[pre-deploy] ${label}: ${cmd.join(' ')}`)

  const proc = Bun.spawn(cmd, { stdout: 'inherit', stderr: 'inherit' })
  const code = await proc.exited

  if (code !== 0) {
    console.error(`[pre-deploy] ${label} failed with exit code ${code}`)
    process.exit(code)
  }
}

await run('migrate', ['bunx', 'prisma', 'migrate', 'deploy'])

// seeding on every deploy is opt-in so production never does it by accident.
// the seed itself is idempotent, so a repeated run is a no-op
if (process.env.SEED_ON_DEPLOY === 'true') {
  await run('seed', ['bunx', 'prisma', 'db', 'seed'])
} else {
  console.log('[pre-deploy] SEED_ON_DEPLOY is not "true", skipping seed')
}

process.exit(0)
