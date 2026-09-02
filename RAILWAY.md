# Deploying Segur Backend on Railway

Everything in this repo is already wired for Railway. What is left is the dashboard setup.

- Which branch goes where? See [Environments and branches](#environments-and-branches).
- Just showing a demo? Go to [Demo environment](#demo-environment--the-short-path).
- Setting up the real thing? Go to [Dashboard checklist](#dashboard-checklist).

## Shape of the deployment

One Railway **project**, with the same three services in each environment:

| Service | Source | What it does |
|---------|--------|--------------|
| `Postgres` | Railway database template | Managed PostgreSQL. Provides `DATABASE_URL`. |
| `segur-api` | this repo, config `railway.json` | The Elysia API. Public domain, healthcheck, migrations on deploy. |
| `segur-jobs` | this repo, config `railway.jobs.json` | Cron service. Posts the `/api/v1/jobs/*` endpoints once a day and exits. |

`segur-api` and `segur-jobs` deploy from the **same repository and the same commit**. They only
differ in the config-as-code file each one points at.

## Environments and branches

| Railway environment | Git branch | Purpose | Seeded |
|---------------------|-----------|---------|--------|
| `production` (Railway's default) | `main` | Production. **Not set up yet** — nothing deploys here today. | no |
| `dev` | `dev` | QA and demos. This is the one that is live. | yes |

The environment name in Railway must be exactly `dev`, because `railway.json` keys its override
block on that name (`environments.dev`). Rename the environment and the override silently stops
applying.

What actually differs between them:

- **`SEED_ON_DEPLOY`** is `true` in `dev` and unset in `production`. It is a service variable, not
  something `railway.json` can carry.
- **`overlapSeconds` / `drainingSeconds`** are `0` in `dev` so deploys cut over immediately while
  you iterate. `production` keeps the 20 s overlap and 15 s drain, because it is serving traffic
  that should not be dropped mid-request.
- Everything else — builder, pre-deploy, healthcheck, restart policy — is deliberately identical,
  so QA exercises the same deploy path production will.

`main` is currently well behind `dev`. Do not point a production service at it until it has been
brought up to date; a deploy from `main` today would ship old code against a database that
migrations have already moved forward.

CI (`.github/workflows/ci.yml`) runs on pushes to both `main` and `dev`, and on every pull request
regardless of target, so **Wait for CI** has a check suite to gate on in either environment.

## Files in this repo

| File | Purpose |
|------|---------|
| `railpack.json` | Builder config. Pins Bun and lets the Node provider detect the rest. |
| `railway.json` | Config as code for `segur-api`: builder, watch paths, pre-deploy migration, healthcheck, restart policy. |
| `railway.jobs.json` | Config as code for `segur-jobs`: start command and cron schedule. |
| `scripts/deploy-prepare.ts` | The pre-deploy entrypoint: `prisma migrate deploy`, then the seed if `SEED_ON_DEPLOY=true`. |
| `scripts/run-scheduled-jobs.ts` | The cron entrypoint. Standalone — needs only a url and `JOB_SECRET`. |
| `.railwayignore` | Keeps docs and CI files out of the build context. |
| `.github/workflows/ci.yml` | Lint, type-check and tests. Railway waits on this before deploying. |

### How the build works

Railpack detects `bun.lock` and installs with Bun, then runs `prisma generate`. That step is
**not optional**: `generated/` is gitignored, so without it the image has no Prisma client and the
server dies on its first import with `Cannot find module @gen/enums`.

It is wired in twice deliberately — as the `build` script in `package.json`, which Railpack
auto-detects, and explicitly in `railpack.json` under `steps.build.commands` so the build does not
depend on that detection. Running it twice costs ~200 ms; not running it costs the service.

Migrations run as the **pre-deploy command**, in a separate container, before the new version
receives traffic. The command is `bun run scripts/deploy-prepare.ts`, which runs
`prisma migrate deploy` and then, only if `SEED_ON_DEPLOY=true` is set on that service,
`prisma db seed`. A non-zero exit aborts the deploy and the previous version keeps serving.

## Demo environment — the short path

This is the `dev` environment, tracking the `dev` branch. For QA and demos you do not need S3, a
custom domain or the cron service. Five required variables, two of which you generate yourself and
two of which Railway fills in for you.

### Generate the secrets

```bash
bun -e "const s=(n=48)=>{const b=new Uint8Array(n);crypto.getRandomValues(b);return Buffer.from(b).toString('base64url')};console.log('JWT_SECRET='+s());console.log('JOB_SECRET='+s())"
```

Both come out 64 chars, well past the 32-char floor `env.ts` enforces. They are unrelated to each
other and to any third party — nothing external has to know them. Rotating `JWT_SECRET`
invalidates every issued token; rotating `JOB_SECRET` means updating it on `segur-jobs` too.

### Where each value comes from

| Variable | Where you get it |
|----------|------------------|
| `DATABASE_URL` | Railway. Type `${{Postgres.DATABASE_URL}}` — never paste the literal string. |
| `API_URL` | Railway. Type `https://${{RAILWAY_PUBLIC_DOMAIN}}` after generating a domain. |
| `JWT_SECRET` | You generate it, command above. |
| `JOB_SECRET` | You generate it, command above. |
| `RESEND_API_KEY` | <https://resend.com/api-keys> → **Create API Key**, permission **Sending access**. Shown once, copy it immediately. |
| `EMAIL_FROM` | `Segur Demo <onboarding@resend.dev>` until you verify a domain — see the caveat below. |
| `APP_URL` | Your frontend url. Only used to build the password-reset link. |
| `SEED_ON_DEPLOY` | Set it to `true` on the demo service so every deploy re-seeds. |

`NODE_ENV` is validated but never branched on — it only shows up in the boot log. `PORT` is
injected by Railway; do not set it.

### The Resend caveat that will bite a demo

Resend requires a verified domain to send to arbitrary recipients. Until you verify one, the
shared `onboarding@resend.dev` sender **only delivers to the email address you signed up to
Resend with**. Any other recipient comes back as a 403.

So for a demo, either:

- create the demo OWNER and CLIENT accounts with *your own* Resend signup address, so password
  resets and expiry notices actually land, or
- verify a real domain at <https://resend.com/domains> (a handful of DNS records) and send from
  `no-reply@yourdomain.com`.

Nothing else in the API depends on email, so an unverified account still lets you demo every other
flow — the send just fails and is counted in `fallidas` in the job summary.

### Files, without signing up for anything

**Settings → Volumes → Add Volume**, mount path `/app/storage`, then set
`STORAGE_LOCAL_DIR=/app/storage` and keep `STORAGE_DRIVER=local`. Also set `RAILWAY_RUN_UID=0`: a
container running as a non-root uid cannot write into a mounted volume. A volume rules out
replicas, which is fine at `numReplicas: 1`.

### Seed the demo data

Set `SEED_ON_DEPLOY=true` on the demo service and every deploy re-seeds automatically, as part of
the pre-deploy step that already runs the migrations. Leave it unset in production.

The seed is idempotent, so re-running it is a no-op:

- The system admin is matched on `email` + `companyId: null` — its real identity — not on
  `status`. That distinction matters: a `MASTER_ADMIN` has `companyId = null`, and Postgres treats
  nulls as distinct in a unique index, so `@@unique([companyId, email])` does **not** stop a second
  `admin@segurpro.com` from being inserted. Matching on `status: ACTIVE` did exactly that.
- If the admin exists but is `INACTIVE`/`DELETED`, the seed warns and leaves it alone. Deactivating
  the platform admin is a deliberate act and a seed should not silently undo it. If that happens on
  the demo you will have no working login — reactivate the row by hand.

To run it manually instead:

```bash
railway link                       # pick the project, environment and segur-api
railway run bun run db:seed
```

Either way the login is `admin@segurpro.com` / `Admin123!`, role `MASTER_ADMIN`. That is all the
seed creates — company, owners, agents, clients and polizas you create through the API, starting at
`POST /api/v1/auth/register-owner`.

### Skip the cron service for now

Do not create `segur-jobs` for a demo. Trigger the jobs by hand when you want to show them:

```bash
curl -X POST "https://<your-domain>/api/v1/jobs/notificar-polizas-por-vencer" -H "x-job-secret: <JOB_SECRET>"
```

Add `?hoy=YYYY-MM-DD` to replay a date, which is how you demo an expiry notice without waiting for
a policy to actually approach its `fechaVencimiento`.

## Dashboard checklist

### 1. Create the project and the database

1. **New Project → Deploy PostgreSQL**. This creates the `Postgres` service.
2. **Project Settings → Environments → New Environment**, named exactly `dev`. That name is what
   `environments.dev` in `railway.json` keys on. Railway's built-in `production` environment is
   the one that will eventually track `main`.
3. In the same project, **New → GitHub Repo → `segur-back`**. Name the service `segur-api`.

### 2. Configure `segur-api`

- **Settings → Source**: set the deployment branch to the one this environment tracks —
  `main` in `production`, `dev` in `dev`. See [Environments and branches](#environments-and-branches).
- **Settings → Build**: Builder is `Railpack`. The repo already forces it via `railway.json`,
  but set it in the UI too so the very first build uses the right builder.
- **Settings → Config as Code**: leave the path as `railway.json` (the default root lookup).
- **Settings → Networking → Public Networking**: click **Generate Domain**. Note the domain,
  you need it for `API_URL` and for the frontend.
- **Settings → Deploy**: turn on **Wait for CI**. Railway then holds the deploy in `WAITING`
  until the GitHub Actions workflow on that commit passes, and marks it `SKIPPED` if CI fails.
  You will be asked to accept updated GitHub permissions the first time.
- Healthcheck, pre-deploy migration, restart policy and watch paths all come from
  `railway.json` — do not set them by hand.

### 3. Variables for `segur-api`

Use **Variables → New Variable**. Values written as `${{...}}` are Railway reference variables,
type them literally.

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | a fresh random string, 32+ chars |
| `JOB_SECRET` | a fresh random string, 32+ chars (see step 5 about sharing it) |
| `RESEND_API_KEY` | your Resend key |
| `EMAIL_FROM` | `Segur <no-reply@yourdomain.com>` |
| `APP_URL` | the frontend url |
| `API_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `NODE_ENV` | `production` |
| `SEED_ON_DEPLOY` | leave UNSET in `production`; `true` only in `dev` |

Do **not** set `PORT` — Railway injects it and `env.ts` reads it.

Optional, only to override defaults: `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`,
`PASSWORD_RESET_EXPIRATION`, `PAGINATION_*`, `HITO_AVISO_DIAS`,
`STORAGE_SIGNED_URL_TTL_SECONDS`, `STORAGE_MAX_FILE_SIZE_MB`.

### 4. Decide where uploaded files live — required

`STORAGE_DRIVER=local` writes to the container filesystem, which Railway wipes on every deploy.
Uploaded policy and claim files would disappear. Pick one:

- **Recommended — S3-compatible storage** (Cloudflare R2, Backblaze B2, Supabase, AWS). Set
  `STORAGE_DRIVER=s3`, `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
  `S3_REGION`. `env.ts` fails at boot if the driver is `s3` and any of them is missing, so a
  misconfigured deploy never reaches the first upload.
- **Railway Volume**: **Settings → Volumes → Add Volume**, mount path `/app/storage`, then set
  `STORAGE_LOCAL_DIR=/app/storage`. A volume attaches to one instance, so `numReplicas` must
  stay at `1` and horizontal scaling is off the table.

### 5. Create the cron service `segur-jobs`

1. **New → GitHub Repo → `segur-back`** again, in the same project. Name it `segur-jobs`.
2. **Settings → Config as Code**: set the path to `railway.jobs.json`.
3. **Settings → Source**: the same branch as the API in that environment.
4. **Settings → Networking**: do **not** generate a domain. It is not a web service.
5. The cron schedule (`0 13 * * *`, daily 13:00 UTC) comes from `railway.jobs.json`. Change it
   there, not in the UI, or the two disagree.
6. Variables for `segur-jobs`:

| Variable | Value |
|----------|-------|
| `JOBS_API_URL` | `https://${{segur-api.RAILWAY_PUBLIC_DOMAIN}}` |
| `JOB_SECRET` | **the same value as in `segur-api`** |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` — build-time only, `prisma generate` reads it |

The cleanest way to keep `JOB_SECRET` identical in both services is a **Project Settings →
Shared Variables** entry, then reference it from each service. If the two ever drift, the job
endpoints answer 401 and nothing is sent.

Railway cron requires the process to exit; if a run is still `Active` the next one is skipped.
`run-scheduled-jobs.ts` calls `process.exit()` for exactly that reason. The minimum interval
Railway supports is 5 minutes, and schedules are always UTC.

### 6. Optional but recommended

- **Project Settings → Environments → Enable PR Environments**: every pull request gets a full
  throwaway copy of the project, destroyed when the PR is merged or closed.
- **Settings → Deploy → Region**: pick the region closest to your users.

## The CI/CD flow, end to end

```
push / PR ──► GitHub Actions (.github/workflows/ci.yml)
                 lint · type-check · tests against a real Postgres
                     │
                     ├─ fail ──► Railway deploy is SKIPPED
                     │
                     └─ pass ──► Railway builds with Railpack
                                    │
                                    ├─ install (bun) + build (prisma generate)
                                    ├─ pre-deploy: migrate, then seed if SEED_ON_DEPLOY
                                    ├─ healthcheck GET /api/v1/health
                                    └─ traffic switches over, old version drains
```

A failed healthcheck or a failed migration leaves the previous deployment serving.

## Railway CLI

```bash
bun add -g @railway/cli          # or: npm i -g @railway/cli
railway login
railway link                     # pick project, environment, service

railway variables                # inspect what the service actually has
railway logs                     # tail deploy logs
railway ssh                      # shell INSIDE the running container
railway connect Postgres         # psql against the database service
railway run bun run dev          # run locally against Railway's variables
railway up                       # manual deploy of the working tree, bypasses git
```

`railway run` is the fastest way to reproduce a production-only problem: it injects the real
service variables into a local process without ever copying secrets into `.env`. It does NOT work
for anything touching the database — see
[Running commands against a deployed environment](#running-commands-against-a-deployed-environment)
for why, and use `railway ssh` for migrations.

## Testing the cron by hand

```bash
curl -X POST "https://<your-api-domain>/api/v1/jobs/notificar-polizas-por-vencer" \
  -H "x-job-secret: $JOB_SECRET"
```

Both jobs are idempotent — `NotificacionEnviada` has a unique on `(tipo, entidadId, marca)`, so
re-running the same day sends nothing. Add `?hoy=YYYY-MM-DD` to replay a specific day.

## Running commands against a deployed environment

Three different things, and picking the wrong one is the usual source of confusion:

| Command | Where the code runs | Which `DATABASE_URL` it sees |
|---------|--------------------|------------------------------|
| `railway ssh` | **Inside the running container**, on Railway | The internal one. Works out of the box. |
| `railway run <cmd>` | On your laptop, with the service's variables injected | The internal one — **unreachable from your laptop**. |
| `railway connect Postgres` | Opens `psql` against the database service | n/a, it connects for you |

### `railway ssh` — the one you want for migrations and one-off fixes

```bash
railway link                       # project, environment (dev), service (segur-api)
railway ssh

# now inside the container, on Railway's network:
bunx prisma migrate deploy         # apply migrations
bunx prisma db seed                # idempotent, safe to re-run
bunx prisma migrate status         # what has and has not been applied
```

This is the shell to reach for when the database is missing tables, because it runs with the
service's real internal `DATABASE_URL` and needs no public access. `-s/--service` and
`-e/--environment` target a specific service without re-linking.

### `railway run` — and why it fails against the database

`railway run` injects the service's variables into a process on **your machine**. `DATABASE_URL`
points at `postgres.railway.internal`, a hostname that only resolves inside Railway's network, so
anything touching the database fails to connect.

To reach the database from your laptop you have to expose it: the database service's
**Settings → Networking → Public Access** creates a TCP proxy and populates `DATABASE_PUBLIC_URL`.
Then point Prisma at that instead:

```bash
DATABASE_URL="$(railway variables --service Postgres --kv | grep '^DATABASE_PUBLIC_URL=' | cut -d= -f2-)" \
  bunx prisma migrate deploy
```

Public access bills network egress and widens the database's exposure, so prefer `railway ssh`
for routine work and keep the proxy off unless you actually need a local tool (Prisma Studio, a
GUI client) pointed at it.

### `railway connect` — a psql shell

```bash
railway connect Postgres
\dt                                # list tables — empty means migrations never ran
select count(*) from users;
```

Fastest way to answer "did the migrations actually apply".

## Troubleshooting

### `The table 'public.users' does not exist` on login

Prisma `P2021`. The service is up and serving, so the build worked — the database is simply
empty. Migrations never ran against it.

**Unblock it now** ([`railway ssh`](#running-commands-against-a-deployed-environment) runs inside
the container, so it uses the internal `DATABASE_URL` and needs no public access):

```bash
railway ssh
bunx prisma migrate deploy
bunx prisma db seed
```

**Then find out why it did not happen on its own.** Migrations are supposed to run as the
pre-deploy step. Open the latest deploy's logs and search for:

```
[pre-deploy] migrate: bunx prisma migrate deploy
```

- **The line is there, followed by an error** — the migration itself failed. Read the error; the
  deploy should have aborted, so check whether an older deployment is still serving.
- **The line is missing entirely** — `railway.json` is not being applied to this service, so
  `preDeployCommand` does not exist as far as Railway is concerned. Check, in order:
  1. **Settings → Config as Code** — the file path must be `railway.json`. A service created
     before the file existed can have this empty.
  2. **Settings → Deploy → Custom Start Command** and **Pre-Deploy Command** — a value typed into
     the dashboard **overrides** the file. Clear them so `railway.json` wins, or keep the
     dashboard as the single owner and accept that the file is decoration.
  3. Confirm the deployed commit actually contains `railway.json`: **Settings → Source** must
     track `dev`, not `main`. `main` is far behind and has none of the deploy config.

The start command is a quick tell in the logs. `bun run src/index.ts` on its own means
`railway.json` is active. A nested `bun run start` wrapping it means Railpack fell back to
auto-detecting `package.json`, which is the same signal that the config file is being ignored.

### `Cannot find module '@gen/enums'` on boot

```
error: Cannot find module '@gen/enums' from '/app/src/modules/<any>/presentation/controller.ts'
error: script "start" exited with code 1
```

The Prisma client is missing from the image. `@gen/*` maps to `generated/prisma/*`, which is
gitignored and therefore has to be regenerated during every build. Note that `@/` imports
resolved fine before this line — tsconfig paths are working, the files just are not there.

Check, in order:

1. **Is the build config actually in the deployed commit?** `railpack.json`, `railway.json` and
   the `build` script in `package.json` only take effect once they are pushed to the branch the
   service tracks. A tell-tale sign is a doubled error: `bun run start` wrapping
   `bun run src/index.ts` means Railpack fell back to auto-detecting the `start` script instead
   of using `railway.json`, so the config file was not in the commit either.
2. **Did the build log run `prisma generate`?** Look for
   `✔ Generated Prisma Client (7.4.1) to ./generated/prisma` in the Railway build logs. If it is
   absent, the `build` step did not fire.
3. Reproduce locally to be certain it is the same failure:

```bash
rm -rf generated && bun run src/index.ts   # crashes exactly like Railway
bun run build && bun run src/index.ts      # boots
```

`prisma generate` is wired in twice on purpose — as the `build` script in `package.json` (what
Railpack auto-detects) and explicitly in `railpack.json` under `steps.build.commands`. It is
idempotent and takes ~200 ms, and a missing client takes the whole service down.

## Notes

- `segur-jobs` reaches the API over its **public** domain. Railway's private network is
  IPv6-only and the server binds to `0.0.0.0`, so private networking would need
  `app.listen({ port, hostname: '::' })` in `src/index.ts` first. Two requests a day over the
  public edge is not worth that change today.
- `railpack.json` pins Bun to `1.3.14`. If a build ever fails resolving that version, loosen it
  to `"1.3"`.
